import type { Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface Props {
  settings: Settings
  onChange: (next: Settings) => void
}

export default function SettingsPanel({ settings, onChange }: Props) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>설정</h2>
        <button className="btn-ghost" onClick={() => onChange(DEFAULT_SETTINGS)}>
          초기화
        </button>
      </div>

      <label className="control">
        <span className="control-label">
          흰색 감지 범위 <b>{settings.sensitivity}</b>
        </span>
        <input
          type="range" min={0} max={100} value={settings.sensitivity}
          onChange={(e) => set({ sensitivity: Number(e.target.value) })}
        />
        <span className="control-hint">
          높을수록 더 어두운 흰색·회색도 빈 공간으로 인식합니다.
          너무 높으면 색상 영역도 흰색으로 바뀔 수 있습니다.
        </span>
      </label>

      <label className="control">
        <span className="control-label">
          최소 채움 크기 <b>{settings.minArea}px</b>
        </span>
        <input
          type="range" min={0} max={500} value={settings.minArea}
          onChange={(e) => set({ minArea: Number(e.target.value) })}
        />
        <span className="control-hint">
          이 픽셀 수보다 작은 빈 공간은 무시합니다. 작은 점·노이즈를 방지합니다.
        </span>
      </label>

      <label className="control control-toggle">
        <span className="control-label">밀폐 영역만 채우기</span>
        <input
          type="checkbox" checked={settings.enclosedOnly}
          onChange={(e) => set({ enclosedOnly: e.target.checked })}
        />
      </label>
      <span className="control-hint">
        켜면 외곽 배경은 유지하고 객체 안쪽 빈 공간만 채웁니다.
        끄면 외곽 배경도 흰색으로 바꿉니다.
      </span>
    </div>
  )
}
