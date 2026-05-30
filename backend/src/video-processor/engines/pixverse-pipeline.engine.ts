import { spawn } from 'node:child_process';
import { access, mkdir, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import type { VideoJob } from '../video-processor.types';
import type { GenerateVideoResult, VideoEngine } from './video-engine';

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
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

async function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<void> {
  await new Promise<void>((resolvePromise, rejectPromise) => {
    const child = spawn(command, args, {
      cwd,
      shell: false,
      windowsHide: true,
    });
    let stderr = '';
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk: string) => {
      stderr += chunk;
    });
    child.on('error', (err) => rejectPromise(err));
    child.on('close', (code) => {
      if (code !== 0) {
        rejectPromise(new Error(`pipeline failed (exit=${code}): ${stderr}`));
        return;
      }
      resolvePromise();
    });
  });
}

export class PixversePipelineEngine implements VideoEngine {
  async generate(
    job: VideoJob,
    params: { jobDir: string; projectYamlPath?: string },
  ): Promise<GenerateVideoResult> {
    const pipelineRoot = process.env.PIXVERSE_PIPELINE_ROOT;
    if (!pipelineRoot) {
      throw new Error(
        'Missing PIXVERSE_PIPELINE_ROOT. Point it to pixverse-character-pipeline repo root.',
      );
    }
    if (!params.projectYamlPath) {
      throw new Error('project.yaml is missing');
    }

    const remotionDir = resolve(pipelineRoot, 'remotion');
    const pipelineBin = resolve(remotionDir, 'bin', 'pipeline');

    const hasPipeline = await exists(pipelineBin);
    if (!hasPipeline) {
      throw new Error(`Cannot find pipeline bin at ${pipelineBin}`);
    }

    await mkdir(params.jobDir, { recursive: true });

    const validateArgs = [
      pipelineBin,
      'validate',
      '--config',
      params.projectYamlPath,
    ];
    const planArgs = [pipelineBin, 'plan', '--config', params.projectYamlPath];
    const runArgs = [pipelineBin, 'run', '--config', params.projectYamlPath];

    const nodeBin = process.env.PIPELINE_NODE_BIN ?? process.execPath;
    await runCommand(nodeBin, validateArgs, remotionDir);
    await runCommand(nodeBin, planArgs, remotionDir);
    await runCommand(nodeBin, runArgs, remotionDir);

    const outputDir = resolve(remotionDir, 'output');
    if (!(await exists(outputDir)))
      throw new Error('pipeline output dir not found');

    const mp4 = await findFirstMp4(outputDir);
    if (!mp4)
      throw new Error('Cannot find rendered mp4 under pipeline output/');

    const s = await stat(mp4);
    if (!s.isFile() || s.size === 0) throw new Error('Rendered mp4 is invalid');

    return { outputFilePath: mp4 };
  }
}
