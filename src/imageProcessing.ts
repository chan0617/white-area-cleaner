import type { Settings } from './types'

export async function processImage(file: File, settings: Settings): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const W = bitmap.width
  const H = bitmap.height

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(bitmap, 0, 0)
  bitmap.close()

  const imageData = ctx.getImageData(0, 0, W, H)
  const data = imageData.data
  const n = W * H

  // 이미지 모서리 4곳에서 배경색 감지
  const sampleCorners = [0, W - 1, (H - 1) * W, (H - 1) * W + W - 1]
  const corner = sampleCorners[0] * 4
  const bgR = data[corner], bgG = data[corner + 1], bgB = data[corner + 2], bgA = data[corner + 3]

  // sensitivity 슬라이더 → 배경 색상 허용 오차 (0=엄격, 100=넓게)
  const tol = Math.round((settings.sensitivity / 100) * 80)

  // 배경 판별: 투명이거나 모서리 색상과 유사하면 배경
  const isBg = (idx: number): boolean => {
    const p = idx * 4
    if (data[p + 3] < 10) return true  // 투명 픽셀
    if (bgA < 10) {
      // 원본 배경이 투명이면 어두운 픽셀을 배경으로 처리
      return data[p] < 30 && data[p + 1] < 30 && data[p + 2] < 30
    }
    return (
      Math.abs(data[p] - bgR) <= tol &&
      Math.abs(data[p + 1] - bgG) <= tol &&
      Math.abs(data[p + 2] - bgB) <= tol
    )
  }

  // 이미지 테두리에서 flood-fill → 외곽 배경 탐색
  const filled = new Uint8Array(n)
  const stack: number[] = []

  const visit = (idx: number) => {
    if (filled[idx] || !isBg(idx)) return
    filled[idx] = 1
    stack.push(idx)
  }

  for (let x = 0; x < W; x++) {
    visit(x)
    visit((H - 1) * W + x)
  }
  for (let y = 1; y < H - 1; y++) {
    visit(y * W)
    visit(y * W + W - 1)
  }

  while (stack.length) {
    const idx = stack.pop()!
    const x = idx % W
    const y = (idx - x) / W
    if (x > 0) visit(idx - 1)
    if (x < W - 1) visit(idx + 1)
    if (y > 0) visit(idx - W)
    if (y < H - 1) visit(idx + W)
  }

  // "객체 내부 빈 공간도 채우기" 옵션: 외곽 배경 외 배경색 픽셀도 흰색으로
  if (settings.lowSatOnly) {
    for (let i = 0; i < n; i++) {
      if (!filled[i] && isBg(i)) filled[i] = 1
    }
  }

  // 배경 → 흰색 (#FFFFFF, 불투명)
  for (let i = 0; i < n; i++) {
    if (filled[i]) {
      const p = i * 4
      data[p] = 255
      data[p + 1] = 255
      data[p + 2] = 255
      data[p + 3] = 255
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
