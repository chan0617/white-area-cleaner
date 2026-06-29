import type { Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface Props {
  settings: Settings
  onChange: (next: Settings) => void
}

/** 빈 공간 판단 기준을 조절하는 설정 패널 */
export default function SettingsPanel({ settings, onChange }: Props) {
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
          빈 공간 기준값 <b>{settings.alphaThreshold}</b>
        </span>
        <input
          type="range"
          min={1}
          max={200}
          value={settings.alphaThreshold}
          onChange={(e) => onChange({ ...settings, alphaThreshold: Number(e.target.value) })}
        />
        <span className="control-hint">
          픽셀이 얼마나 투명해야 "빈 공간"으로 볼지 정합니다. 값이 크면 더 넓게 채워집니다.
        </span>
      </label>
    </div>
  )
}
