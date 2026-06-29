export interface Settings {
  sensitivity: number    // 0-100: 흰색 감지 허용 범위 (높을수록 더 밝은 범위의 픽셀도 빈 공간으로 판단)
  minArea: number        // 최소 채움 영역 크기 (픽셀 수, 이보다 작은 영역은 무시)
  enclosedOnly: boolean  // true = 밀폐 영역만 채우기 (외곽 배경 제외)
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 55,
  minArea: 20,
  enclosedOnly: true,
}

export type ImageStatus = 'pending' | 'processing' | 'done' | 'error'

export interface ImageItem {
  id: string
  file: File
  name: string
  originalUrl: string
  processedUrl: string | null
  processedBlob: Blob | null
  changedPixels: number
  status: ImageStatus
  error?: string
}
