export type VideoJobStatus =
  | 'QUEUED'
  | 'REWRITE_DONE'
  | 'PIPELINE_VALIDATED'
  | 'GENERATING'
  | 'RENDERING'
  | 'UPLOADING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'CANCELED';

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9';

export type VideoSpec = {
  subject: string;
  setting: string;
  action: string;
  camera: string;
  mood: string;
  constraints: string[];
};

export type CreateVideoProcessorRequest = {
  prompt: string;
  userId?: string;
  ratio?: AspectRatio;
  locale?: string;
  durationSeconds?: number;
  dryRun?: boolean;
  imageUrl?: string; // Đường dẫn URL tới ảnh (hoặc file path)
};

export type VideoJob = {
  id: string;
  status: VideoJobStatus;
  createdAt: string;
  updatedAt: string;
  originalPrompt: string;
  userId: string;
  videoSpec?: VideoSpec;
  promptFinal?: string;
  ratio: AspectRatio;
  locale: string;
  durationSeconds: number;
  imageUrl?: string;
  progress?: number; // 0-100
  outputFilePath?: string;
  outputUrl?: string;
  error?: string;
};
