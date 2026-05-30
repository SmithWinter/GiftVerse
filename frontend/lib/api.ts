const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function createVideoJob(params: {
  prompt: string;
  imageUrl?: string;
  ratio?: string;
  durationSeconds?: number;
  userId?: string;
  dryRun?: boolean;
}) {
  const response = await fetch(`${API_BASE_URL}/video-processor`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create video job: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function getVideoJob(jobId: string) {
  const response = await fetch(`${API_BASE_URL}/video-processor/${jobId}`);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get video job: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function uploadToCloudinary(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/cloudinary/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to upload to Cloudinary: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  return result.url;
}
