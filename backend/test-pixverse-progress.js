const { spawn } = require('node:child_process');

const testImageUrl = 'https://res.cloudinary.com/dqnpdbxes/image/upload/v1780125167/cld-sample-5.jpg';
const testPrompt = 'Create a cinematic 8-second video of this scene with warm lighting, slow camera movement, and subtle film grain';

console.log('🧪 Testing Pixverse with --no-wait and progress tracking...');
console.log('');

async function runCommand(args) {
  const stringArgs = args.map(arg => String(arg));
  return new Promise((resolve, reject) => {
    const cmd = process.platform === 'win32' 
      ? ['pixverse', ...stringArgs].map(arg => arg.includes(' ') ? `"${arg.replace(/"/g, '\\"')}"` : arg).join(' ')
      : 'pixverse';

    const child = spawn(cmd, process.platform === 'win32' ? [] : stringArgs, {
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');

    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed (exit ${code}): ${stderr || stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch (e) {
        resolve(stdout);
      }
    });
  });
}

async function testProgress() {
  // Step 1: Create video with --no-wait
  console.log('1️⃣  Creating video with --no-wait...');
  const createArgs = [
    'create',
    'video',
    '--prompt',
    testPrompt,
    '--image',
    testImageUrl,
    '--model',
    'v6',
    '--quality',
    '720p',
    '--aspect-ratio',
    '16:9',
    '--duration',
    '15',
    '--no-wait',
    '--json',
  ];

  const createResult = await runCommand(createArgs);
  console.log('   ✅ Created! Result:', JSON.stringify(createResult, null, 2));
  const videoId = createResult.id || createResult.video_id;
  console.log('   🎬 Video ID:', videoId);
  console.log('');

  // Step 2: Poll for status until completed
  console.log('2️⃣  Polling for status...');
  let completed = false;
  let attempts = 0;
  const maxAttempts = 200;

  while (!completed && attempts < maxAttempts) {
    attempts++;
    await new Promise(r => setTimeout(r, 3000));

    const statusResult = await runCommand(['task', 'status', videoId, '--json']);
    const status = statusResult.status;
    const progress = status === 'Submitted' ? 10 : status === 'Generating' ? Math.min(90, 10 + Math.floor((attempts / maxAttempts) * 80)) : status === 'Completed' ? 100 : 0;

    console.log(`   [${attempts}/${maxAttempts}] Status: ${status}, Estimated Progress: ${progress}%`);

    if (status === 'Completed') {
      console.log('');
      console.log('🎉 Done! Final Result:', JSON.stringify(statusResult, null, 2));
      completed = true;
    } else if (status === 'Failed') {
      throw new Error('Generation failed: ' + JSON.stringify(statusResult));
    }
  }
}

testProgress().catch(console.error);
