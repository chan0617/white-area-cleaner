import type { MouseEvent } from 'react'
import type { ImageItem } from '../types'

interface Props {
  item: ImageItem
  onDownload: (item: ImageItem) => void
  onToggleRegion: (item: ImageItem, label: number) => void
}

const STATUS_LABEL: Record<ImageItem['status'], string> = {
  pending: '대기 중…',
  processing: '처리 중…',
  done: '완료',
  error: '오류',
}

/** 원본과 처리 결과를 나란히 보여주는 카드. 결과 이미지를 클릭하면 영역 제외 토글. */
export default function ImageCard({ item, onDownload, onToggleRegion }: Props) {
  /** 클릭 좌표를 원본 픽셀 좌표로 변환해 해당 영역 번호를 찾고 토글한다. */
  const handleClick = (e: MouseEvent<HTMLImageElement>) => {
    if (!item.analysis || item.status !== 'done') return
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()
    const { width, height } = item

    // object-fit: contain 으로 표시되므로 실제 그려진 영역과 여백을 계산
    const naturalRatio = width / height
    const boxRatio = rect.width / rect.height
    let dispW: number, dispH: number, offX: number, offY: number
    if (naturalRatio > boxRatio) {
      dispW = rect.width
      dispH = rect.width / naturalRatio
      offX = 0
      offY = (rect.height - dispH) / 2
    } else {
      dispH = rect.height
      dispW = rect.height * naturalRatio
      offY = 0
      offX = (rect.width - dispW) / 2
    }

    const px = Math.floor(((e.clientX - rect.left - offX) / dispW) * width)
    const py = Math.floor(((e.clientY - rect.top - offY) / dispH) * height)
    if (px < 0 || py < 0 || px >= width || py >= height) return

    const label = item.analysis.labelMap[py * width + px]
    if (label !== 0) onToggleRegion(item, label)
  }

  return (
    <div className="card">
      <div className="card-head">
        <span className="card-name" title={item.name}>
          {item.name}
        </span>
        <span className={`status status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
      </div>

      <div className="compare">
        <figure>
          <img src={item.originalUrl} alt="원본" loading="lazy" />
          <figcaption>원본</figcaption>
        </figure>
        <figure>
          {item.processedUrl ? (
            <img
              src={item.processedUrl}
              alt="처리 결과"
              loading="lazy"
              className="clickable"
              title="흰색을 빼려면 영역을 클릭하세요"
              onClick={handleClick}
            />
          ) : (
            <div className="placeholder">{item.status === 'error' ? '⚠️' : '…'}</div>
          )}
          <figcaption>결과 (클릭해서 제외)</figcaption>
        </figure>
      </div>

      {item.excluded.size > 0 && (
        <p className="card-note">제외한 영역 {item.excluded.size}개</p>
      )}
      {item.error && <p className="card-error">{item.error}</p>}

      <button
        className="btn"
        disabled={item.status !== 'done' || !item.processedBlob}
        onClick={() => onDownload(item)}
      >
        다운로드
      </button>
    </div>
  )
}
