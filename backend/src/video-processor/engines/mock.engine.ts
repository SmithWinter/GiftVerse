import type { VideoJob } from '../video-processor.types';
import type { GenerateVideoResult, VideoEngine } from './video-engine';

export class MockEngine implements VideoEngine {
  async generate(
    job: VideoJob,
    params: { jobDir: string; projectYamlPath?: string },
    onProgress?: (progress: number) => void,
  ): Promise<GenerateVideoResult> {
    console.log(`[mock] Generating video for job=${job.id}`);
    
    // Simulate progress from 0 to 100 over 10 seconds
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (onProgress) onProgress(i);
      console.log(`[mock] Progress: ${i}%`);
    }

    // Return a sample video URL (public domain video)
    return {
      outputUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    };
  }
}
