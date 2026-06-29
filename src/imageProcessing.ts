import type { Analysis } from './types'

/**
 * 이미지를 분석해 "외곽선 안쪽에 갇힌 빈(투명) 영역"을 찾아 영역별 번호를 매깁니다.
 * 실제 색칠은 하지 않고, 어디를 채울 수 있는지 지도(labelMap)만 만듭니다.
 *
 * 동작 방식:
 *   1. "빈 공간" = 알파가 alphaThreshold 보다 작은 픽셀. 불투명한 외곽선/색칠은 벽.
 *   2. 이미지 테두리에서 시작해 연결된 빈 픽셀을 flood-fill → "바깥 배경"으로 표시.
 *   3. 바깥 배경에 닿지 못한 빈 픽셀 = 안쪽에 갇힌 빈 공간. 연결된 덩어리마다
 *      서로 다른 번호(1, 2, 3 …)를 부여 → 나중에 영역 단위로 채우거나 제외할 수 있음.
 */
export function analyzeImage(
  source: ImageBitmap | HTMLImageElement,
  width: number,
  height: number,
  alphaThreshold: number,
): Analysis {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('Canvas 2D 컨텍스트를 사용할 수 없습니다')

  ctx.drawImage(source, 0, 0, width, height)
  const base = ctx.getImageData(0, 0, width, height)
  const data = base.data

  const n = width * height
  const isEmpty = (idx: number) => data[idx * 4 + 3] < alphaThreshold

  // 1~2) 테두리에서 시작하는 바깥 배경 flood-fill
  const outside = new Uint8Array(n)
  const stack: number[] = []
  const seedOutside = (idx: number) => {
    if (isEmpty(idx) && outside[idx] === 0) {
      outside[idx] = 1
      stack.push(idx)
    }
  }
  for (let x = 0; x < width; x++) {
    seedOutside(x)
    seedOutside((height - 1) * width + x)
  }
  for (let y = 0; y < height; y++) {
    seedOutside(y * width)
    seedOutside(y * width + width - 1)
  }
  while (stack.length) {
    const idx = stack.pop()!
    const x = idx % width
    const y = (idx - x) / width
    if (x > 0) seedOutside(idx - 1)
    if (x < width - 1) seedOutside(idx + 1)
    if (y > 0) seedOutside(idx - width)
    if (y < height - 1) seedOutside(idx + width)
  }

  // 3) 안쪽에 갇힌 빈 영역을 연결 덩어리(connected component)별로 번호 매기기
  const labelMap = new Int32Array(n) // 0 = 채우기 대상 아님
  let regionCount = 0
  for (let start = 0; start < n; start++) {
    if (outside[start] === 1 || labelMap[start] !== 0 || !isEmpty(start)) continue
    regionCount++
    labelMap[start] = regionCount
    stack.push(start)
    while (stack.length) {
      const idx = stack.pop()!
      const x = idx % width
      const y = (idx - x) / width
      const visit = (nb: number) => {
        if (outside[nb] === 0 && labelMap[nb] === 0 && isEmpty(nb)) {
          labelMap[nb] = regionCount
          stack.push(nb)
        }
      }
      if (x > 0) visit(idx - 1)
      if (x < width - 1) visit(idx + 1)
      if (y > 0) visit(idx - width)
      if (y < height - 1) visit(idx + width)
    }
  }

  return { base, labelMap, regionCount }
}

/**
 * 분석 결과로부터 최종 이미지를 만듭니다.
 * 제외 목록(excluded)에 없는 영역만 흰색(불투명)으로 채웁니다.
 * 색칠된 영역과 바깥 배경, 그리고 제외된 영역은 원본 그대로 둡니다.
 */
export function renderResult(
  analysis: Analysis,
  width: number,
  height: number,
  excluded: Set<number>,
): Promise<Blob> {
  const { base, labelMap } = analysis
  // 원본을 복사해서 작업 (원본 데이터는 보존)
  const out = new Uint8ClampedArray(base.data)
  for (let idx = 0; idx < labelMap.length; idx++) {
    const label = labelMap[idx]
    if (label !== 0 && !excluded.has(label)) {
      const p = idx * 4
      out[p] = 255
      out[p + 1] = 255
      out[p + 2] = 255
      out[p + 3] = 255
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(new ImageData(out, width, height), 0, 0)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('이미지 인코딩에 실패했습니다'))),
      'image/png',
    )
  })
}

/** File 을 HTMLImageElement 로 불러옵니다. */
export function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('이미지를 불러올 수 없습니다'))
    }
    img.src = url
  })
}
