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

      <label className="control control-toggle">
        <span className="control-label">AI 배경 제거</span>
        <input
          type="checkbox"
          checked={settings.useAI}
          onChange={(e) => onChange({ ...settings, useAI: e.target.checked })}
        />
      </label>
      <span className="control-hint">
        객체를 인식해 배경을 투명하게 만든 뒤 안쪽 빈 공간을 채웁니다. 처음 실행 시 모델을
        내려받아 몇 초 걸릴 수 있어요. (브라우저에서 실행 · 서버 없음)
      </span>

      <hr className="divider" />

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
