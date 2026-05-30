import { Module } from '@nestjs/common';
import { PromptRewriteService } from './prompt-rewrite.service';
import { VideoProcessorController } from './video-processor.controller';
import { VideoProcessorService } from './video-processor.service';

@Module({
  controllers: [VideoProcessorController],
  providers: [VideoProcessorService, PromptRewriteService],
})
export class VideoProcessorModule {}
