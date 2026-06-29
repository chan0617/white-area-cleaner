// 앱 전반에서 공유하는 타입 정의

/** 사용자가 조절할 수 있는 설정값 */
export interface Settings {
  /**
   * "빈 공간"으로 판단할 알파(투명도) 기준값 (0–255).
   * 픽셀의 알파가 이 값보다 작으면 비어 있는 것으로 봅니다.
   * 외곽선과 색칠된 영역은 불투명하므로 벽 역할을 해 채우기가 새어 나가지 않습니다.
   */
  alphaThreshold: number
}

/** 기본 설정값 */
export const DEFAULT_SETTINGS: Settings = {
  alphaThreshold: 32,
}

export type ImageStatus = 'pending' | 'processing' | 'done' | 'error'

/** 외곽선 안쪽에서 찾은, 흰색으로 채울 수 있는 "빈 공간" 분석 결과 */
export interface Analysis {
  base: ImageData // 원본 픽셀 (변경하지 않고 보관)
  labelMap: Int32Array // 픽셀별 영역 번호 (0 = 채우기 대상 아님)
  regionCount: number // 찾은 영역 개수
}

/** 업로드된 이미지 하나와 그 처리 상태 */
export interface ImageItem {
  id: string
  file: File
  name: string
  width: number
  height: number
  originalUrl: string
  processedUrl: string | null
  processedBlob: Blob | null
  analysis: Analysis | null
  /** 사용자가 "흰색 제외"로 선택한 영역 번호들 */
  excluded: Set<number>
  status: ImageStatus
  error?: string
}
