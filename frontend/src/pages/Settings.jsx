import { useReducer } from 'react';
import toast from 'react-hot-toast';

const DEFAULT_SETTINGS = {
  theme: 'dark',
  emailNotifications: false,
  scanReminders: false,
  units: 'metric',
  language: 'en',
  autoSave: true,
  highContrast: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET':   return { ...state, [action.key]: action.value };
    case 'RESET': return DEFAULT_SETTINGS;
    default:      return state;
  }
}

function loadSettings() {
  try {
    const stored = localStorage.getItem('ai-doctor-settings');
    return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function Settings() {
  const [settings, dispatch] = useReducer(reducer, null, loadSettings);

  const set = (key) => (e) =>
    dispatch({ type: 'SET', key, value: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = () => {
    localStorage.setItem('ai-doctor-settings', JSON.stringify(settings));
    toast.success('Settings saved');
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
    localStorage.removeItem('ai-doctor-settings');
    toast.success('Settings reset to defaults');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <div>
        <h1 className="text-2xl font-black text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Customize your AI Doctor experience.</p>
      </div>

      {/* Appearance */}
      <div className="card p-6 space-y-5">
        <h2 className="section-title">Appearance</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">Theme</p>
            <p className="text-xs text-slate-500 mt-0.5">Interface color scheme</p>
          </div>
          <select
            value={settings.theme}
            onChange={set('theme')}
            className="input w-32"
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>

        <ToggleRow
          label="High contrast"
          desc="Increase contrast for better readability"
          checked={settings.highContrast}
          onChange={set('highContrast')}
        />
      </div>

      {/* Notifications */}
      <div className="card p-6 space-y-5">
        <h2 className="section-title">Notifications</h2>

        <ToggleRow
          label="Email notifications"
          desc="Receive scan results and updates via email"
          checked={settings.emailNotifications}
          onChange={set('emailNotifications')}
        />
        <ToggleRow
          label="Scan reminders"
          desc="Weekly reminders to check your health"
          checked={settings.scanReminders}
          onChange={set('scanReminders')}
        />
      </div>

      {/* Data & Privacy */}
      <div className="card p-6 space-y-5">
        <h2 className="section-title">Data & Preferences</h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">Measurement units</p>
            <p className="text-xs text-slate-500 mt-0.5">Used in reports and analysis</p>
          </div>
          <select
            value={settings.units}
            onChange={set('units')}
            className="input w-32"
          >
            <option value="metric">Metric</option>
            <option value="imperial">Imperial</option>
          </select>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-200">Language</p>
            <p className="text-xs text-slate-500 mt-0.5">Display language</p>
          </div>
          <select
            value={settings.language}
            onChange={set('language')}
            className="input w-32"
          >
            <option value="en">English</option>
            <option value="ar">العربية</option>
            <option value="fr">Français</option>
            <option value="es">Español</option>
          </select>
        </div>

        <ToggleRow
          label="Auto-save results"
          desc="Automatically save scan results to history"
          checked={settings.autoSave}
          onChange={set('autoSave')}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={save} className="btn-primary">
          Save settings
        </button>
        <button onClick={reset} className="btn-ghost">
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
        <div className="w-10 h-5 bg-slate-700 rounded-full peer
                        peer-checked:bg-blue-600 transition-colors
                        after:content-[''] after:absolute after:top-0.5 after:left-0.5
                        after:w-4 after:h-4 after:rounded-full after:bg-white
                        after:transition-all peer-checked:after:translate-x-5" />
      </label>
    </div>
  );
}
