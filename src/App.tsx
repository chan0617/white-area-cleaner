import { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import UploadArea from './components/UploadArea'
import SettingsPanel from './components/SettingsPanel'
import ImageCard from './components/ImageCard'
import { processImage } from './imageProcessing'
import { DEFAULT_SETTINGS, type ImageItem, type Settings } from './types'

let idCounter = 0
const nextId = () => `img-${++idCounter}-${Date.now()}`

function cleanName(name: string) {
  return name.replace(/\.[^.]+$/, '') + '-white.png'
}

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [zipping, setZipping] = useState(false)

  const settingsRef = useRef(settings)
  const itemsRef = useRef(items)
  useEffect(() => { settingsRef.current = settings }, [settings])
  useEffect(() => { itemsRef.current = items }, [items])

  const patchItem = (id: string, patch: Partial<ImageItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))

  const runProcess = async (item: ImageItem, s: Settings = settingsRef.current) => {
    patchItem(item.id, { status: 'processing' })
    try {
      const { blob, changed } = await processImage(item.file, s)
      const processedUrl = URL.createObjectURL(blob)
      patchItem(item.id, { status: 'done', processedBlob: blob, processedUrl, changedPixels: changed })
    } catch (err) {
      patchItem(item.id, { status: 'error', error: (err as Error).message })
    }
  }

  const handleFiles = (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: nextId(),
      file,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      processedBlob: null,
      changedPixels: 0,
      status: 'pending' as const,
    }))
    setItems((prev) => [...prev, ...newItems])
    newItems.reduce((chain, it) => chain.then(() => runProcess(it)), Promise.resolve())
  }

  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    const t = setTimeout(() => {
      const current = itemsRef.current
      if (!current.length) return
      current.reduce(
        (chain, it) => chain.then(() => runProcess(it, settingsRef.current)),
        Promise.resolve(),
      )
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

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
      triggerDownload(URL.createObjectURL(blob), 'white-filled.zip')
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
        <h1>내부 빈 공간 채우기</h1>
        <p>일러스트 객체 안쪽의 빈 공간을 자동으로 순백색 #FFFFFF로 채웁니다.</p>
      </header>

      <UploadArea onFiles={handleFiles} />

      <div className="layout">
        <aside className="sidebar">
          <SettingsPanel settings={settings} onChange={setSettings} />
          <div className="tip">
            슬라이더 조절 시 업로드된 이미지가 자동으로 재처리됩니다.
          </div>
        </aside>

        <main className="content">
          {items.length === 0 ? (
            <div className="empty">아직 이미지가 없습니다. 위에서 업로드해 보세요.</div>
          ) : (
            <>
              <div className="toolbar">
                <span className="count">{doneCount}/{items.length} 처리됨</span>
                <div className="toolbar-actions">
                  <button className="btn-ghost" onClick={clearAll}>전체 지우기</button>
                  <button
                    className="btn btn-primary"
                    onClick={downloadZip}
                    disabled={doneCount === 0 || zipping}
                  >
                    {zipping ? '압축 중…' : '전체 ZIP 다운로드'}
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
        모든 처리는 브라우저에서만 이루어집니다 — 어떤 이미지도 서버로 전송되지 않습니다.
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
  URL.revokeObjectURL(url)
}
