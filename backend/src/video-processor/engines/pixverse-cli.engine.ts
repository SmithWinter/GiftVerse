import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { VideoJob } from '../video-processor.types';
import type { GenerateVideoResult, VideoEngine } from './video-engine';

type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [k: string]: JsonValue };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function findFirstStringDeep(
  value: JsonValue,
  predicate: (s: string) => boolean,
): string | undefined {
  if (typeof value === 'string') return predicate(value) ? value : undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findFirstStringDeep(item, predicate);
      if (found) return found;
    }
    return undefined;
  }
  if (value && typeof value === 'object') {
    for (const v of Object.values(value)) {
      const found = findFirstStringDeep(v, predicate);
      if (found) return found;
    }
  }
  return undefined;
}

async function runJsonCommand(
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv },
): Promise<JsonValue> {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';

    // Trên Windows, nối toàn bộ lệnh làm 1 string để truyền cho shell
    // Trên Unix-like, dùng args riêng
    let cmd: string;
    let cmdArgs: string[];

    if (isWindows) {
      cmd = ['pixverse', ...args]
        .map((arg) => {
          if (arg.includes(' ') || arg.includes('"')) {
            return `"${arg.replace(/"/g, '\\"')}"`;
          }
          return arg;
        })
        .join(' ');
      cmdArgs = [];
      console.log(`[pixverse] run (Windows): ${cmd}`);
    } else {
      cmd = 'pixverse';
      cmdArgs = args;
      console.log(`[pixverse] run: ${cmd} ${cmdArgs.join(' ')}`);
    }

    const child = spawn(cmd, cmdArgs, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: isWindows,
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });

    child.on('error', (err) => reject(err));
    child.on('close', (code) => {
      if (code !== 0) {
        reject(
          new Error(`pixverse cli failed (exit=${code}): ${stderr || stdout}`),
        );
        return;
      }
      const trimmed = stdout.trim();
      if (!trimmed) {
        reject(new Error('pixverse cli returned empty output'));
        return;
      }
      try {
        resolve(JSON.parse(trimmed) as JsonValue);
      } catch {
        reject(new Error(`pixverse cli did not return valid JSON: ${trimmed}`));
      }
    });
  });
}

export class PixverseCliEngine implements VideoEngine {
  constructor() {}

  async generate(
    job: VideoJob,
    params: { jobDir: string },
  ): Promise<GenerateVideoResult> {
    const promptFinal = job.promptFinal;
    if (!promptFinal) throw new Error('prompt_final is missing');
    console.log(
      `[pixverse] job=${job.id} ratio=${job.ratio} duration=${job.durationSeconds} promptFinalLen=${promptFinal.length}`,
    );

    const args = [
      'create',
      'video',
      '--prompt',
      promptFinal,
      '--model',
      'v6',
      '--quality',
      '720p',
      '--aspect-ratio',
      job.ratio,
      '--duration',
      String(job.durationSeconds),
      '--json',
    ];

    const resultJson = await runJsonCommand(args, { cwd: params.jobDir });

    if (!isRecord(resultJson)) {
      throw new Error('pixverse cli returned invalid result');
    }

    const videoUrl = resultJson['video_url'] as string;
    if (videoUrl) {
      console.log(`[pixverse] completed: job=${job.id} url=${videoUrl}`);
      return { outputUrl: videoUrl };
    }

    const videoId = this.extractVideoId(resultJson);
    if (!videoId) {
      await writeFile(
        join(params.jobDir, 'pixverse.create.json'),
        JSON.stringify(resultJson, null, 2),
        'utf8',
      );
      throw new Error(
        'Cannot extract video_id or video_url from pixverse output',
      );
    }

    console.log(`[pixverse] waiting: job=${job.id} videoId=${videoId}`);

    await runJsonCommand(['task', 'wait', videoId, '--json'], {
      cwd: params.jobDir,
    });

    const downloadDir = join(params.jobDir, 'pixverse');
    await mkdir(downloadDir, { recursive: true });

    const downloadJson = await runJsonCommand(
      ['asset', 'download', videoId, '--dest', downloadDir, '--json'],
      { cwd: params.jobDir },
    );

    const url = findFirstStringDeep(
      downloadJson,
      (s) => /^https?:\/\//i.test(s) && s.toLowerCase().includes('.mp4'),
    );
    const localPath = findFirstStringDeep(downloadJson, (s) =>
      s.toLowerCase().endsWith('.mp4'),
    );

    if (url) return { outputUrl: url };
    if (localPath) return { outputFilePath: localPath };

    await writeFile(
      join(params.jobDir, 'pixverse.asset.json'),
      JSON.stringify(downloadJson, null, 2),
      'utf8',
    );
    throw new Error(
      'Cannot locate MP4 url/path in pixverse asset download output',
    );
  }

  private extractVideoId(value: JsonValue): string | undefined {
    if (typeof value === 'string') return undefined;
    if (!isRecord(value)) return undefined;

    const direct =
      (value['video_id'] as unknown) ??
      value['videoId'] ??
      (isRecord(value['Resp']) ? value['Resp']['video_id'] : undefined);

    if (typeof direct === 'string' && direct.trim()) return direct.trim();
    if (typeof direct === 'number' && Number.isFinite(direct))
      return String(direct);
    return undefined;
  }
}
