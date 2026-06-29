import { useRef, useState } from 'react'

const ACCEPTED = ['image/png', 'image/jpeg', 'image/webp']

interface Props {
  onFiles: (files: File[]) => void
}

/** Drag-and-drop / click upload zone for multiple images. */
export default function UploadArea({ onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const handleFiles = (list: FileList | null) => {
    if (!list) return
    const files = Array.from(list).filter((f) => ACCEPTED.includes(f.type))
    if (files.length) onFiles(files)
  }

  return (
    <div
      className={`upload-area${dragging ? ' dragging' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        hidden
        onChange={(e) => {
          handleFiles(e.target.files)
          e.target.value = '' // allow re-uploading the same file
        }}
      />
      <div className="upload-icon">⬆️</div>
      <p className="upload-title">Drag &amp; drop images here</p>
      <p className="upload-sub">or click to browse · PNG, JPG, JPEG, WEBP · multiple files</p>
    </div>
  )
}
