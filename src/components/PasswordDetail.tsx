import { useState, useEffect } from 'react'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import PasswordGenerator from './PasswordGenerator'
import type { PasswordRecord } from '../types'

interface PasswordDetailProps {
  record: PasswordRecord | null
  onSave: (record: PasswordRecord) => void
  onDelete: (id: number) => void
  onCancel: () => void
}

export default function PasswordDetail({
  record,
  onSave,
  onDelete,
  onCancel,
}: PasswordDetailProps) {
  const [formData, setFormData] = useState<PasswordRecord | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null)
  const [showGenerator, setShowGenerator] = useState(false)

  useEffect(() => {
    setFormData(record)
    setShowPassword(false)
  }, [record])

  if (!formData) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        <div className="text-center">
          <svg 
            className="w-16 h-16 mx-auto mb-4 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
            />
          </svg>
          <p>选择一个密码记录或添加新记录</p>
        </div>
      </div>
    )
  }

  const handleChange = (field: keyof PasswordRecord, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData) {
      onSave(formData)
    }
  }

  const handleCopy = async (text: string, field: string) => {
    try {
      await writeText(text)
      setCopyFeedback(field)
      setTimeout(() => setCopyFeedback(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const isNewRecord = formData.id === 0

  return (
    <div className="h-full overflow-y-auto p-6">
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
        <h2 className="text-xl font-semibold mb-6">
          {isNewRecord ? '添加新密码' : '编辑密码'}
        </h2>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            标题
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="例如：GitHub"
            required
          />
        </div>

        {/* Site or App */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            网址或应用
          </label>
          <input
            type="text"
            value={formData.siteOrApp}
            onChange={(e) => handleChange('siteOrApp', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="例如：github.com"
          />
        </div>

        {/* Login Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            登录账号
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.loginName}
              onChange={(e) => handleChange('loginName', e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="用户名或邮箱"
            />
            <button
              type="button"
              onClick={() => handleCopy(formData.loginName, 'loginName')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
              title="复制"
            >
              {copyFeedback === 'loginName' ? (
                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Login Password */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            登录密码
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.loginPass}
              onChange={(e) => handleChange('loginPass', e.target.value)}
              className="w-full px-3 py-2 pr-28 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="密码"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              {/* 密码生成器按钮 */}
              <button
                type="button"
                onClick={() => setShowGenerator(true)}
                className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
                title="生成密码"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                title={showPassword ? '隐藏密码' : '显示密码'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleCopy(formData.loginPass, 'loginPass')}
                className="p-1.5 text-gray-400 hover:text-gray-200 transition-colors"
                title="复制"
              >
                {copyFeedback === 'loginPass' ? (
                  <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            备注
          </label>
          <textarea
            value={formData.remarks}
            onChange={(e) => handleChange('remarks', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-100 resize-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="其他信息..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            保存
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors font-medium"
          >
            取消
          </button>
          {!isNewRecord && (
            <button
              type="button"
              onClick={() => onDelete(formData.id)}
              className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors font-medium"
            >
              删除
            </button>
          )}
        </div>
      </form>

      {/* 密码生成器弹窗 */}
      {showGenerator && (
        <PasswordGenerator
          onSelect={(password) => handleChange('loginPass', password)}
          onClose={() => setShowGenerator(false)}
        />
      )}
    </div>
  )
}
