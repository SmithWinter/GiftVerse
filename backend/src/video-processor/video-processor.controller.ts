import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { VideoProcessorService } from './video-processor.service';
import type { CreateVideoProcessorRequest } from './video-processor.types';

@Controller('video-processor')
export class VideoProcessorController {
  private readonly logger = new Logger(VideoProcessorController.name);

  constructor(private readonly videoProcessor: VideoProcessorService) {}

  @Post()
  create(@Body() body: CreateVideoProcessorRequest) {
    try {
      this.logger.log(
        `request create: dryRun=${Boolean(body?.dryRun)} userId=${body?.userId ?? 'anonymous'} ratio=${body?.ratio ?? '16:9'} duration=${body?.durationSeconds ?? 8}`,
      );
      if (body?.dryRun) {
        const result = this.videoProcessor.dryRun(body);
        return { mode: 'dry-run', ...result };
      }

      const { jobId, job } = this.videoProcessor.create(body);
      this.logger.log(`job created: jobId=${jobId} status=${job.status}`);
      return { jobId, status: job.status };
    } catch (err) {
      throw new HttpException(
        err instanceof Error ? err.message : String(err),
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get(':jobId')
  get(@Param('jobId') jobId: string) {
    const job = this.videoProcessor.get(jobId);
    if (!job) throw new HttpException('job not found', HttpStatus.NOT_FOUND);

    const downloadUrl =
      job.status === 'SUCCEEDED' && job.outputFilePath
        ? `/video-processor/${job.id}/file`
        : undefined;

    return { ...job, downloadUrl };
  }

  @Get()
  list() {
    return this.videoProcessor.list();
  }

  @Get(':jobId/file')
  async file(@Param('jobId') jobId: string, @Res() res: Response) {
    const job = this.videoProcessor.get(jobId);
    if (!job) throw new HttpException('job not found', HttpStatus.NOT_FOUND);
    if (job.status !== 'SUCCEEDED')
      throw new HttpException('job not ready', HttpStatus.CONFLICT);
    if (!job.outputFilePath)
      throw new HttpException(
        'job has no local output file',
        HttpStatus.NOT_FOUND,
      );

    const filePath = resolve(job.outputFilePath);
    try {
      await access(filePath);
    } catch {
      throw new HttpException('file not found', HttpStatus.NOT_FOUND);
    }

    res.sendFile(filePath);
  }
}
