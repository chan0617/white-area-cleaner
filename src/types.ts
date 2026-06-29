export interface Settings {
  sensitivity: number   // 0–100: 채도 허용 상한 (높을수록 더 많이 변환)
  brightness: number    // 0–100: 최소 밝기 기준 (높을수록 더 밝은 픽셀만 변환)
  lowSatOnly: boolean   // 저채도(무채색) 영역만 변경
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 50,
  brightness: 45,
  lowSatOnly: false,
}

export type ImageStatus = 'pending' | 'processing' | 'done' | 'error'

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
