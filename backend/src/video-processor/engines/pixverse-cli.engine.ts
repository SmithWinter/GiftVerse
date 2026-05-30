import { spawn } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
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

async function findFirstMp4(root: string): Promise<string | undefined> {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(root, entry.name);
    if (entry.isFile() && entry.name.toLowerCase().endsWith('.mp4'))
      return full;
    if (entry.isDirectory()) {
      const nested = await findFirstMp4(full);
      if (nested) return nested;
    }
  }
  return undefined;
}

async function runJsonCommand(
  command: string,
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv },
): Promise<JsonValue> {
  return new Promise((resolve, reject) => {
    console.log(`[pixverse] run: ${command} ${args.join(' ')}`);
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: { ...process.env, ...options.env },
      shell: false,
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
  constructor(
    private readonly pixverseBin = process.env.PIXVERSE_BIN ?? 'pixverse',
  ) {}

  async generate(
    job: VideoJob,
    params: { jobDir: string },
  ): Promise<GenerateVideoResult> {
    const promptFinal = job.promptFinal;
    if (!promptFinal) throw new Error('prompt_final is missing');
    console.log(
      `[pixverse] job=${job.id} ratio=${job.ratio} duration=${job.durationSeconds} promptFinalLen=${promptFinal.length}`,
    );

    const requestJson = await runJsonCommand(
      this.pixverseBin,
      [
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
        '--no-wait',
        '--json',
      ],
      { cwd: params.jobDir },
    );

    const videoId = this.extractVideoId(requestJson);
    if (!videoId)
      throw new Error(
        'Cannot extract video_id from pixverse create video output',
      );
    console.log(`[pixverse] created: job=${job.id} videoId=${videoId}`);

    await runJsonCommand(
      this.pixverseBin,
      ['task', 'wait', videoId, '--json'],
      { cwd: params.jobDir },
    );
    console.log(`[pixverse] completed: job=${job.id} videoId=${videoId}`);

    const downloadDir = resolve(params.jobDir, 'pixverse');
    await mkdir(downloadDir, { recursive: true });

    const downloadJson = await runJsonCommand(
      this.pixverseBin,
      ['asset', 'download', videoId, '--dest', downloadDir, '--json'],
      {
        cwd: params.jobDir,
      },
    );

    const mp4Path = await findFirstMp4(downloadDir);
    if (mp4Path) {
      console.log(`[pixverse] downloaded: job=${job.id} file=${mp4Path}`);
      return { outputFilePath: mp4Path };
    }

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
