import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { save, open } from '@tauri-apps/plugin-dialog'
import { writeTextFile, readTextFile } from '@tauri-apps/plugin-fs'

interface ImportResult {
  importedCategories: number
  importedRecords: number
  skippedRecords: number
}

interface DataTransferProps {
  onClose: () => void
  onDataChange?: () => void
}

export function DataTransfer({ onClose, onDataChange }: DataTransferProps) {
  const [mode, setMode] = useState<'menu' | 'export' | 'import'>('menu')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  // Export options
  const [exportEncrypted, setExportEncrypted] = useState(true)
  
  // Import options
  const [importMerge, setImportMerge] = useState(true)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)

  const handleExport = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      
      // Get export data from backend
      const jsonData = await invoke<string>('export_data', { encrypted: exportEncrypted })
      
      // Open save dialog
      const filePath = await save({
        defaultPath: `yapk-backup-${new Date().toISOString().slice(0, 10)}.json`,
        filters: [{ name: 'JSON', extensions: ['json'] }],
      })
      
      if (filePath) {
        await writeTextFile(filePath, jsonData)
        setSuccess(`导出成功！保存至: ${filePath}`)
      }
    } catch (err) {
      setError(err as string)
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')
      setImportResult(null)
      
      // Open file dialog
      const filePath = await open({
        filters: [{ name: 'JSON', extensions: ['json'] }],
        multiple: false,
      })
      
      if (filePath) {
        // Read file content
        const jsonData = await readTextFile(filePath as string)
        
        // Import data
        const result = await invoke<ImportResult>('import_data', {
          jsonData,
          merge: importMerge,
        })
        
        setImportResult(result)
        setSuccess('导入成功！')
        onDataChange?.()
      }
    } catch (err) {
      setError(err as string)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">📦</span>
            数据导入导出
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Error/Success messages */}
          {error && (
            <div className="mb-4 bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 bg-green-500/20 text-green-400 px-3 py-2 rounded-lg text-sm">
              {success}
            </div>
          )}

          {mode === 'menu' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('export')}
                className="w-full p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📤</span>
                  <div>
                    <div className="font-medium text-white">导出数据</div>
                    <div className="text-sm text-gray-400">将密码数据导出为 JSON 备份文件</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => setMode('import')}
                className="w-full p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📥</span>
                  <div>
                    <div className="font-medium text-white">导入数据</div>
                    <div className="text-sm text-gray-400">从 JSON 备份文件恢复数据</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {mode === 'export' && (
            <div className="space-y-4">
              <button
                onClick={() => { setMode('menu'); setError(''); setSuccess(''); }}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                ← 返回
              </button>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-3">导出选项</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={exportEncrypted}
                    onChange={(e) => setExportEncrypted(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-white">加密导出</div>
                    <div className="text-xs text-gray-400">
                      密码数据将保持加密状态（更安全，但只能用相同主密码导入）
                    </div>
                  </div>
                </label>
              </div>

              <button
                onClick={handleExport}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    导出中...
                  </>
                ) : (
                  <>
                    📤 开始导出
                  </>
                )}
              </button>
            </div>
          )}

          {mode === 'import' && (
            <div className="space-y-4">
              <button
                onClick={() => { setMode('menu'); setError(''); setSuccess(''); setImportResult(null); }}
                className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
              >
                ← 返回
              </button>

              <div className="bg-gray-700/50 rounded-lg p-4">
                <h3 className="font-medium text-white mb-3">导入选项</h3>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={importMerge}
                    onChange={(e) => setImportMerge(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="text-white">合并模式</div>
                    <div className="text-xs text-gray-400">
                      保留现有数据，仅添加新记录（同名记录将跳过）
                    </div>
                  </div>
                </label>
                
                {!importMerge && (
                  <div className="mt-3 bg-yellow-500/20 text-yellow-400 px-3 py-2 rounded text-xs">
                    ⚠️ 替换模式将清空现有所有数据！
                  </div>
                )}
              </div>

              {importResult && (
                <div className="bg-blue-500/20 rounded-lg p-4">
                  <h4 className="font-medium text-blue-400 mb-2">导入结果</h4>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>✅ 导入分类: {importResult.importedCategories} 个</div>
                    <div>✅ 导入记录: {importResult.importedRecords} 条</div>
                    {importResult.skippedRecords > 0 && (
                      <div>⏭️ 跳过重复: {importResult.skippedRecords} 条</div>
                    )}
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={loading}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    导入中...
                  </>
                ) : (
                  <>
                    📥 选择文件并导入
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
