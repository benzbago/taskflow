import { Check } from 'lucide-react'
import { useTaskFlow } from '../context/TaskFlowContext'
import SectionHeader from '../components/common/SectionHeader'

export default function AppearancePage() {
  const { settings, setSettings } = useTaskFlow()
  return (
    <div className="settings-card">
      <SectionHeader
        title="Your space, your way"
        subtitle="Preferences are saved in this browser."
      />
      <label>
        Your name
        <input
          value={settings.name}
          onChange={(e) => setSettings({ name: e.target.value })}
          placeholder="How should TaskFlow greet you?"
        />
      </label>
      <fieldset>
        <legend>Color theme</legend>
        <div className="theme-options">
          {['light', 'dark', 'system'].map((theme) => (
            <button
              key={theme}
              className={settings.theme === theme ? 'selected' : ''}
              onClick={() => setSettings({ theme })}
            >
              <span className={`theme-preview ${theme}`}>
                <i />
                <i />
                <i />
              </span>
              <Check /> {theme}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="toggle-row">
        <span>
          <strong>Compact task cards</strong>
          <small>Show more tasks at once.</small>
        </span>
        <input
          type="checkbox"
          checked={settings.compact}
          onChange={(e) => setSettings({ compact: e.target.checked })}
        />
      </label>
    </div>
  )
}
