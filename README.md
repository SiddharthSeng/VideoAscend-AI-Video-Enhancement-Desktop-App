<div align="center">
  <img src="assets/icon.png" width="96" height="96" alt="VideoAscend icon"/>
  <h1>VideoAscend</h1>
  <p>AI-powered video super-resolution and frame interpolation<br/>
  Compact desktop app for Windows, macOS, and Linux</p>

  [![Build Status](https://github.com/SiddharthSeng/VideoAscend-AI-Video-Enhancement-Desktop-App/actions/workflows/build.yml/badge.svg)](https://github.com/SiddharthSeng/VideoAscend-AI-Video-Enhancement-Desktop-App/actions)
  [![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)
  [![GitHub Release](https://img.shields.io/github/v/release/SiddharthSeng/VideoAscend-AI-Video-Enhancement-Desktop-App)](https://github.com/SiddharthSeng/VideoAscend-AI-Video-Enhancement-Desktop-App/releases/latest)
  [![Downloads](https://img.shields.io/github/downloads/SiddharthSeng/VideoAscend-AI-Video-Enhancement-Desktop-App/total)](https://github.com/SiddharthSeng/VideoAscend-AI-Video-Enhancement-Desktop-App/releases)
</div>

---

## What it does

VideoAscend takes low-resolution videos and upscales them using
AI-based algorithms, running entirely on your local machine.
No cloud upload. No subscription. No data leaves your computer.

- Upscale 480p anime to 4K using Anime4K or Real-ESRGAN
- Interpolate 24fps video to 60fps or 120fps
- Process multiple files in a queue with drag-and-drop reordering
- GPU-accelerated encoding on NVIDIA, AMD, Intel, and Apple Silicon

---

## Features

| | |
|---|---|
| 🎌 **Upscaling** | Anime4K v4, Real-ESRGAN, Real-CUGAN |
| 🎬 **Interpolation** | RIFE-style via FFmpeg minterpolate |
| ⚡ **GPU acceleration** | NVENC · AMF · VideoToolbox · QuickSync · CPU fallback |
| 📦 **Batch processing** | Multi-file drop, sequential queue |
| 🎨 **Presets** | 5 built-in + unlimited custom |
| 🤖 **AI Advisor** | Claude-powered assistant (optional) |
| 🔄 **Auto-updates** | In-app notification + one-click install |
| 🌙 **Themes** | Dark / Light, follows OS preference |
| 🪟 **Compact UI** | 480×640 floating panel, always-on-top option |

---

## Download

**[→ Latest Release](../../releases/latest)**

| Platform | Download | Notes |
|---|---|---|
| Windows | `VideoAscend-x.x.x-Setup.exe` | NSIS installer, x64 |
| Windows | `VideoAscend-x.x.x-Portable.exe` | No install needed |
| macOS Intel | `VideoAscend-x.x.x-mac-x64.dmg` | macOS 11+ |
| macOS Apple Silicon | `VideoAscend-x.x.x-mac-arm64.dmg` | M1/M2/M3/M4 |
| Linux | `VideoAscend-x.x.x-x86_64.AppImage` | Universal |
| Linux | `VideoAscend-x.x.x-amd64.deb` | Debian / Ubuntu |

### Platform notes

**macOS:** On first launch, right-click the app → **Open**, then
click **Open** in the dialog. This bypasses the unsigned app warning.
You only need to do this once.

**Linux AppImage:**
```bash
chmod +x VideoAscend-*.AppImage
./VideoAscend-*.AppImage
```

**Windows:** If SmartScreen appears, click **More info** → **Run anyway**.

---

## System Requirements

| | Minimum | Recommended |
|---|---|---|
| OS | Windows 10, macOS 11, Ubuntu 20.04 | Windows 11, macOS 13, Ubuntu 22.04 |
| RAM | 4 GB | 16 GB |
| GPU | Any (CPU fallback available) | NVIDIA RTX / AMD RX 6000 / Apple M1+ |
| Storage | 500 MB free | 5 GB+ for output files |

---

## AI Advisor (Optional)

The built-in AI Advisor is powered by Claude (Anthropic).
It is **completely optional** — all video processing works without it.

To enable:
1. Get a free API key at [console.anthropic.com](https://console.anthropic.com)
2. Open VideoAscend → click **✨** in the titlebar
3. Enter your key — it is encrypted and stored locally
4. Your key is never sent anywhere except directly to Anthropic's API

The advisor can recommend algorithms based on your content, estimate
processing time, and apply settings for you automatically.

---

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for full setup instructions.

```bash
git clone https://github.com/SiddharthSeng/VideoAscend-AI-Video-Enhancement-Desktop-App
cd videoscend
npm install
npm run dev
```

---

## License

[AGPL-3.0](LICENSE) — free and open source forever.
Built with Electron, React, FFmpeg, and Sharp.
AI Advisor powered by [Claude](https://anthropic.com).
