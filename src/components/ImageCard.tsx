import type { ImageItem } from '../types'

interface Props {
  item: ImageItem
  onDownload: (item: ImageItem) => void
}

const STATUS_LABEL: Record<ImageItem['status'], string> = {
  pending: 'Waiting…',
  processing: 'Processing…',
  done: 'Done',
  error: 'Error',
}

/** Side-by-side original vs processed preview for one image. */
export default function ImageCard({ item, onDownload }: Props) {
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
          <img src={item.originalUrl} alt="original" loading="lazy" />
          <figcaption>Original</figcaption>
        </figure>
        <figure>
          {item.processedUrl ? (
            <img src={item.processedUrl} alt="processed" loading="lazy" />
          ) : (
            <div className="placeholder">{item.status === 'error' ? '⚠️' : '…'}</div>
          )}
          <figcaption>Cleaned</figcaption>
        </figure>
      </div>

      {item.error && <p className="card-error">{item.error}</p>}

      <button
        className="btn"
        disabled={item.status !== 'done' || !item.processedBlob}
        onClick={() => onDownload(item)}
      >
        Download
      </button>
    </div>
  )
}
