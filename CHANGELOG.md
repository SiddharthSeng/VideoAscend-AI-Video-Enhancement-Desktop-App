# Changelog

All notable changes to VideoAscend are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)

## [6.4.0] — 2025-01-01

### Added
- Compact 480×640 frameless floating panel UI
- Custom TitleBar: pin, theme toggle, minimize, expand, close
- BottomNav (4 tabs): Upscale, Queue, Download, Settings
- GPU hardware acceleration: NVIDIA NVENC, AMD AMF,
  Apple VideoToolbox, Intel QuickSync — auto-detected with CPU fallback
- Batch processing: multi-file drop, sequential queue auto-advance
- Preset system: 5 built-in presets + unlimited user-saved presets
- AI Advisor slide-up sheet powered by Claude (Anthropic API)
  - Optional: encrypted API key stored locally, never leaves device
  - Context-aware opening message based on loaded file + GPU
  - Suggestion chips updated based on current state
  - "Configure for me" — AI applies settings automatically via
    action blocks parsed from responses
  - Three UI states: no key / connected / error with specific messages
- OS notifications on single job and batch completion
- Sound toggle for completion notifications
- Auto-updater: in-app UpdateBanner, download progress,
  one-click install via electron-updater + GitHub Releases
- Dark/Light theme with OS preference detection and manual toggle
- Drag-and-drop queue reordering via @dnd-kit
- Download page with per-platform installer cards
- Keyboard shortcuts: Cmd+O, Cmd+Enter, Escape, Cmd+,
- Global shortcut: Cmd/Ctrl+Shift+V to show/hide window
- System tray: show, queue status, pause, quit
- Startup popIn animation
- Empty state illustrations for Queue view
- CSS confetti burst on batch completion
- Error handling UI: FFmpeg failure card with Ask AI button
- Icon generation script (npm run generate-icons)
- Pipeline integration test (npm run test:pipeline)
- GitHub Actions CI/CD: auto-builds all platforms on version tag

### Changed
- Window is now frameless and compact (480×640) by default
- Left sidebar replaced with compact BottomNav
- AI Advisor redesigned from floating panel to slide-up sheet
- macOS code signing removed — right-click → Open to bypass Gatekeeper

### Fixed
- handleStart TDZ initialization error in keyboard shortcut useEffect
  (resolved by using handleStartRef pattern)
