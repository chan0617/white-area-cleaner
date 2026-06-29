import type { Settings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

interface Props {
  settings: Settings
  onChange: (next: Settings) => void
}

/** Controls that tune the whitening algorithm. */
export default function SettingsPanel({ settings, onChange }: Props) {
  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch })

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>Settings</h2>
        <button className="btn-ghost" onClick={() => onChange(DEFAULT_SETTINGS)}>
          Reset
        </button>
      </div>

      <label className="control">
        <span className="control-label">
          White tolerance <b>{settings.whiteTolerance}</b>
        </span>
        <input
          type="range"
          min={0}
          max={120}
          value={settings.whiteTolerance}
          onChange={(e) => update({ whiteTolerance: Number(e.target.value) })}
        />
        <span className="control-hint">How far from pure white still counts as white.</span>
      </label>

      <label className="control">
        <span className="control-label">
          Brightness threshold <b>{settings.brightnessThreshold}</b>
        </span>
        <input
          type="range"
          min={100}
          max={255}
          value={settings.brightnessThreshold}
          onChange={(e) => update({ brightnessThreshold: Number(e.target.value) })}
        />
        <span className="control-hint">Pixels darker than this are never touched.</span>
      </label>

      <label className="control control-toggle">
        <span className="control-label">Low saturation only</span>
        <input
          type="checkbox"
          checked={settings.lowSaturationOnly}
          onChange={(e) => update({ lowSaturationOnly: e.target.checked })}
        />
      </label>
      <span className="control-hint">Only affect near-neutral (grey/white) pixels.</span>
    </div>
  )
}
