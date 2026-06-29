import type { ImageItem } from '../types'

interface Props {
  item: ImageItem
  onDownload: (item: ImageItem) => void
}

const STATUS_LABEL: Record<ImageItem['status'], string> = {
  pending: '대기 중…',
  processing: '처리 중…',
  done: '완료',
  error: '오류',
}

export default function ImageCard({ item, onDownload }: Props) {
  return (
    <div className="card">
      <div className="card-head">
        <span className="card-name" title={item.name}>{item.name}</span>
        <span className={`status status-${item.status}`}>{STATUS_LABEL[item.status]}</span>
      </div>

      <div className="compare">
        <figure>
          <img src={item.originalUrl} alt="원본" loading="lazy" />
          <figcaption>원본</figcaption>
        </figure>
        <figure>
          {item.processedUrl ? (
            <img src={item.processedUrl} alt="변환 결과" loading="lazy" />
          ) : (
            <div className="placeholder">
              {item.status === 'error' ? '⚠️' : item.status === 'processing' ? '⏳' : '…'}
            </div>
          )}
          <figcaption>결과 (흰색 채움)</figcaption>
        </figure>
      </div>

      {item.status === 'done' && (
        <p className="card-note">
          {item.changedPixels > 0
            ? `${item.changedPixels.toLocaleString()}개 픽셀 채움`
            : '채울 빈 공간 없음 — 민감도를 높여보세요'}
        </p>
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
