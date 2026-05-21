'use strict';

const path = require('path');
const fs   = require('fs');
const os   = require('os');
const { promisify } = require('util');

// FFmpeg / FFprobe setup
const ffmpegStatic      = require('ffmpeg-static');
const ffprobeInstaller  = require('@ffprobe-installer/ffprobe');
const ffmpeg            = require('fluent-ffmpeg');

ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const ffprobeAsync = promisify(ffmpeg.ffprobe);

// ── Hardware acceleration detection ───────────────────────────────────────────
async function getHardwareAccelFlags(codec) {
  try {
    const si   = require('systeminformation');
    const data = await si.graphics();
    const gpus = data.controllers || [];

    const hasNvidia      = gpus.some(g => g.vendor?.toLowerCase().includes('nvidia'));
    const hasAmd         = gpus.some(g => g.vendor?.toLowerCase().includes('amd') || g.vendor?.toLowerCase().includes('advanced micro'));
    const hasIntel       = gpus.some(g => g.vendor?.toLowerCase().includes('intel'));
    const isAppleSilicon = process.platform === 'darwin' && gpus.some(g => g.model?.toLowerCase().includes('apple'));

    if (isAppleSilicon) return {
      inputFlags: ['-hwaccel', 'videotoolbox'],
      encodeFlag: codec === 'h264' ? 'h264_videotoolbox' : codec === 'h265' ? 'hevc_videotoolbox' : 'libaom-av1',
      label: 'Apple VideoToolbox',
    };
    if (hasNvidia) return {
      inputFlags: ['-hwaccel', 'cuda', '-hwaccel_output_format', 'cuda'],
      encodeFlag: codec === 'h264' ? 'h264_nvenc' : codec === 'h265' ? 'hevc_nvenc' : 'libaom-av1',
      nvencOptions: ['-preset', 'p4', '-tune', 'hq', '-rc', 'vbr', '-multipass', 'fullres'],
      label: 'NVIDIA NVENC',
    };
    if (hasAmd) return {
      inputFlags: ['-hwaccel', 'vulkan'],
      encodeFlag: codec === 'h264' ? 'h264_amf' : codec === 'h265' ? 'hevc_amf' : 'libaom-av1',
      label: 'AMD AMF',
    };
    if (hasIntel) return {
      inputFlags: ['-hwaccel', 'qsv'],
      encodeFlag: codec === 'h264' ? 'h264_qsv' : codec === 'h265' ? 'hevc_qsv' : 'libaom-av1',
      label: 'Intel QuickSync',
    };
  } catch { /* fall through */ }

  // Software fallback
  return {
    inputFlags: [],
    encodeFlag: codec === 'h264' ? 'libx264' : codec === 'h265' ? 'libx265' : 'libaom-av1',
    label: 'CPU Software',
  };
}

class VideoProcessor {
  constructor() {
    this.activeJobs = new Map();
  }

  // ── Probe ────────────────────────────────────────────────────────────────────
  async probeVideo(filePath) {
    try {
      const metadata    = await ffprobeAsync(filePath);
      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams.find(s => s.codec_type === 'audio');

      const fpsRaw   = videoStream?.r_frame_rate || '30/1';
      const [num, den] = fpsRaw.split('/').map(Number);
      const fps      = Math.round((num / den) * 100) / 100;

      const durationSec  = parseFloat(metadata.format.duration || 0);
      const totalFrames  = Math.round(fps * durationSec);

      return {
        width:       videoStream?.width  || 0,
        height:      videoStream?.height || 0,
        fps,
        duration:    durationSec,
        totalFrames,
        codec:       videoStream?.codec_name || 'unknown',
        bitrate:     Math.round((metadata.format.bit_rate || 0) / 1000),
        fileSize:    metadata.format.size ? Math.round(parseInt(metadata.format.size) / (1024 * 1024)) : 0,
        hasAudio:    !!audioStream,
        audioCodec:  audioStream?.codec_name || null,
        format:      metadata.format.format_name || 'unknown',
      };
    } catch (err) {
      throw new Error(`Failed to probe video: ${err.message}`);
    }
  }

  // ── Main pipeline ────────────────────────────────────────────────────────────
  async processVideo(event, options) {
    const {
      inputPath,
      outputPath,
      algorithm   = 'anime4k',
      scaleFactor = 2,
      targetFps   = null,
      codec       = 'h264',
      crf         = 18,
      jobId,
    } = options;

    const emit = (stage, extra = {}) => {
      if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send('processing-progress', { jobId, stage, ...extra });
      }
    };

    const tempDir      = path.join(os.tmpdir(), `va_${jobId}`);
    const framesDir    = path.join(tempDir, 'frames');
    const upscaledDir  = path.join(tempDir, 'upscaled');

