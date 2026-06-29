# White Area Cleaner

Convert off-white pixels to pure white automatically — entirely in your browser.

Some illustration images have socks, highlights or white objects that look
slightly off-white, grey, cream or anti-aliased. This app finds those near-white
parts and snaps them to clean pure white (`#FFFFFF`) while preserving outlines,
colours and transparent backgrounds.

## Features

- Multiple image upload (drag & drop or click) — PNG, JPG, JPEG, WEBP
- Side-by-side original vs cleaned preview
- Adjustable **white tolerance** and **brightness threshold** sliders
- **Low saturation only** toggle so only near-neutral pixels are affected
- Preserves black outlines, skin tones, coloured areas and PNG transparency
- Download each image individually or **all as a ZIP**
- Per-file processing status
- Minimal, responsive, mobile-friendly UI
- 100% client-side — no backend, no uploads

## How the whitening works

For every pixel the app checks three things (see
[`src/imageProcessing.ts`](src/imageProcessing.ts)):

1. **Bright enough** — the darkest channel must clear the brightness threshold,
   which rejects black outlines, skin, the suitcase and coloured shadows.
2. **Close to white** — the gap between the brightest and darkest channel must be
   within the white tolerance, absorbing cream / grey / anti-aliased edges.
3. **Low saturation** (optional) — rejects pale-but-clearly-tinted highlights.

Matching pixels become `RGB(255, 255, 255)`; the alpha channel is never changed.

## Tech stack

React + TypeScript · Canvas API for pixel processing · JSZip for ZIP download ·
Vite. No backend required.

## Run locally

```bash
npm install
npm run dev      # start dev server
npm run build    # type-check + production build
```
