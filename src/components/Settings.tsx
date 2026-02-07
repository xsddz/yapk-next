import { useThemeStore, type ThemeMode } from '../stores/themeStore'

interface SettingsProps {
  onClose: () => void
}

export function Settings({ onClose }: SettingsProps) {
  const { mode, setMode } = useThemeStore()

  const themes: { value: ThemeMode; label: string; icon: string }[] = [
    { value: 'light', label: '浅色', icon: '☀️' },
    { value: 'dark', label: '深色', icon: '🌙' },
    { value: 'system', label: '系统', icon: '💻' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">设置</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Theme Section */}
          <div>
            <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              外观
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setMode(theme.value)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                    mode === theme.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <span className="text-xl">{theme.icon}</span>
                  <span className={`text-xs font-medium ${
                    mode === theme.value 
                      ? 'text-blue-600 dark:text-blue-300' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {theme.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-sm">
              🔐
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">YAPK Next</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">v0.1.0 · Tauri 2.0</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
