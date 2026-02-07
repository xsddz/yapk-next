import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface LockScreenProps {
  isFirstTime: boolean
  onUnlock: () => void
}

export default function LockScreen({ isFirstTime, onUnlock }: LockScreenProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      if (isFirstTime) {
        // 首次设置密码
        if (password.length < 6) {
          setError('密码长度至少 6 位')
          setIsLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('两次输入的密码不一致')
          setIsLoading(false)
          return
        }
        await invoke('set_master_password', { password })
        onUnlock()
      } else {
        // 验证密码
        const isValid = await invoke<boolean>('verify_master_password', { password })
        if (isValid) {
          onUnlock()
        } else {
          setError('密码错误')
        }
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="w-full max-w-sm p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">YAPK Next</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {isFirstTime ? '设置主密码以保护您的数据' : '输入主密码解锁应用'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
              {isFirstTime ? '设置主密码' : '主密码'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              placeholder="••••••••"
              autoFocus
              required
            />
          </div>

          {isFirstTime && (
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                处理中...
              </span>
            ) : (
              isFirstTime ? '设置密码' : '解锁'
            )}
          </button>
        </form>

        {isFirstTime && (
          <p className="mt-6 text-xs text-gray-400 dark:text-gray-500 text-center">
            主密码用于加密和保护您的所有密码数据。<br />
            请牢记此密码，忘记将无法恢复数据。
          </p>
        )}
      </div>
    </div>
  )
}
