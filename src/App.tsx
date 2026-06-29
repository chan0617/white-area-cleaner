import { useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import UploadArea from './components/UploadArea'
import SettingsPanel from './components/SettingsPanel'
import ImageCard from './components/ImageCard'
import { analyzeImage, loadImage, renderResult } from './imageProcessing'
import { removeImageBackground } from './ai'
import { DEFAULT_SETTINGS, type ImageItem, type Settings } from './types'

let idCounter = 0
const nextId = () => `img-${++idCounter}-${Date.now()}`

/** 다운로드용 파일명: 확장자를 "-white.png" 로 교체 */
function cleanName(name: string) {
  return name.replace(/\.[^.]+$/, '') + '-white.png'
}

export default function App() {
  const [items, setItems] = useState<ImageItem[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [zipping, setZipping] = useState(false)

  const settingsRef = useRef(settings)
  const itemsRef = useRef(items)
  useEffect(() => void (settingsRef.current = settings), [settings])
  useEffect(() => void (itemsRef.current = items), [items])

  const patchItem = (id: string, patch: Partial<ImageItem>) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)))

  /**
   * 한 이미지를 (필요하면 AI 배경 제거 후) 분석하고 결과를 렌더링한다.
   * AI 결과(aiBlob)는 캐시해서, 기준값만 바꿀 땐 무거운 AI 를 다시 돌리지 않는다.
   */
  const analyzeAndRender = async (item: ImageItem) => {
    const useAI = settingsRef.current.useAI
    patchItem(item.id, { status: 'processing' })
    try {
      // 1) 입력 결정: AI 켜짐 → 배경 제거(캐시 재사용), 꺼짐 → 원본 파일 그대로
      let source: Blob = item.file
      let aiBlob = item.aiBlob
      if (useAI) {
        if (!aiBlob) aiBlob = await removeImageBackground(item.file)
        source = aiBlob
      }

      // 2) 빈 영역 분석 → 3) 흰색 채우기 렌더링
      const img = await loadImage(new File([source], item.name, { type: source.type }))
      const w = img.naturalWidth
      const h = img.naturalHeight
      const analysis = analyzeImage(img, w, h, settingsRef.current.alphaThreshold)
      const excluded = new Set<number>() // 새로 분석하면 제외 선택은 초기화
      const blob = await renderResult(analysis, w, h, excluded)
      patchItem(item.id, {
        status: 'done',
        width: w,
        height: h,
        aiBlob,
        analysis,
        excluded,
        processedBlob: blob,
        processedUrl: URL.createObjectURL(blob),
      })
    } catch (err) {
      patchItem(item.id, { status: 'error', error: (err as Error).message })
    }
  }

  const processAll = (targets: ImageItem[]) => {
    targets.reduce(
      (chain, t) => chain.then(() => analyzeAndRender(t)),
      Promise.resolve(),
    )
  }

  /** 새로 업로드된 파일 추가 + 처리 */
  const handleFiles = (files: File[]) => {
    const newItems: ImageItem[] = files.map((file) => ({
      id: nextId(),
      file,
      name: file.name,
      width: 0,
      height: 0,
      originalUrl: URL.createObjectURL(file),
      processedUrl: null,
      processedBlob: null,
      aiBlob: null,
      analysis: null,
      excluded: new Set<number>(),
      status: 'pending',
    }))
    setItems((prev) => [...prev, ...newItems])
    processAll(newItems)
  }

  // 설정(빈 공간 기준값)이 바뀌면 잠시 후 전체를 다시 분석 (디바운스)
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    const t = setTimeout(() => {
      if (itemsRef.current.length) processAll(itemsRef.current)
    }, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  /** 채워진 영역을 클릭하면 해당 영역만 흰색에서 제외(또는 다시 포함) 토글 */
  const toggleRegion = async (item: ImageItem, label: number) => {
    if (!item.analysis || label === 0) return
    const excluded = new Set(item.excluded)
    if (excluded.has(label)) excluded.delete(label)
    else excluded.add(label)
    const blob = await renderResult(item.analysis, item.width, item.height, excluded)
    if (item.processedUrl) URL.revokeObjectURL(item.processedUrl)
    patchItem(item.id, {
      excluded,
      processedBlob: blob,
      processedUrl: URL.createObjectURL(blob),
    })
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
      triggerDownload(url, 'white-filled.zip')
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
        <h1>흰색 영역 채우기</h1>
        <p>외곽선 안쪽의 빈 공간을 흰색으로 자동으로 채웁니다. 색상은 그대로 유지됩니다.</p>
      </header>

      <UploadArea onFiles={handleFiles} />

      <div className="layout">
        <aside className="sidebar">
          <SettingsPanel settings={settings} onChange={setSettings} />
          <div className="tip">
            💡 흰색이 들어가면 안 되는 부분은 <b>오른쪽 결과 이미지에서 클릭</b>하면
            제외됩니다. 다시 클릭하면 복원돼요.
          </div>
        </aside>

        <main className="content">
          {items.length === 0 ? (
            <div className="empty">아직 이미지가 없습니다. 위에서 업로드해 보세요.</div>
          ) : (
            <>
              <div className="toolbar">
                <span className="count">
                  {doneCount}/{items.length} 처리됨
                </span>
                <div className="toolbar-actions">
                  <button className="btn-ghost" onClick={clearAll}>
                    전체 지우기
                  </button>
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
                  <ImageCard
                    key={item.id}
                    item={item}
                    onDownload={downloadOne}
                    onToggleRegion={toggleRegion}
                  />
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
}