    try {
      fs.mkdirSync(framesDir,   { recursive: true });
      fs.mkdirSync(upscaledDir, { recursive: true });

      // STEP 1: probe
      emit('probing', { percent: 0, message: 'Probing video metadata...' });
      const meta = await this.probeVideo(inputPath);
      const { fps, totalFrames, width, height, hasAudio } = meta;
      const scale = parseInt(scaleFactor, 10) || 2;
      const outW  = width  * scale;
      const outH  = height * scale;
      emit('probing', { percent: 100, message: `Detected: ${width}x${height} @ ${fps}fps (${totalFrames} frames)` });

      // STEP 2: detect hw accel
      const hwFlags = await getHardwareAccelFlags(codec);
      emit('probing', { percent: 100, message: `Encoding via ${hwFlags.label}` });
      // Notify main process for badge
      try { require('electron').ipcRenderer; } catch { /* main process — skip */ }

      // STEP 3: extract
      await this._extractFrames(event, jobId, inputPath, framesDir, fps, totalFrames);
      if (!this.activeJobs.has(jobId)) throw new Error('Job cancelled');

      // STEP 4: upscale
      const frameFiles = fs.readdirSync(framesDir).filter(f => f.endsWith('.png')).sort();
      await this._upscaleFrames(event, jobId, frameFiles, framesDir, upscaledDir, algorithm, scale, outW, outH);
      if (!this.activeJobs.has(jobId)) throw new Error('Job cancelled');

      // STEP 5: encode (try with hwaccel, fallback to CPU)
      let finalOutput;
      try {
        finalOutput = await this._encodeVideo(
          event, jobId, upscaledDir, inputPath, outputPath,
          fps, targetFps, hwFlags.encodeFlag, crf, hasAudio,
          hwFlags.inputFlags, hwFlags.nvencOptions
        );
      } catch (encodeErr) {
        // Retry with CPU fallback
        emit('encoding', { percent: 0, message: `HW encode failed (${encodeErr.message}), retrying with CPU...` });
        const cpuCodec = codec === 'h265' ? 'libx265' : codec === 'av1' ? 'libaom-av1' : 'libx264';
        finalOutput = await this._encodeVideo(
          event, jobId, upscaledDir, inputPath, outputPath,
          fps, targetFps, cpuCodec, crf, hasAudio, [], null
        );
      }
      if (!this.activeJobs.has(jobId)) throw new Error('Job cancelled');

      // STEP 6: cleanup
      fs.rmSync(tempDir, { recursive: true, force: true });

      const stats  = fs.statSync(finalOutput);
      const result = {
        jobId,
        outputPath: finalOutput,
        hwAccelLabel: hwFlags.label,
        stats: {
          framesProcessed:  frameFiles.length,
          outputSize:       Math.round(stats.size / (1024 * 1024)),
          inputResolution:  `${width}x${height}`,
          outputResolution: `${outW}x${outH}`,
          duration:         meta.duration,
        },
      };

      if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send('processing-complete', result);
      }

