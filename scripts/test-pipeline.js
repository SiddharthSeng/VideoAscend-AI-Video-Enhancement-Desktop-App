/**
 * scripts/test-pipeline.js
 * End-to-end test of the VideoAscend FFmpeg + Sharp processing pipeline.
 * Creates a synthetic video, extracts frames, upscales, and re-encodes.
 * Usage: node scripts/test-pipeline.js  OR  npm run test:pipeline
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const { path: ffprobePath } = require('@ffprobe-installer/ffprobe');
const sharp = require('sharp');

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

// ── Step 1: Create a synthetic test video using FFmpeg ──────────
// Generates a 3-second 480×270 color-bars video — no file needed
async function createTestVideo(outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input('color=c=blue:size=480x270:rate=24')
      .inputOptions(['-f', 'lavfi'])
      .input('sine=frequency=440:sample_rate=44100')
      .inputOptions(['-f', 'lavfi'])
      .outputOptions([
        '-t', '3',
        '-c:v', 'libx264',
        '-crf', '23',
        '-c:a', 'aac',
        '-shortest'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// ── Step 2: Probe the video ─────────────────────────────────────
async function probeVideo(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) return reject(err);
      const video = metadata.streams.find(s => s.codec_type === 'video');
      // r_frame_rate is a fraction like "24/1" — evaluate it safely
      const fpsStr = video.r_frame_rate || '24/1';
      const [num, den] = fpsStr.split('/').map(Number);
      const fps = den ? num / den : num;
      resolve({
        width: video.width,
        height: video.height,
        fps,
        duration: parseFloat(metadata.format.duration),
        totalFrames: Math.ceil(fps * parseFloat(metadata.format.duration))
      });
    });
  });
}

// ── Step 3: Extract frames ──────────────────────────────────────
async function extractFrames(inputPath, framesDir) {
  fs.mkdirSync(framesDir, { recursive: true });
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions(['-vsync', '0'])
      .output(path.join(framesDir, 'frame_%06d.png'))
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// ── Step 4: Upscale frames with Sharp ──────────────────────────
async function upscaleFrames(framesDir, upscaledDir, scaleFactor) {
  fs.mkdirSync(upscaledDir, { recursive: true });
  const files = fs.readdirSync(framesDir)
    .filter(f => f.endsWith('.png'))
    .sort();

  console.log(`  Upscaling ${files.length} frames at ${scaleFactor}x...`);

  // Process in batches of 4
  const batchSize = 4;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    await Promise.all(batch.map(async (file) => {
      const inputFile = path.join(framesDir, file);
      const outputFile = path.join(upscaledDir, file);
      const meta = await sharp(inputFile).metadata();
      await sharp(inputFile)
        .resize(
          meta.width * scaleFactor,
          meta.height * scaleFactor,
          { kernel: sharp.kernel.lanczos3 }
        )
        .sharpen({ sigma: 1.5, m1: 0.5, m2: 0.5 })
        .png()
        .toFile(outputFile);
    }));
    process.stdout.write(
      `\r  Progress: ${Math.min(i + batchSize, files.length)}/${files.length}`
    );
  }
  console.log('\n  ✓ Upscaling complete');
}

// ── Step 5: Encode final video ──────────────────────────────────
async function encodeVideo(framesDir, inputPath, outputPath, fps) {
  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(path.join(framesDir, 'frame_%06d.png'))
      .inputOptions(['-framerate', String(fps)])
      .input(inputPath)
      .outputOptions([
        '-map', '0:v',
        '-map', '1:a?',
        '-c:v', 'libx264',
        '-crf', '18',
        '-preset', 'fast',
        '-c:a', 'copy',
        '-pix_fmt', 'yuv420p'
      ])
      .output(outputPath)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}

// ── Main test runner ────────────────────────────────────────────
async function runPipelineTest() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'videoascend-test-'));
  const testInput = path.join(tmpDir, 'test-input.mp4');
  const framesDir = path.join(tmpDir, 'frames');
  const upscaledDir = path.join(tmpDir, 'upscaled');
  const testOutput = path.join(tmpDir, 'test-output.mp4');

  console.log('VideoAscend Pipeline Test');
  console.log('═'.repeat(40));
  console.log(`Temp dir: ${tmpDir}\n`);

  try {
    console.log('Step 1/5: Creating synthetic test video (480×270, 3s)...');
    await createTestVideo(testInput);
    const inputSize = fs.statSync(testInput).size;
    console.log(`  ✓ Created (${(inputSize / 1024).toFixed(1)} KB)\n`);

    console.log('Step 2/5: Probing video metadata...');
    const meta = await probeVideo(testInput);
    console.log(`  ✓ ${meta.width}×${meta.height} @ ${meta.fps}fps`);
    console.log(`     Duration: ${meta.duration.toFixed(2)}s`);
    console.log(`     Total frames: ${meta.totalFrames}\n`);

    console.log('Step 3/5: Extracting frames...');
    const t1 = Date.now();
    await extractFrames(testInput, framesDir);
    const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.png'));
    console.log(
      `  ✓ Extracted ${frameFiles.length} frames in ${Date.now() - t1}ms\n`
    );

    console.log('Step 4/5: Upscaling frames 2x (Sharp lanczos3)...');
    const t2 = Date.now();
    await upscaleFrames(framesDir, upscaledDir, 2);
    const upscaledFirst = path.join(upscaledDir, frameFiles[0]);
    const upMeta = await sharp(upscaledFirst).metadata();
    console.log(
      `  ✓ Upscaled to ${upMeta.width}×${upMeta.height} in ${Date.now() - t2}ms\n`
    );

    console.log('Step 5/5: Encoding output video...');
    const t3 = Date.now();
    await encodeVideo(upscaledDir, testInput, testOutput, meta.fps);
    const outputSize = fs.statSync(testOutput).size;
    console.log(`  ✓ Encoded in ${Date.now() - t3}ms`);
    console.log(`  ✓ Output size: ${(outputSize / 1024).toFixed(1)} KB\n`);

    // Probe output to verify dimensions
    const outMeta = await probeVideo(testOutput);
    console.log('═'.repeat(40));
    console.log('✅ PIPELINE TEST PASSED');
    console.log(`   Input:  ${meta.width}×${meta.height}`);
    console.log(`   Output: ${outMeta.width}×${outMeta.height}`);
    console.log(`   FPS:    ${outMeta.fps}`);
    console.log(`   Output: ${testOutput}`);

  } catch (err) {
    console.error('\n❌ PIPELINE TEST FAILED');
    console.error(err);
    process.exit(1);
  } finally {
    // Cleanup temp files (comment out to inspect output)
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      console.log('\n  Temp files cleaned up.');
    } catch (_) {}
  }
}

runPipelineTest();
