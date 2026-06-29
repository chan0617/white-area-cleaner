import type { Settings } from './types'

export async function processImage(
  file: File,
  settings: Settings,
): Promise<{ blob: Blob; changed: number }> {
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

  // 빈 픽셀 판단: 투명 OR 근접 흰색
  // sensitivity 0 → threshold=255(투명만), 100 → threshold=150(밝은 색까지)
  const whiteMin = Math.round(255 - (settings.sensitivity / 100) * 105)

  const isEmpty = (idx: number): boolean => {
    const p = idx * 4
    if (data[p + 3] <= 10) return true   // 투명
    return data[p] >= whiteMin && data[p + 1] >= whiteMin && data[p + 2] >= whiteMin
  }

  // ① 테두리에서 flood-fill → 외곽 배경 탐색
  const outerBg = new Uint8Array(n)
  const stack: number[] = []

  const markOuter = (idx: number) => {
    if (outerBg[idx] || !isEmpty(idx)) return
    outerBg[idx] = 1
    stack.push(idx)
  }

  for (let x = 0; x < W; x++) { markOuter(x); markOuter((H - 1) * W + x) }
  for (let y = 1; y < H - 1; y++) { markOuter(y * W); markOuter(y * W + W - 1) }

  while (stack.length) {
    const idx = stack.pop()!
    const x = idx % W, y = (idx - x) / W
    if (x > 0) markOuter(idx - 1)
    if (x < W - 1) markOuter(idx + 1)
    if (y > 0) markOuter(idx - W)
    if (y < H - 1) markOuter(idx + W)
  }

  // ② 밀폐된 빈 영역 탐색 (연결 컴포넌트)
  const label = new Int32Array(n)
  const regionSize: number[] = [0] // index 0 unused (labels start at 1)
  let nextLabel = 1

  for (let start = 0; start < n; start++) {
    if (label[start] || outerBg[start] || !isEmpty(start)) continue
    const lbl = nextLabel++
    regionSize.push(0)
    label[start] = lbl
    stack.push(start)
    while (stack.length) {
      const idx = stack.pop()!
      regionSize[lbl]++
      const x = idx % W, y = (idx - x) / W
      const visit = (nb: number) => {
        if (label[nb] || outerBg[nb] || !isEmpty(nb)) return
        label[nb] = lbl
        stack.push(nb)
      }
      if (x > 0) visit(idx - 1)
      if (x < W - 1) visit(idx + 1)
      if (y > 0) visit(idx - W)
      if (y < H - 1) visit(idx + W)
    }
  }

  // ③ 최소 크기 조건을 만족하는 밀폐 영역 → 흰색 (#FFFFFF) 채우기
  const { minArea, enclosedOnly } = settings
  let changed = 0

  for (let i = 0; i < n; i++) {
    // enclosedOnly=false이면 외곽 배경도 흰색으로 채움
    const lbl = label[i]
    const isEnclosed = lbl > 0 && regionSize[lbl] >= minArea
    const isOuter = !enclosedOnly && outerBg[i]
    if (!isEnclosed && !isOuter) continue

    const p = i * 4
    data[p] = 255; data[p + 1] = 255; data[p + 2] = 255; data[p + 3] = 255
    changed++
  }

  ctx.putImageData(imageData, 0, 0)
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('이미지 인코딩 실패'))),
      'image/png',
    ),
  )
  return { blob, changed }
}