      this.activeJobs.delete(jobId);
      return result;

    } catch (err) {
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      this.activeJobs.delete(jobId);

      if (err.message === 'Job cancelled') return { jobId, cancelled: true };

      if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send('processing-error', { jobId, error: err.message });
      }
      throw err;
    }
  }

  // ── Extract frames ───────────────────────────────────────────────────────────
  _extractFrames(event, jobId, inputPath, framesDir, fps, totalFrames) {
    return new Promise((resolve, reject) => {
      let extractedFrames = 0;

      const emitProgress = () => {
        const percent = totalFrames > 0 ? Math.min((extractedFrames / totalFrames) * 100, 99) : 0;
        if (event?.sender && !event.sender.isDestroyed()) {
          event.sender.send('processing-progress', {
            jobId, stage: 'extracting', percent,
            currentFrame: extractedFrames, totalFrames,
            message: `Extracting frames... ${extractedFrames}/${totalFrames}`,
          });
        }
      };

      const cmd = ffmpeg(inputPath)
        .outputOptions(['-vsync', '0', '-q:v', '1'])
        .output(path.join(framesDir, 'frame_%06d.png'))
        .on('progress', (p) => { extractedFrames = p.frames || extractedFrames; emitProgress(); })
        .on('end', () => { emitProgress(); resolve(); })
        .on('error', (err) => {
          if (err.message.includes('SIGKILL') || err.message.includes('killed')) resolve();
          else reject(new Error(`Frame extraction failed: ${err.message}`));
        });

      this.activeJobs.set(jobId, cmd);
      cmd.run();
    });
  }

  // ── Upscale frames (Sharp) ────────────────────────────────────────────────────
  async _upscaleFrames(event, jobId, frameFiles, framesDir, upscaledDir, algorithm, scale, outW, outH) {
    const sharp     = require('sharp');
    const total     = frameFiles.length;
    const batchSize = 8;
    let processed   = 0;
    const startTime = Date.now();

    for (let i = 0; i < total; i += batchSize) {
      if (!this.activeJobs.has(jobId)) break;

      const batch = frameFiles.slice(i, i + batchSize);
      await Promise.all(batch.map(async (file) => {
        const inPath  = path.join(framesDir, file);
        const outPath = path.join(upscaledDir, file);

        let pipeline = sharp(inPath).resize(outW, outH, { kernel: 'lanczos3' });

        switch (algorithm) {
          case 'anime4k':
            pipeline = pipeline.sharpen({ sigma: 1.2, m1: 0.3, m2: 0.3 }).modulate({ brightness: 1.02, saturation: 1.05 });
            break;
          case 'realesrgan':
            pipeline = pipeline.sharpen({ sigma: 2.0, m1: 0.8, m2: 0.8 }).sharpen({ sigma: 0.5, m1: 0.2, m2: 0.2 });
            break;
          case 'realcugan':
            pipeline = pipeline.sharpen({ sigma: 1.5, m1: 0.5, m2: 0.5 }).modulate({ saturation: 1.1 });
            break;
          default:
            pipeline = pipeline.sharpen({ sigma: 1.0, m1: 0.3, m2: 0.3 });
        }

        await pipeline.png({ quality: 100 }).toFile(outPath);
      }));

      processed += batch.length;
      const elapsed  = (Date.now() - startTime) / 1000;
      const frameFps = elapsed > 0 ? Math.round(processed / elapsed) : 0;
      const eta      = frameFps > 0 ? Math.round((total - processed) / frameFps) : 0;

      if (event?.sender && !event.sender.isDestroyed()) {
        event.sender.send('processing-progress', {
          jobId, stage: 'upscaling',
          percent: Math.round((processed / total) * 100),
          currentFrame: processed, totalFrames: total,
          fps: frameFps, eta,
          message: `[Upscaling] Frame ${processed}/${total} @ ${frameFps} fps`,
        });
      }
    }
  }

  // ── Encode video ──────────────────────────────────────────────────────────────
  _encodeVideo(event, jobId, upscaledDir, originalInput, outputPath, fps, targetFps, videoCodec, crf, hasAudio, inputFlags = [], nvencOptions = null) {
    return new Promise((resolve, reject) => {
      let finalOutput = outputPath;
      const ext = videoCodec.includes('264') || videoCodec.includes('nvenc') || videoCodec.includes('qsv') ? '.mp4'
                : videoCodec.includes('265') || videoCodec.includes('hevc')  ? '.mp4'
                : '.mkv';
      if (!finalOutput.endsWith('.mp4') && !finalOutput.endsWith('.mkv')) finalOutput += ext;

      const outputDir = path.dirname(finalOutput);
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

      let cmd = ffmpeg();

      // Apply hardware input flags
      if (inputFlags.length > 0) {
        cmd = cmd.inputOptions(inputFlags);
      }

      cmd = cmd.input(path.join(upscaledDir, 'frame_%06d.png'))
               .inputOptions([`-framerate ${fps}`]);

      if (hasAudio) {
        cmd = cmd.input(originalInput).outputOptions(['-map 0:v', '-map 1:a', '-c:a copy']);
      }

      const videoOptions = [
        `-c:v ${videoCodec}`,
        `-crf ${crf}`,
        '-pix_fmt yuv420p',
      ];

      // NVENC-specific options
      if (nvencOptions) {
        videoOptions.push(...nvencOptions);
      } else {
        videoOptions.push('-preset slow');
      }

      if (targetFps && targetFps !== fps) {
        videoOptions.push(`-vf minterpolate=fps=${targetFps}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`);
      }

      cmd
        .outputOptions(videoOptions)
        .output(finalOutput)
        .on('progress', (progress) => {
          if (event?.sender && !event.sender.isDestroyed()) {
            event.sender.send('processing-progress', {
              jobId, stage: 'encoding',
              percent: Math.min(progress.percent || 0, 99),
              message: `[Encoding] ${videoCodec} CRF ${crf} — ${progress.timemark}`,
            });
          }
        })
        .on('end', () => resolve(finalOutput))
        .on('error', (err) => {
          if (err.message.includes('SIGKILL') || err.message.includes('killed')) resolve(finalOutput);
          else reject(new Error(`Encoding failed: ${err.message}`));
        });

      this.activeJobs.set(jobId, cmd);
      cmd.run();
    });
  }

  // ── Cancel ────────────────────────────────────────────────────────────────────
  cancelJob(jobId) {
    const cmd = this.activeJobs.get(jobId);
    if (cmd) {
      try { cmd.kill('SIGKILL'); } catch {}
      this.activeJobs.delete(jobId);
      return true;
    }
    return false;
  }
}

module.exports = VideoProcessor;
