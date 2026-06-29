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
          배경 감지 범위 <b>{settings.sensitivity}</b>
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={settings.sensitivity}
          onChange={(e) => set({ sensitivity: Number(e.target.value) })}
        />
        <span className="control-hint">
          높을수록 배경과 비슷한 색도 흰색으로 바꿉니다. 너무 높으면 객체 색상도 영향받을 수 있어요.
        </span>
      </label>

      <label className="control control-toggle">
        <span className="control-label">객체 내부 빈 공간도 채우기</span>
        <input
          type="checkbox"
          checked={settings.lowSatOnly}
          onChange={(e) => set({ lowSatOnly: e.target.checked })}
        />
      </label>
      <span className="control-hint">
        외곽 배경뿐 아니라 객체 안쪽의 빈 공간도 흰색으로 채웁니다.
      </span>
    </div>
  )
}
