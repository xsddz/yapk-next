import { useRef, useImperativeHandle, forwardRef, useState } from 'react'
import type { PasswordRecord, Category } from '../types'

interface PasswordListProps {
  records: PasswordRecord[]
  categories: Category[]
  selectedCategoryId: number | null | 'all'
  searchText: string
  onSearch: (text: string) => void
  onCategorySelect: (categoryId: number | null | 'all') => void
  onManageCategories: () => void
  onSelectRecord: (record: PasswordRecord) => void
}

export interface PasswordListRef {
  focusSearch: () => void
}

const PasswordList = forwardRef<PasswordListRef, PasswordListProps>(({
  records,
  categories,
  selectedCategoryId,
  searchText,
  onSearch,
  onCategorySelect,
  onManageCategories,
  onSelectRecord,
}, ref) => {
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [showCategoryMenu, setShowCategoryMenu] = useState(false)

  useImperativeHandle(ref, () => ({
    focusSearch: () => {
      searchInputRef.current?.focus()
    }
  }))

  // Filter records by selected category
  const filteredRecords = selectedCategoryId === 'all' 
    ? records 
    : records.filter(r => r.categoryId === selectedCategoryId)

  // Get current category label
  const getCategoryLabel = () => {
    if (selectedCategoryId === 'all') return '全部'
    if (selectedCategoryId === null) return '未分类'
    const cat = categories.find(c => c.id === selectedCategoryId)
    return cat ? `${cat.icon} ${cat.name}` : '全部'
  }

  const generateAvatar = (title: string, category?: Category) => {
    if (category) {
      return {
        letter: category.icon,
        colorClass: '',
        bgColor: category.color + '33',
      }
    }
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'
    ]
    const colorIndex = title.charCodeAt(0) % colors.length
    return {
      letter: title.charAt(0).toUpperCase(),
      colorClass: colors[colorIndex],
      bgColor: undefined,
    }
  }

  // Relative time formatter
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return '刚刚'
    if (diffMins < 60) return `${diffMins}分钟前`
    if (diffHours < 24) return `${diffHours}小时前`
    if (diffDays < 7) return `${diffDays}天前`
    return dateStr.split(' ')[0]
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header - Search + Category in one row */}
      <header className="px-3 py-2.5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative flex-1">
            <svg 
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
            <input
              ref={searchInputRef}
              type="search"
              value={searchText}
              onChange={(e) => onSearch(e.target.value)}
              placeholder="搜索..."
              className="w-full pl-8 pr-3 py-2 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all whitespace-nowrap"
            >
              <span className="max-w-[80px] truncate">{getCategoryLabel()}</span>
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showCategoryMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowCategoryMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20 py-1 max-h-64 overflow-y-auto">
                  <button
                    onClick={() => { onCategorySelect('all'); setShowCategoryMenu(false) }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedCategoryId === 'all' ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    全部
                  </button>
                  <button
                    onClick={() => { onCategorySelect(null); setShowCategoryMenu(false) }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      selectedCategoryId === null ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    未分类
                  </button>
                  {categories.length > 0 && <div className="border-t border-gray-100 dark:border-gray-700 my-1" />}
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => { onCategorySelect(cat.id); setShowCategoryMenu(false) }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                        selectedCategoryId === cat.id ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      {cat.name}
                    </button>
                  ))}
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                  <button
                    onClick={() => { onManageCategories(); setShowCategoryMenu(false) }}
                    className="w-full px-3 py-2 text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ⚙️ 管理分类
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Password List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <div className="p-6 text-center text-gray-400 dark:text-gray-500">
            <svg 
              className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-700" 
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
            <p className="text-sm">{searchText ? '没有找到匹配的记录' : '暂无密码记录'}</p>
            <p className="text-xs mt-1">点击 + 添加新密码</p>
          </div>
        ) : (
          <div className="py-1">
            {filteredRecords.map((record) => {
              const category = record.categoryId 
                ? categories.find(c => c.id === record.categoryId) 
                : undefined
              const avatar = generateAvatar(record.title, category)
              
              return (
                <button
                  key={record.id}
                  onClick={() => onSelectRecord(record)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all text-left group"
                >
                  <div 
                    className={`w-9 h-9 rounded-lg ${avatar.colorClass} flex items-center justify-center text-white font-medium text-sm shadow-sm flex-shrink-0`}
                    style={avatar.bgColor ? { backgroundColor: avatar.bgColor, fontSize: '1.125rem' } : undefined}
                  >
                    {avatar.letter}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {record.title}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                        {formatRelativeTime(record.updatedAt)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {record.loginName || record.siteOrApp || '无账号信息'}
                    </div>
                  </div>
                  <svg 
                    className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400 dark:group-hover:text-gray-500 transition-colors flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <footer className="px-3 py-2 border-t border-gray-200 dark:border-gray-800 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {filteredRecords.length} 条{selectedCategoryId !== 'all' && ' · 已筛选'}
        </p>
      </footer>
    </div>
  )
})

PasswordList.displayName = 'PasswordList'

export default PasswordList
