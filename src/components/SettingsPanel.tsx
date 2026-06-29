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
          흰색 감지 민감도 <b>{settings.sensitivity}</b>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.sensitivity}
          onChange={(e) => set({ sensitivity: Number(e.target.value) })}
        />
        <span className="control-hint">
          높을수록 약간 색감이 있는 픽셀(연한 파랑·크림 등)도 흰색으로 변환합니다.
        </span>
      </label>

      <label className="control">
        <span className="control-label">
          밝기 기준 <b>{settings.brightness}</b>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.brightness}
          onChange={(e) => set({ brightness: Number(e.target.value) })}
        />
        <span className="control-hint">
          높을수록 더 밝은 픽셀만 변환합니다. 낮추면 회색 계열 흰색도 포함됩니다.
        </span>
      </label>

      <label className="control control-toggle">
        <span className="control-label">저채도 영역만 변경</span>
        <input
          type="checkbox"
          checked={settings.lowSatOnly}
          onChange={(e) => set({ lowSatOnly: e.target.checked })}
        />
      </label>
      <span className="control-hint">
        체크 시 거의 무채색(회백색)만 변환합니다. 연한 컬러는 유지됩니다.
      </span>
    </div>
  )
}
