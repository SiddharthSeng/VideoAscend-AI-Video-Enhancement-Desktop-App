# Contributing to VideoAscend

Thanks for your interest in contributing!

## Prerequisites
- Node.js 20+
- npm 9+
- Git

## Local Development

```bash
git clone https://github.com/SiddharthSeng/VideoAscend-AI-Video-Enhancement-Desktop-App
cd videoscend
npm install
npm run dev
```

`npm run dev` starts Vite and Electron together. The app opens as a
compact 480×640 floating panel. Hot-reload works for renderer changes;
restart Electron for main process changes.

## Project Structure

```
videoscend/
├── electron/
│   ├── main.js          # Main process, window, IPC handlers
│   ├── preload.js       # Context bridge (renderer ↔ main)
│   ├── processor.js     # FFmpeg video processing pipeline
│   └── updater.js       # Auto-update via electron-updater
├── src/
│   ├── components/      # All React components
│   ├── context/         # ThemeContext and other providers
│   └── main.jsx         # React entry point
├── scripts/
│   ├── create-icon.js   # Generates icon.png / .ico / .icns
│   └── test-pipeline.js # End-to-end FFmpeg pipeline test
├── assets/              # Generated app icons (do not edit manually)
├── .github/workflows/   # CI/CD — builds on tag push
└── electron-builder.yml # Platform build configuration
```

## Useful Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Electron + Vite dev server |
| `npm run build` | Build React for production |
| `npm run dist:win` | Package Windows installer |
| `npm run dist:mac` | Package macOS dmg (run on macOS) |
| `npm run dist:linux` | Package Linux AppImage + deb |
| `npm run generate-icons` | Regenerate all icon formats |
| `npm run test:pipeline` | Run FFmpeg pipeline integration test |

## Testing

Always run the pipeline test before submitting a PR that touches
anything in `electron/processor.js`:

```bash
npm run test:pipeline
# Must print: ✅ PIPELINE TEST PASSED
```

For UI changes, run `npm run dev` and manually verify:
- All 4 BottomNav tabs navigate correctly
- Drop zone accepts a video file and shows metadata
- Processing view shows real progress (not simulated)
- Theme toggle works in both directions
- AI Advisor shows key-entry screen when no key is saved

## Submitting Changes

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run `npm run test:pipeline` and confirm it passes
5. Commit with a clear message: `git commit -m "feat: add XYZ"`
6. Push and open a Pull Request against `main`

## Commit Message Format

Use conventional commits where possible:
- `feat:` new feature
- `fix:` bug fix
- `chore:` tooling, deps, config
- `docs:` documentation only
- `refactor:` code change with no behaviour change

## Reporting Bugs

Open a GitHub Issue and include:
- Your OS and version
- Steps to reproduce
- What you expected vs what happened
- DevTools console output if relevant (Ctrl+Shift+I in the app)

## AI Advisor

The AI Advisor uses the Anthropic API. To develop against it locally,
enter your own API key inside the app (✨ button → enter key). The key
is stored encrypted in your local electron-store and never touches our
servers or the repo.
