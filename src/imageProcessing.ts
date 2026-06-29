import type { Settings } from './types'

export async function processImage(file: File, settings: Settings): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data

  // 밝기 기준: 픽셀의 가장 어두운 채널이 이 값 이상이어야 "밝다"고 판단
  // brightness 0 → minCh=80 (어두운 흰색도), 100 → minCh=235 (거의 순백만)
  const minCh = 80 + (settings.brightness / 100) * 155

  // 색상 분산 기준: R·G·B 최댓값-최솟값이 이 이하여야 "무채색에 가깝다"고 판단
  // sensitivity 0 → maxDiff=5 (순수 무채색만), 100 → maxDiff=90 (연한 컬러까지)
  const maxDiff = settings.lowSatOnly ? 12 : (settings.sensitivity / 100) * 90

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue // 완전 투명은 건드리지 않음
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const minVal = Math.min(r, g, b)
    const maxVal = Math.max(r, g, b)
    if (minVal >= minCh && maxVal - minVal <= maxDiff) {
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      // 알파는 원본 유지
    }
  }

  ctx.putImageData(imageData, 0, 0)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('이미지 인코딩 실패'))),
      'image/png',
    ),
  )
}
