import { useThemeStore, type ThemeMode } from '../stores/themeStore'

interface SettingsProps {
  onClose: () => void
}

export function Settings({ onClose }: SettingsProps) {
  const { mode, setMode } = useThemeStore()

  const themes: { value: ThemeMode; label: string; icon: string; description: string }[] = [
    { value: 'light', label: '浅色清新', icon: '☀️', description: '白色背景，柔和色调' },
    { value: 'dark', label: '深色模式', icon: '🌙', description: '深色背景，护眼' },
    { value: 'system', label: '跟随系统', icon: '💻', description: '自动适应系统主题' },
  ]

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            设置
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Theme Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              外观主题
            </h3>
            <div className="space-y-2">
              {themes.map((theme) => (
                <button
                  key={theme.value}
                  onClick={() => setMode(theme.value)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                    mode === theme.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-700/50'
                  }`}
                >
                  <span className="text-2xl">{theme.icon}</span>
                  <div className="flex-1">
                    <div className={`font-medium ${
                      mode === theme.value 
                        ? 'text-blue-700 dark:text-blue-300' 
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {theme.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {theme.description}
                    </div>
                  </div>
                  {mode === theme.value && (
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
              关于
            </h3>
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-xl font-bold">
                  🔐
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">YAPK Next</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">版本 0.1.0</div>
                </div>
              </div>
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                安全的跨平台密码管理器，使用 Tauri 2.0 和 Rust 构建。
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
