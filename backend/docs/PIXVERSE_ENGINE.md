# Pixverse CLI Video Engine Documentation

## Overview

The Pixverse CLI Video Engine is the core video generation module for GiftVerse, supporting both:
- **Text-to-Video** (prompt-only)
- **Image-to-Video** (prompt + image URL from Cloudinary)

## Architecture

### 1. Core Components

#### `video-processor.types.ts`
Defines shared types across the video module:
```typescript
type VideoJob = {
  jobId: string;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  progress?: number; // 0-100%
  prompt: string;
  imageUrl?: string; // Cloudinary URL for image-to-video
  ratio?: string;
  durationSeconds?: number;
  userId?: string;
  error?: string;
  outputPath?: string;
  downloadUrl?: string;
};

type VideoEngine = {
  generate(
    params: {
      prompt: string;
      imageUrl?: string;
      ratio?: string;
      durationSeconds?: number;
    },
    onProgress?: (progress: number) => void
  ): Promise<string>; // Returns output file path
};
```

#### `video-engine.ts`
Base interface for all video engines (currently only Pixverse CLI implemented).

#### `pixverse-cli.engine.ts`
The main implementation that:
1. Calls `pixverse create --prompt "..." --image "..." --no-wait` to get a task ID
2. Polls `pixverse task status <taskId>` every 3 seconds for updates
3. Estimates progress based on status:
   - `Submitted`: 10%
   - `Generating`: Gradually increases to 95%
   - `Completed`: 100%
4. Downloads the final video using the URL from status response or `pixverse download <taskId>`

## Usage in GiftVerse Flow

### Step 1: Frontend - Upload Image to Cloudinary
The frontend uses `uploadToCloudinary(file: File)` from `lib/api.ts` to upload images securely without exposing Cloudinary credentials:
```javascript
const imageUrl = await uploadToCloudinary(file);
```

### Step 2: Frontend - Create Video Job
The frontend sends a POST request to `/video-processor`:
```javascript
const videoJob = await createVideoJob({
  prompt: "Create a cinematic gift video...",
  imageUrl: "https://res.cloudinary.com/...",
  ratio: "16:9",
  durationSeconds: 15,
  userId: "giftverse-user",
});
```

### Step 3: Frontend - Poll for Progress
The frontend periodically calls `getVideoJob(jobId)` to track status and progress:
```javascript
while (true) {
  const job = await getVideoJob(jobId);
  setProgress(job.progress);
  if (job.status === "SUCCEEDED") {
    setVideoUrl(job.downloadUrl);
    break;
  }
  await new Promise(r => setTimeout(r, 3000));
}
```

### Step 4: Display Video in Gift
The generated video URL is saved with the `SentGift` object and displayed in `app/gift/[giftId]/page.tsx`.

## API Endpoints

### `POST /video-processor`
Create a new video generation job.

**Body**:
```json
{
  "prompt": "Create a cinematic 15-second video...",
  "imageUrl": "https://res.cloudinary.com/...",
  "ratio": "16:9",
  "durationSeconds": 15,
  "userId": "giftverse-user"
}
```

**Response**:
```json
{
  "jobId": "uuid-here",
  "status": "PENDING",
  "progress": 0
}
```

### `GET /video-processor/:jobId`
Get the current status of a video job.

**Response**:
```json
{
  "jobId": "uuid-here",
  "status": "PROCESSING",
  "progress": 55,
  "prompt": "Create a cinematic...",
  "imageUrl": "https://res.cloudinary.com/...",
  "downloadUrl": "/video-processor/uuid/file"
}
```

### `POST /cloudinary/upload`
Upload an image file to Cloudinary (secured via backend).

**Body**: FormData with `file` field.

**Response**:
```json
{
  "url": "https://res.cloudinary.com/..."
}
```

## Configuration

### Environment Variables (backend/.env)
Ensure these are set in your `.env` file:
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `NEXT_PUBLIC_API_URL`: Public URL of your backend

### Defaults
- Default video duration: 15 seconds
- Default ratio: 16:9
- Polling interval: 3 seconds
- Max polling attempts: 300 (~15 minutes)
