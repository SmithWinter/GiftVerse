import type { VideoJob } from '../video-processor.types';

export type GenerateVideoResult = {
  outputFilePath?: string;
  outputUrl?: string;
};

export interface VideoEngine {
  generate(
    job: VideoJob,
    params: { jobDir: string; projectYamlPath?: string },
    onProgress?: (progress: number) => void,
  ): Promise<GenerateVideoResult>;
}
