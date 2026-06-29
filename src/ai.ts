import { removeBackground, type Config } from '@imgly/background-removal'

// 모델 가중치는 imgly CDN에서 받아 브라우저에서 ONNX/WASM 으로 실행됩니다.
// (우리 서버는 없습니다 — 전부 클라이언트에서 처리)
const config: Config = {
  model: 'isnet_fp16', // 다운로드 크기와 속도의 균형
  output: { format: 'image/png' }, // 투명 배경 유지
}

/** AI 로 배경을 제거해 객체만 남긴 투명 PNG Blob 을 반환한다. */
export function removeImageBackground(file: Blob): Promise<Blob> {
  return removeBackground(file, config)
}
