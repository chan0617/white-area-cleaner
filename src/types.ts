export interface Settings {
  sensitivity: number   // 0–100: 배경 색상 허용 오차 (높을수록 더 넓은 범위를 배경으로 인식)
  brightness: number    // 0–100: (reserved, 현재 미사용)
  lowSatOnly: boolean   // true = 객체 내부 빈 공간도 흰색으로 채우기
}

export const DEFAULT_SETTINGS: Settings = {
  sensitivity: 55,
  brightness: 50,
  lowSatOnly: true,
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
