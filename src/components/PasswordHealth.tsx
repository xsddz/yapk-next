import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface PasswordIssue {
  issueType: string
  message: string
}

interface PasswordHealthResult {
  recordId: number
  strength: 'weak' | 'fair' | 'good' | 'strong'
  score: number
  issues: PasswordIssue[]
}

interface HealthReport {
  totalCount: number
  weakCount: number
  reusedCount: number
  results: PasswordHealthResult[]
}

interface PasswordHealthProps {
  records: Array<{ id: number; name: string }>
  onClose: () => void
  onSelectRecord?: (id: number) => void
}

const strengthColors = {
  weak: 'text-red-400 bg-red-400/20',
  fair: 'text-yellow-400 bg-yellow-400/20',
  good: 'text-blue-400 bg-blue-400/20',
  strong: 'text-green-400 bg-green-400/20',
}

const strengthLabels = {
  weak: '弱',
  fair: '一般',
  good: '良好',
  strong: '强',
}

const issueTypeIcons: Record<string, string> = {
  weak: '⚠️',
  reused: '🔁',
  short: '📏',
}

export function PasswordHealth({ records, onClose, onSelectRecord }: PasswordHealthProps) {
  const [loading, setLoading] = useState(true)
  const [report, setReport] = useState<HealthReport | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<'all' | 'weak' | 'reused'>('all')

  useEffect(() => {
    checkHealth()
  }, [])

  const checkHealth = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await invoke<HealthReport>('check_passwords_health')
      setReport(result)
    } catch (err) {
      setError(err as string)
    } finally {
      setLoading(false)
    }
  }

  const getRecordName = (recordId: number) => {
    const record = records.find(r => r.id === recordId)
    return record?.name || `记录 #${recordId}`
  }

  const filteredResults = report?.results.filter(result => {
    if (filter === 'all') return true
    if (filter === 'weak') return result.strength === 'weak'
    if (filter === 'reused') return result.issues.some(i => i.issueType === 'reused')
    return true
  }) || []

  const healthScore = report ? 
    Math.round(report.results.reduce((sum, r) => sum + r.score, 0) / Math.max(report.totalCount, 1)) : 0

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="text-2xl">🏥</span>
            密码健康检查
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-4xl">⏳</div>
              <span className="ml-3 text-gray-500 dark:text-gray-400">正在分析密码安全性...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={checkHealth}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                重试
              </button>
            </div>
          ) : report ? (
            <div className="space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">{report.totalCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">总密码数</div>
                </div>
                <div className={`rounded-lg p-3 text-center ${healthScore >= 70 ? 'bg-green-500/20' : healthScore >= 50 ? 'bg-yellow-500/20' : 'bg-red-500/20'}`}>
                  <div className={`text-2xl font-bold ${healthScore >= 70 ? 'text-green-400' : healthScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {healthScore}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">健康分数</div>
                </div>
                <div className="bg-red-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">{report.weakCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">弱密码</div>
                </div>
                <div className="bg-yellow-500/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">{report.reusedCount}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">重复使用</div>
                </div>
              </div>

              {/* Filter Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  全部 ({report.results.length})
                </button>
                <button
                  onClick={() => setFilter('weak')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'weak' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  ⚠️ 弱密码 ({report.weakCount})
                </button>
                <button
                  onClick={() => setFilter('reused')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === 'reused' ? 'bg-yellow-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  🔁 重复 ({report.reusedCount})
                </button>
              </div>

              {/* Results List */}
              <div className="space-y-2">
                {filteredResults.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    {filter === 'all' ? '没有密码记录' : '没有符合条件的记录 🎉'}
                  </div>
                ) : (
                  filteredResults.map(result => (
                    <div
                      key={result.recordId}
                      className="bg-gray-100 dark:bg-gray-700/50 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-700/70 transition-colors cursor-pointer"
                      onClick={() => onSelectRecord?.(result.recordId)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${strengthColors[result.strength]}`}>
                            {strengthLabels[result.strength]}
                          </span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {getRecordName(result.recordId)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{result.score}分</span>
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                result.score >= 80 ? 'bg-green-500' :
                                result.score >= 60 ? 'bg-blue-500' :
                                result.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${result.score}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      {result.issues.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {result.issues.map((issue, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600/50 px-2 py-1 rounded"
                            >
                              {issueTypeIcons[issue.issueType] || '❓'} {issue.message}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
