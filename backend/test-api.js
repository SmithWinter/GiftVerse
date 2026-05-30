const API_URL = 'http://localhost:3000/video-processor';

const testData = {
  prompt: 'Create a cinematic 15-second video of this scene with warm lighting, slow camera movement, and subtle film grain',
  imageUrl: 'https://res.cloudinary.com/dqnpdbxes/image/upload/v1780125167/cld-sample-5.jpg',
  ratio: '16:9',
  durationSeconds: 15, // This is now the default!
  userId: 'test-user'
};

async function testVideoGeneration() {
  console.log('🧪 Testing video generation with Cloudinary image URL...');
  console.log('Test data:', JSON.stringify(testData, null, 2));
  console.log('');

  try {
    console.log('➡️  Creating video job...');
    const createRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    
    if (!createRes.ok) {
      throw new Error(`Failed to create job: ${createRes.status} - ${await createRes.text()}`);
    }
    
    const createResult = await createRes.json();
    console.log('✅ Job created!', createResult);

    const jobId = createResult.jobId;
    let completed = false, attempts = 0, maxAttempts = 200;
    
    while (!completed && attempts < maxAttempts) {
      attempts++;
      await new Promise(r => setTimeout(r, 3000));
      
      const statusRes = await fetch(`${API_URL}/${jobId}`);
      if (!statusRes.ok) {
        throw new Error(`Failed to get status: ${statusRes.status} - ${await statusRes.text()}`);
      }
      
      const job = await statusRes.json();
      
      console.log(`[${attempts}/${maxAttempts}] Status: ${job.status}, Progress: ${job.progress}%`);
      
      if (job.status === 'SUCCEEDED') {
        console.log('\n🎉 Done! Job:', JSON.stringify(job, null, 2));
        completed = true;
      } else if (job.status === 'FAILED') {
        throw new Error(`Job failed: ${job.error}`);
      }
    }
    
    if (!completed) {
      throw new Error('Job timed out after 200 attempts');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testVideoGeneration();
