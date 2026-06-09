# Angkor Key

A harmonic-mixing music library app inspired by Mixed In Key — built with React, Vite, Tailwind CSS, and Lucide icons.

## Features

- **Camelot Wheel** — click any segment to highlight harmonically compatible keys.
- **Player with waveform** — animated bars, clickable cue points, seek, play/pause, prev/next.
- **Track library** — sortable columns (Key, Energy, Tempo, etc.), color-coded Camelot keys, energy bars.
- **Search** by artist/title and a **Key filter** that dims tracks not compatible with the selected track's key.
- **Sidebar playlists** and My Music sections.

> Audio is simulated (no real files) — the playhead advances based on each track's duration.

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL.

## Build (web)

```bash
npm run build
npm run preview
```

## Desktop app (Electron)

Run in dev (opens a native window):

```bash
npm run electron:dev
```

Package installers:

```bash
npm run dist        # Windows  -> release/Angkor Key Setup x.x.x.exe
npm run dist:mac    # macOS    -> release/Angkor Key-x.x.x.dmg (+ zip)  [must run ON macOS]
npm run dist:linux  # Linux    -> AppImage + deb                       [must run ON Linux]
```

> **Important:** electron-builder cannot cross-compile a macOS `.dmg` from Windows
> (code signing + DMG creation require macOS). Build the Mac app on a Mac, or use a
> macOS CI runner (e.g. GitHub Actions `macos-latest`). The macOS target is configured
> as a universal build (`arm64` + `x64`).

## Project structure

```
src/
  App.jsx                 # layout, state, playback simulation, filtering/sorting
  components/
    Sidebar.jsx           # logo, Camelot wheel, playlists
    CamelotWheel.jsx      # SVG wheel with compatible-key highlighting
    Player.jsx            # transport + meta + actions
    Waveform.jsx          # bars, cue markers, playhead, seek
    TrackTable.jsx        # sortable track grid
  data/
    camelot.js            # key colors, names, compatibility logic
    tracks.js             # mock tracks + waveform generator
```
