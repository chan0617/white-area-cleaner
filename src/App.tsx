import { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import UploadArea from './components/UploadArea'
import SettingsPanel from './components/SettingsPanel'
import ImageCard from './components/ImageCard'
import { loadImage, processImage } from './imageProcessing'
import { DEFAULT_SETTINGS, type ImageItem, type Settings } from './types'

let idCounter = 0
const nextId = () => `img-${++idCounter}-${Date.now()}`

/** Replace ".jpg/.png/…" with "-clean.png" for downloads. */
function cleanName(name: string) {
  return name.replace(/\.[^.]+$/, '') + '-clean.png'
}

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [zipping, setZipping] = useState(false)

  // Keep a live ref to settings so the async processing loop always reads the
  // latest values without being part of its dependency list.
  const settingsRef = useRef(settings)
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  /** Run (or re-run) the whitening pipeline over the given items. */
  const runProcessing = async (targets: ImageItem[]) => {
    for (const target of targets) {
      setItems((prev) =>
        prev.map((it) => (it.id === target.id ? { ...it, status: 'processing' } : it)),
      )
      try {
        const img = await loadImage(target.file)
        const blob = await processImage(
          img,
          img.naturalWidth,
          img.naturalHeight,
          settingsRef.current,
        )
        const url = URL.createObjectURL(blob)
        setItems((prev) =>
          prev.map((it) =>
            it.id === target.id
              ? { ...it, status: 'done', processedBlob: blob, processedUrl: url }
              : it,
          ),
        )
      } catch (err) {
        setItems((prev) =>
          prev.map((it) =>
            it.id === target.id
              ? { ...it, status: 'error', error: (err as Error).message }
              : it,
          ),
        )
      }
    }
  }

  /** Add newly uploaded files and process them. */
  const handleFiles = (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: nextId(),
      file,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      processedBlob: null,
      status: 'pending',
    }))
    setItems((prev) => [...prev, ...newItems])
    void runProcessing(newItems)
  }

  /** Re-process everything when settings change (if there is anything to do). */
  const reprocessAll = () => {
    if (!items.length) return
    void runProcessing(items)
  }

  const downloadOne = (item: ImageItem) => {
    if (!item.processedBlob) return
    const url = URL.createObjectURL(item.processedBlob)
    triggerDownload(url, cleanName(item.name))
    URL.revokeObjectURL(url)
  }

  const downloadZip = async () => {
    const done = items.filter((it) => it.processedBlob)
    if (!done.length) return
    setZipping(true)
    try {
      const zip = new JSZip()
      done.forEach((it) => zip.file(cleanName(it.name), it.processedBlob!))
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, 'white-area-cleaned.zip')
      URL.revokeObjectURL(url)
    } finally {
      setZipping(false)
    }
  }

  const clearAll = () => {
    items.forEach((it) => {
      URL.revokeObjectURL(it.originalUrl)
      if (it.processedUrl) URL.revokeObjectURL(it.processedUrl)
    })
    setItems([])
  }

  const doneCount = items.filter((it) => it.status === 'done').length

  return (
    <div className="app">
      <header className="header">
        <h1>White Area Cleaner</h1>
        <p>Convert off-white pixels to pure white automatically.</p>
      </header>

      <UploadArea onFiles={handleFiles} />

      <div className="layout">
        <aside className="sidebar">
          <SettingsPanel settings={settings} onChange={setSettings} />
          <button
            className="btn btn-block"
            onClick={reprocessAll}
            disabled={!items.length}
          >
            Re-apply to all images
          </button>
        </aside>

        <main className="content">
          {items.length === 0 ? (
            <div className="empty">No images yet. Upload some above to get started.</div>
          ) : (
            <>
              <div className="toolbar">
                <span className="count">
                  {doneCount}/{items.length} processed
                </span>
                <div className="toolbar-actions">
                  <button className="btn-ghost" onClick={clearAll}>
                    Clear all
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={downloadZip}
                    disabled={doneCount === 0 || zipping}
                  >
                    {zipping ? 'Zipping…' : 'Download all as ZIP'}
                  </button>
                </div>
              </div>

              <div className="grid">
                {items.map((item) => (
                  <ImageCard key={item.id} item={item} onDownload={downloadOne} />
                ))}
              </div>
            </>
          )}
        </main>
      </div>

      <footer className="footer">
        Runs entirely in your browser — no images are uploaded to any server.
      </footer>
    </div>
  )
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}
