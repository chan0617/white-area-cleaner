// Shared types for the app.

/** User-adjustable settings that control how aggressively pixels are whitened. */
export interface Settings {
  /**
   * White tolerance (0–120). The maximum allowed difference between the
   * brightest and darkest channel of a pixel. A higher value lets more
   * cream / colour-tinted off-whites count as "white".
   */
  whiteTolerance: number
  /**
   * Brightness threshold (0–255). A pixel is only considered when its
   * darkest channel is at least this bright. This keeps skin tones, the
   * suitcase, coloured shadows and black outlines untouched, because those
   * always have at least one fairly dark channel.
   */
  brightnessThreshold: number
  /**
   * When true, also require the pixel to be near-neutral (low saturation),
   * which avoids whitening pale-but-clearly-coloured highlights.
   */
  lowSaturationOnly: boolean
}

/** Default settings tuned for off-white socks, white clothes and pale highlights. */
export const DEFAULT_SETTINGS: Settings = {
  whiteTolerance: 40,
  brightnessThreshold: 200,
  lowSaturationOnly: true,
}

export type ImageStatus = 'pending' | 'processing' | 'done' | 'error'

/** One uploaded image and its processing state. */
export interface ImageItem {
  id: string
  file: File
  name: string
  originalUrl: string
  processedUrl: string | null
  processedBlob: Blob | null
  status: ImageStatus
  error?: string
}
