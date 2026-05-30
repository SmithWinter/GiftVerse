import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { copyFile, mkdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { PromptRewriteService } from './prompt-rewrite.service';
import { PixverseCliEngine } from './engines/pixverse-cli.engine';
import { PixversePipelineEngine } from './engines/pixverse-pipeline.engine';
import type { VideoEngine } from './engines/video-engine';
import type {
  CreateVideoProcessorRequest,
  VideoJob,
  VideoJobStatus,
} from './video-processor.types';

type EngineType = 'pixverse-cli' | 'pixverse-pipeline';

function nowIso(): string {
  return new Date().toISOString();
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizePathSegment(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return 'anonymous';
  return trimmed.replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 80) || 'anonymous';
}

function resolveRepoRoot(): string {
  const cwd = process.cwd();
  const base = cwd.toLowerCase().endsWith(`${join('backend')}`.toLowerCase())
    ? resolve(cwd, '..')
    : resolve(cwd);
  return base;
}

function resolveFrontendUploadsRoot(): string {
  const configured = process.env.VIDEO_PUBLIC_UPLOADS_ROOT;
  if (configured) return resolve(configured);
  return resolve(resolveRepoRoot(), 'frontend', 'public', 'uploads');
}

@Injectable()
export class VideoProcessorService {
  private readonly logger = new Logger(VideoProcessorService.name);
  private readonly jobs = new Map<string, VideoJob>();
  private readonly queue: string[] = [];
  private runningCount = 0;

  constructor(private readonly promptRewrite: PromptRewriteService) {}

  create(request: CreateVideoProcessorRequest): {
    jobId: string;
    job: VideoJob;
  } {
    const prompt = request.prompt?.trim();
    if (!prompt) throw new Error('prompt is required');

    const userId = sanitizePathSegment(request.userId ?? 'anonymous');
    const ratio = request.ratio ?? '16:9';
    const locale = request.locale ?? 'en';
    const durationSeconds = clampNumber(request.durationSeconds ?? 15, 1, 15);

    const id = randomUUID();
    const job: VideoJob = {
      id,
      status: 'QUEUED',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      originalPrompt: prompt,
      userId,
      ratio,
      locale,
      durationSeconds,
      imageUrl: request.imageUrl,
      progress: 0,
    };

    this.logger.log(
      `enqueue job: jobId=${id} userId=${userId} ratio=${ratio} locale=${locale} duration=${durationSeconds}`,
    );
    this.jobs.set(id, job);
    this.queue.push(id);
    this.kick();

    return { jobId: id, job };
  }

  dryRun(request: CreateVideoProcessorRequest): {
    videoSpec: unknown;
    promptFinal: string;
    projectYaml: string;
  } {
    const prompt = request.prompt?.trim();
    if (!prompt) throw new Error('prompt is required');

    const userId = sanitizePathSegment(request.userId ?? 'anonymous');
    const ratio = request.ratio ?? '16:9';
    const locale = request.locale ?? 'en';
    const durationSeconds = clampNumber(request.durationSeconds ?? 15, 1, 15);

    const spec = this.promptRewrite.normalizeToSpec(prompt, {
      ...request,
      ratio,
      locale,
      durationSeconds,
    });
    const promptFinal = this.promptRewrite.rewriteToPromptFinal(spec, {
      ...request,
      ratio,
      locale,
      durationSeconds,
    });
    const projectYaml = this.promptRewrite.toProjectYaml({
      projectSlug: `giftverse-${locale}-${ratio}-${durationSeconds}s`,
      ratio,
      locale,
      durationSeconds,
      promptFinal,
    });

    return { videoSpec: { ...spec, userId }, promptFinal, projectYaml };
  }

  get(jobId: string): VideoJob | undefined {
    return this.jobs.get(jobId);
  }

  list(): VideoJob[] {
    return Array.from(this.jobs.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  private async kick(): Promise<void> {
    const maxConcurrency = clampNumber(
      Number(process.env.VIDEO_MAX_CONCURRENCY ?? 1),
      1,
      8,
    );
    if (this.runningCount >= maxConcurrency) return;
    const nextId = this.queue.shift();
    if (!nextId) return;

    const job = this.jobs.get(nextId);
    if (!job) return;

    this.runningCount += 1;
    try {
      this.logger.log(
        `start job: jobId=${job.id} concurrency=${this.runningCount}/${maxConcurrency}`,
      );
      await this.processJob(job);
    } finally {
      this.runningCount -= 1;
      if (this.queue.length > 0) void this.kick();
    }
  }

  private updateJob(jobId: string, patch: Partial<VideoJob>): void {
    const prev = this.jobs.get(jobId);
    if (!prev) return;
    const next: VideoJob = { ...prev, ...patch, updatedAt: nowIso() };
    this.jobs.set(jobId, next);
    if (patch.status && patch.status !== prev.status) {
      this.logger.log(
        `status: jobId=${jobId} ${prev.status} -> ${patch.status}`,
      );
    }
  }

  private resolveJobsRoot(): string {
    const configured = process.env.VIDEO_JOBS_DIR;
    if (configured) return resolve(configured);

    const cwd = process.cwd();
    const inBackend = cwd
      .toLowerCase()
      .endsWith(`${join('backend')}`.toLowerCase());
    if (inBackend) return resolve(cwd, '.video-jobs');
    return resolve(cwd, 'backend', '.video-jobs');
  }

  private async processJob(job: VideoJob): Promise<void> {
    try {
      const promptFinal = job.originalPrompt;

      this.updateJob(job.id, {
        status: 'GENERATING',
        promptFinal,
      });

      const jobsRoot = this.resolveJobsRoot();
      const jobDir = resolve(jobsRoot, job.id);
      await mkdir(jobDir, { recursive: true });

      const engine = this.resolveEngine();

      const result = await engine.generate(
        { ...job, promptFinal },
        {
          jobDir,
        },
        (progress: number) => {
          this.updateJob(job.id, { progress });
        },
      );

      this.updateJob(job.id, { status: 'UPLOADING' });

      const persisted = await this.persistOutputToFrontendUploads(job.id, {
        userId: job.userId,
        jobDir,
        outputFilePath: result.outputFilePath,
        outputUrl: result.outputUrl,
      });

      this.updateJob(job.id, {
        status: 'SUCCEEDED',
        outputFilePath: persisted.outputFilePath,
        outputUrl: persisted.outputUrl,
      });
      this.logger.log(`done: jobId=${job.id} outputUrl=${persisted.outputUrl}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`failed: jobId=${job.id} error=${message}`);
      this.updateJob(job.id, {
        status: 'FAILED',
        error: message,
      });
    }
  }

  private resolveEngine(): VideoEngine {
    const engineType = (process.env.VIDEO_ENGINE ??
      'pixverse-cli') as EngineType;
    if (engineType === 'pixverse-pipeline') return new PixversePipelineEngine();
    return new PixverseCliEngine();
  }

  private engineStartStatus(engine: VideoEngine): VideoJobStatus {
    const name = engine.constructor.name;
    if (name === 'PixversePipelineEngine') return 'PIPELINE_VALIDATED';
    return 'GENERATING';
  }

  private async persistOutputToFrontendUploads(
    jobId: string,
    params: {
      userId: string;
      jobDir: string;
      outputFilePath?: string;
      outputUrl?: string;
    },
  ): Promise<{ outputFilePath: string; outputUrl: string }> {
    const userId = sanitizePathSegment(params.userId);
    const uploadsRoot = resolveFrontendUploadsRoot();
    const userDir = resolve(uploadsRoot, userId);
    await mkdir(userDir, { recursive: true });

    const destFilePath = resolve(userDir, `${jobId}.mp4`);
    const destUrl = `/uploads/${encodeURIComponent(userId)}/${encodeURIComponent(jobId)}.mp4`;

    const sourceFilePath = params.outputFilePath
      ? resolve(params.outputFilePath)
      : undefined;
    if (sourceFilePath) {
      await copyFile(sourceFilePath, destFilePath);
      await this.assertNonEmptyFile(destFilePath);
      return { outputFilePath: destFilePath, outputUrl: destUrl };
    }

    if (params.outputUrl) {
      const tempFilePath = resolve(params.jobDir, 'download.mp4');
      await this.downloadToFile(params.outputUrl, tempFilePath);
      await copyFile(tempFilePath, destFilePath);
      await this.assertNonEmptyFile(destFilePath);
      return { outputFilePath: destFilePath, outputUrl: destUrl };
    }

    throw new Error('No outputFilePath/outputUrl returned from engine');
  }

  private async assertNonEmptyFile(filePath: string): Promise<void> {
    const s = await stat(filePath);
    if (!s.isFile() || s.size === 0) throw new Error('Saved mp4 is invalid');
  }

  private async downloadToFile(
    url: string,
    destFilePath: string,
  ): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download video (status=${res.status})`);
    }
    if (!res.body) throw new Error('Download response has no body');

    await pipeline(
      Readable.fromWeb(res.body as any),
      createWriteStream(destFilePath),
    );
  }
}
