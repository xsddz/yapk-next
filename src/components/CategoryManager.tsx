import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Category {
  id: number
  name: string
  icon: string
  color: string
  createdAt: string
}

interface CategoryManagerProps {
  onClose: () => void
  onCategoriesChange?: () => void
}

const ICONS = ['📁', '🌐', '💼', '🎮', '💳', '✉️', '🛒', '📱', '💻', '🔐', '🏦', '📚']
const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', 
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280', '#1e40af'
]

export function CategoryManager({ onClose, onCategoriesChange }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState<number | 'new' | null>(null)
  const [formData, setFormData] = useState({ name: '', icon: '📁', color: '#6b7280' })
  const [error, setError] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const result = await invoke<Category[]>('list_categories')
      setCategories(result)
    } catch (err) {
      setError(err as string)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setError('请输入分类名称')
      return
    }

    try {
      setError('')
      if (editMode === 'new') {
        await invoke('add_category', {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
        })
      } else if (typeof editMode === 'number') {
        await invoke('update_category', {
          id: editMode,
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
        })
      }
      setEditMode(null)
      setFormData({ name: '', icon: '📁', color: '#6b7280' })
      loadCategories()
      onCategoriesChange?.()
    } catch (err) {
      setError(err as string)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('删除分类后，该分类下的密码将变为未分类。确定删除？')) return

    try {
      await invoke('delete_category', { id })
      loadCategories()
      onCategoriesChange?.()
    } catch (err) {
      setError(err as string)
    }
  }

  const startEdit = (category: Category) => {
    setEditMode(category.id)
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
    })
  }

  const startNew = () => {
    setEditMode('new')
    setFormData({ name: '', icon: '📁', color: '#6b7280' })
  }

  const cancelEdit = () => {
    setEditMode(null)
    setFormData({ name: '', icon: '📁', color: '#6b7280' })
    setError('')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl max-w-lg w-full max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-2xl">🏷️</span>
            分类管理
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin text-4xl">⏳</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 text-red-400 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Edit/New form */}
              {editMode !== null && (
                <div className="bg-gray-700/50 rounded-lg p-4 space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">分类名称</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="例如：社交媒体"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">图标</label>
                    <div className="flex flex-wrap gap-2">
                      {ICONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setFormData({ ...formData, icon })}
                          className={`w-10 h-10 text-xl rounded-lg transition-colors ${
                            formData.icon === icon
                              ? 'bg-blue-600 ring-2 ring-blue-400'
                              : 'bg-gray-600 hover:bg-gray-500'
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">颜色</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map((color) => (
                        <button
                          key={color}
                          onClick={() => setFormData({ ...formData, color })}
                          className={`w-8 h-8 rounded-full transition-transform ${
                            formData.color === color ? 'ring-2 ring-white scale-110' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleSave}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="flex-1 px-4 py-2 bg-gray-600 text-gray-300 rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}

              {/* Category list */}
              {editMode === null && (
                <>
                  <button
                    onClick={startNew}
                    className="w-full px-4 py-3 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-blue-500 hover:text-blue-400 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">+</span>
                    添加新分类
                  </button>

                  {categories.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      暂无分类，点击上方按钮创建
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                              style={{ backgroundColor: category.color + '33' }}
                            >
                              {category.icon}
                            </span>
                            <span className="font-medium text-white">{category.name}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(category)}
                              className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                              title="编辑"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                              title="删除"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
