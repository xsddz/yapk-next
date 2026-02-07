import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface PasswordGeneratorOptions {
  length: number
  uppercase: boolean
  lowercase: boolean
  numbers: boolean
  symbols: boolean
  excludeAmbiguous: boolean
}

interface PasswordGeneratorProps {
  onSelect: (password: string) => void
  onClose: () => void
}

export default function PasswordGenerator({ onSelect, onClose }: PasswordGeneratorProps) {
  const [password, setPassword] = useState('')
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true,
  })
  const [isGenerating, setIsGenerating] = useState(false)

  const generatePassword = async () => {
    setIsGenerating(true)
    try {
      const result = await invoke<string>('generate_random_password', { options })
      setPassword(result)
    } catch (error) {
      console.error('Failed to generate password:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleOptionChange = (key: keyof PasswordGeneratorOptions, value: boolean | number) => {
    setOptions({ ...options, [key]: value })
  }

  const handleUsePassword = () => {
    if (password) {
      onSelect(password)
      onClose()
    }
  }

  const getStrengthLabel = () => {
    const { length, uppercase, lowercase, numbers, symbols } = options
    const types = [uppercase, lowercase, numbers, symbols].filter(Boolean).length
    
    if (length >= 20 && types >= 4) return { label: '非常强', color: 'text-green-400', bg: 'bg-green-500' }
    if (length >= 16 && types >= 3) return { label: '强', color: 'text-blue-400', bg: 'bg-blue-500' }
    if (length >= 12 && types >= 2) return { label: '中等', color: 'text-yellow-400', bg: 'bg-yellow-500' }
    return { label: '弱', color: 'text-red-400', bg: 'bg-red-500' }
  }

  const strength = getStrengthLabel()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold text-gray-100">密码生成器</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Generated Password */}
          <div className="bg-gray-900 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={password}
                readOnly
                placeholder="点击生成按钮生成密码"
                className="flex-1 bg-transparent text-gray-100 font-mono text-lg outline-none"
              />
              <button
                onClick={generatePassword}
                disabled={isGenerating}
                className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
                title="重新生成"
              >
                <svg 
                  className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
            {password && (
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs ${strength.color}`}>强度: {strength.label}</span>
                <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${strength.bg} transition-all`}
                    style={{ width: strength.label === '非常强' ? '100%' : strength.label === '强' ? '75%' : strength.label === '中等' ? '50%' : '25%' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Length Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-300">密码长度</label>
              <span className="text-sm font-medium text-blue-400">{options.length}</span>
            </div>
            <input
              type="range"
              min={6}
              max={64}
              value={options.length}
              onChange={(e) => handleOptionChange('length', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Character Options */}
          <div className="space-y-2">
            <label className="text-sm text-gray-300">包含字符</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'uppercase', label: '大写字母 (A-Z)' },
                { key: 'lowercase', label: '小写字母 (a-z)' },
                { key: 'numbers', label: '数字 (0-9)' },
                { key: 'symbols', label: '特殊符号 (!@#)' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                    options[key as keyof PasswordGeneratorOptions]
                      ? 'bg-blue-600/20 border border-blue-500/50'
                      : 'bg-gray-700/50 border border-gray-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={options[key as keyof PasswordGeneratorOptions] as boolean}
                    onChange={(e) => handleOptionChange(key as keyof PasswordGeneratorOptions, e.target.checked)}
                    className="sr-only"
                  />
                  <span className={`w-4 h-4 rounded flex items-center justify-center ${
                    options[key as keyof PasswordGeneratorOptions] ? 'bg-blue-500' : 'bg-gray-600'
                  }`}>
                    {options[key as keyof PasswordGeneratorOptions] && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="text-sm text-gray-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Exclude Ambiguous */}
          <label className="flex items-center gap-3 p-2 rounded-lg bg-gray-700/30 cursor-pointer">
            <input
              type="checkbox"
              checked={options.excludeAmbiguous}
              onChange={(e) => handleOptionChange('excludeAmbiguous', e.target.checked)}
              className="sr-only"
            />
            <span className={`w-4 h-4 rounded flex items-center justify-center ${
              options.excludeAmbiguous ? 'bg-blue-500' : 'bg-gray-600'
            }`}>
              {options.excludeAmbiguous && (
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </span>
            <div>
              <span className="text-sm text-gray-300">排除易混淆字符</span>
              <span className="text-xs text-gray-500 block">如 0, O, l, 1, I</span>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-700">
          <button
            onClick={generatePassword}
            disabled={isGenerating}
            className="flex-1 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            生成密码
          </button>
          <button
            onClick={handleUsePassword}
            disabled={!password}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            使用此密码
          </button>
        </div>
      </div>
    </div>
  )
}
