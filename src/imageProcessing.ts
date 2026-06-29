import type { Settings } from './types'

function rgbToHsl(r: number, g: number, b: number) {
  const rn = r / 255, gn = g / 255, bn = b / 255
  const max = Math.max(rn, gn, bn), min = Math.min(rn, gn, bn)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0
  switch (max) {
    case rn: h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6; break
    case gn: h = ((bn - rn) / d + 2) / 6; break
    case bn: h = ((rn - gn) / d + 4) / 6; break
  }
  return { h, s, l }
}

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

  // brightness 슬라이더: 0→L≥0.55, 100→L≥0.97
  const minL = 0.55 + (settings.brightness / 100) * 0.42
  // sensitivity 슬라이더: 0→S≤0.04, 100→S≤0.45
  const maxS = settings.lowSatOnly
    ? 0.1
    : 0.04 + (settings.sensitivity / 100) * 0.41

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue // 완전 투명 픽셀은 건드리지 않음
    const { s, l } = rgbToHsl(data[i], data[i + 1], data[i + 2])
    if (l >= minL && s <= maxS) {
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

export function loadObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}
