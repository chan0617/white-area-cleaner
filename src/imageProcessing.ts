import type { Settings } from './types'

/**
 * Decide whether a single pixel is a "near-white" pixel that should be
 * snapped to pure white (255, 255, 255).
 *
 * The idea: off-white socks / clothes / highlights are *bright* and *almost
 * neutral* (R, G and B are all high and close to each other), while things we
 * must preserve are not:
 *   - Black outlines  -> very dark, fails the brightness test.
 *   - Skin / suitcase / coloured shadows -> at least one channel is clearly
 *     lower than the others, so they fail the brightness or saturation test.
 *
 * @param r 0–255 red
 * @param g 0–255 green
 * @param b 0–255 blue
 */
function isNearWhite(r: number, g: number, b: number, s: Settings): boolean {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)

  // 1) Bright enough: even the DARKEST channel must clear the threshold.
  //    Using the min channel is key — skin, suitcase and coloured pixels
  //    always have one comparatively dark channel, so they get rejected here.
  if (min < s.brightnessThreshold) return false

  // 2) Close to white: the gap between the brightest and darkest channel must
  //    be small. This absorbs cream / grey / anti-aliased edges that are only
  //    slightly off from pure white.
  if (max - min > s.whiteTolerance) return false

  // 3) Optional: require low saturation (near-neutral colour). This is a
  //    relative check, so it rejects pale-but-clearly-tinted highlights even
  //    when their absolute channel gap is small.
  if (s.lowSaturationOnly) {
    const saturation = max === 0 ? 0 : (max - min) / max
    if (saturation > 0.1) return false
  }

  return true
}

/**
 * Process one decoded image: every near-white pixel becomes pure white while
 * outlines, colours and the alpha channel are left untouched.
 *
 * Returns a PNG Blob so transparency is always preserved.
 */
export async function processImage(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  settings: Settings,
): Promise<Blob> {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  ctx.drawImage(source, 0, 0, width, height)
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data // Uint8ClampedArray: [r, g, b, a, r, g, b, a, ...]

  // Walk every pixel (4 bytes per pixel).
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3]
    if (a === 0) continue // fully transparent — keep it transparent

    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (isNearWhite(r, g, b, settings)) {
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      // data[i + 3] (alpha) is intentionally left unchanged.
    }
  }

  ctx.putImageData(imageData, 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to encode image'))),
      'image/png',
    )
  })
}

/** Load a File into an HTMLImageElement and report its natural size. */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not load image'))
    }
    img.src = url
  })
}
