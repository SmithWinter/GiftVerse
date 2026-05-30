import { spawn } from 'node:child_process';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
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

function cleanOutputForJson(input: any): string {
  // Nếu input đã là object, trả về stringify của nó
  if (typeof input === 'object' && input !== null) {
    return JSON.stringify(input);
  }
  
  // Nếu không phải string, ép về string
  let output = String(input);
  
  // Loại bỏ ANSI color codes và các ký tự điều khiển
  let cleaned = output
    .replace(/\x1B\[[0-9;]*[mGKH]/g, '') // Loại bỏ color codes
    .replace(/\x07/g, '') // Loại bỏ bell
    .replace(/\r/g, '') // Loại bỏ carriage return
    .replace(/\x1B\[.*?[a-zA-Z]/g, ''); // Loại bỏ các ANSI sequence khác

  // Tìm phần bắt đầu bằng { hoặc [
  const jsonStart = cleaned.indexOf('{');
  const jsonArrStart = cleaned.indexOf('[');
  let startIdx = -1;
  
  if (jsonStart !== -1 && jsonArrStart !== -1) {
    startIdx = Math.min(jsonStart, jsonArrStart);
  } else if (jsonStart !== -1) {
    startIdx = jsonStart;
  } else if (jsonArrStart !== -1) {
    startIdx = jsonArrStart;
  }
  
  if (startIdx === -1) return cleaned;
  
  // Tìm phần kết thúc bằng } hoặc ]
  let braceCount = 0;
  let bracketCount = 0;
  let endIdx = -1;
  let inJson = false;
  
  for (let i = startIdx; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char === '{') { braceCount++; inJson = true; }
    if (char === '[') { bracketCount++; inJson = true; }
    if (char === '}') braceCount--;
    if (char === ']') bracketCount--;
    
    if (inJson && braceCount === 0 && bracketCount === 0) {
      endIdx = i + 1;
      break;
    }
  }
  
  if (endIdx === -1) return cleaned.slice(startIdx);
  
  return cleaned.slice(startIdx, endIdx);
}

async function runJsonCommand(
  args: string[],
  options: { cwd: string; env?: NodeJS.ProcessEnv },
): Promise<JsonValue> {
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === 'win32';
    const pixverseBin = process.env.PIXVERSE_BIN || 'pixverse';

    let fullCommand: string;
    
    if (isWindows) {
      // Trên Windows, nối toàn bộ lệnh làm 1 string
      fullCommand = `${pixverseBin} ${args.map(arg => {
        if (arg.includes(' ') || arg.includes('"') || arg.includes('\'')) {
          return `"${arg.replace(/"/g, '\\"')}"`;
        }
        return arg;
      }).join(' ')}`;
      console.log(`[pixverse] run (Windows): ${fullCommand}`);
    } else {
      // Trên Unix, dùng cmd và args riêng
      fullCommand = `${pixverseBin} ${args.join(' ')}`;
      console.log(`[pixverse] run: ${fullCommand}`);
    }

    const child = spawn(fullCommand, [], {
      cwd: options.cwd,
      env: { 
        ...process.env, 
        ...options.env,
        NO_COLOR: '1', // Tắt màu output
        FORCE_COLOR: '0'
      },
      shell: true, // Bắt buộc dùng shell
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
      
      console.log(`[pixverse] raw stdout: ${JSON.stringify(stdout)}`);
      console.log(`[pixverse] raw stderr: ${JSON.stringify(stderr)}`);
      
      // Giải mã stdout trước: xử lý trường hợp JSON lồng nhau
      let processedStdout = stdout;
      
      // Thử parse nhiều lần cho đến khi không còn được nữa
      for (let i = 0; i < 3; i++) {
        const trimmed = processedStdout.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          try {
            processedStdout = JSON.parse(trimmed);
          } catch {
            break;
          }
        } else {
          break;
        }
      }
      
      // Nếu processedStdout đã là object, trả về trực tiếp!
      if (typeof processedStdout === 'object' && processedStdout !== null) {
        console.log(`[pixverse] already an object: ${JSON.stringify(processedStdout)}`);
        resolve(processedStdout as JsonValue);
        return;
      }
      
      const cleaned = cleanOutputForJson(processedStdout);
      console.log(`[pixverse] cleaned output: ${JSON.stringify(cleaned)}`);
      
      if (!cleaned) {
        reject(new Error('pixverse cli returned empty output'));
        return;
      }
      
      try {
        resolve(JSON.parse(cleaned) as JsonValue);
        return;
      } catch (parseError) {
        console.error(`[pixverse] parse error: ${parseError}`);
        console.error(`[pixverse] cleaned content: ${JSON.stringify(cleaned)}`);
        reject(new Error(`pixverse cli did not return valid JSON: ${JSON.stringify(cleaned)}`));
      }
    });
  });
}

export class PixverseCliEngine implements VideoEngine {
  constructor() {}

  async generate(
    job: VideoJob,
    params: { jobDir: string },
    onProgress?: (progress: number) => void,
  ): Promise<GenerateVideoResult> {
    let promptFinal = job.promptFinal;
    if (!promptFinal) throw new Error('prompt_final is missing');
    
    // Làm sạch prompt: loại bỏ ký tự đặc biệt, xuống dòng, quote
    promptFinal = promptFinal
      .replace(/[\n\r\t"]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500); // Giới hạn 500 ký tự
      
    console.log(
      `[pixverse] job=${job.id} ratio=${job.ratio} duration=${job.durationSeconds} promptFinalLen=${promptFinal.length} imageUrl=${job.imageUrl || 'none'}`,
    );
    console.log(`[pixverse] cleaned prompt: ${promptFinal}`);

    // Step 1: Create video with --no-wait
    const createArgs: string[] = [
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
      String(Math.min(10, job.durationSeconds)), // Giới hạn max 10s
      '--no-wait',
      '--json',
    ];

    if (job.imageUrl) {
      createArgs.push('--image', job.imageUrl);
    }

    const createResult = await runJsonCommand(createArgs, {
      cwd: params.jobDir,
    });

    if (!isRecord(createResult)) {
      throw new Error('pixverse cli returned invalid result');
    }

    const videoId = this.extractVideoId(createResult);
    if (!videoId) {
      await writeFile(
        join(params.jobDir, 'pixverse.create.json'),
        JSON.stringify(createResult, null, 2),
        'utf8',
      );
      throw new Error('Cannot extract video_id from pixverse output');
    }

    console.log(`[pixverse] submitted: job=${job.id} videoId=${videoId}`);
    if (onProgress) onProgress(0);

    // Step 2: Poll for status until completed
    let statusResult: any;
    let progress = 0;
    const maxPolls = 200;
    const pollIntervalMs = 3000;
    let pollCount = 0;

    while (pollCount < maxPolls) {
      pollCount++;
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

      statusResult = await runJsonCommand(
        ['task', 'status', String(videoId), '--json'],
        { cwd: params.jobDir },
      );

      if (!isRecord(statusResult)) continue;

      const status = statusResult['status'] as string;
      console.log(`[pixverse] status: job=${job.id} status=${status}`);

      // Estimate progress based on status
      if (status === 'Submitted' || status === 'submitted') {
        progress = 10;
      } else if (status === 'Generating' || status === 'processing') {
        // Simulate gradual progress from 10% to 90%
        progress = Math.min(90, 10 + Math.floor((pollCount / maxPolls) * 80));
      } else if (status === 'Completed' || status === 'completed') {
        progress = 100;
      }

      if (onProgress) onProgress(progress);

      if (status === 'Completed' || status === 'completed') {
        break;
      } else if (status === 'Failed' || status === 'failed') {
        throw new Error(
          `Pixverse generation failed: ${JSON.stringify(statusResult)}`,
        );
      }
    }

    if (
      !statusResult ||
      !(
        statusResult['status'] === 'Completed' ||
        statusResult['status'] === 'completed'
      )
    ) {
      throw new Error('Pixverse generation timed out');
    }

    // Step 3: Download the video (or use direct video_url if available)
    const videoUrl = statusResult['video_url'] as string;
    if (videoUrl) {
      console.log(`[pixverse] completed: job=${job.id} url=${videoUrl}`);
      return { outputUrl: videoUrl };
    }

    // Fallback to asset download if video_url not in status
    console.log(
      `[pixverse] downloading asset: job=${job.id} videoId=${videoId}`,
    );
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
      value['id'] ??
      (isRecord(value['Resp']) ? value['Resp']['video_id'] : undefined);

    if (typeof direct === 'string' && direct.trim()) return direct.trim();
    if (typeof direct === 'number' && Number.isFinite(direct))
      return String(direct);
    return undefined;
  }
}
