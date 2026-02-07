import type { PasswordRecord, Category } from '../types'

interface SidebarProps {
  records: PasswordRecord[]
  categories: Category[]
  selectedCategoryId: number | null | 'all'
  searchText: string
  onSearch: (text: string) => void
  onAddClick: () => void
  isAddMode: boolean
  selectedId?: number
  onSelectRecord: (record: PasswordRecord) => void
  onHealthCheck?: () => void
  onCategorySelect: (categoryId: number | null | 'all') => void
  onManageCategories: () => void
  onDataTransfer?: () => void
  onSettings?: () => void
}

export default function Sidebar({
  records,
  categories,
  selectedCategoryId,
  searchText,
  onSearch,
  onAddClick,
  isAddMode,
  selectedId,
  onSelectRecord,
  onHealthCheck,
  onCategorySelect,
  onManageCategories,
  onDataTransfer,
  onSettings,
}: SidebarProps) {
  // Filter records by selected category
  const filteredRecords = selectedCategoryId === 'all' 
    ? records 
    : records.filter(r => r.categoryId === selectedCategoryId)

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

  return (
    <aside className="w-80 bg-gray-100 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
        {/* Search - Full Width */}
        <div className="relative">
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500"
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
            type="search"
            value={searchText}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="搜索密码..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onAddClick}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              isAddMode 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            添加密码
          </button>
          <button
            onClick={onHealthCheck}
            className="p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-all"
            title="密码健康检查"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
              />
            </svg>
          </button>
          <button
            onClick={onDataTransfer}
            className="p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-all"
            title="数据导入导出"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" 
              />
            </svg>
          </button>
          <button
            onClick={onSettings}
            className="p-2.5 rounded-xl bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 transition-all"
            title="设置"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
              />
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" 
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Category Filter */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => onCategorySelect('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategoryId === 'all'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => onCategorySelect(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategoryId === null
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
            }`}
          >
            未分类
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategorySelect(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
                selectedCategoryId === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                  : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.name}
            </button>
          ))}
          <button
            onClick={onManageCategories}
            className="px-2 py-1.5 rounded-lg text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            title="管理分类"
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Password List */}
      <ul className="flex-1 overflow-y-auto">
        {filteredRecords.length === 0 ? (
          <li className="p-8 text-center text-gray-400 dark:text-gray-500">
            {searchText ? '没有找到匹配的记录' : '暂无密码记录'}
          </li>
        ) : (
          filteredRecords.map((record) => {
            const category = record.categoryId 
              ? categories.find(c => c.id === record.categoryId) 
              : undefined
            const avatar = generateAvatar(record.title, category)
            const isSelected = selectedId === record.id
            
            return (
              <li
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className={`flex items-center gap-3 p-3 cursor-pointer border-b border-gray-200 dark:border-gray-700 transition-all ${
                  isSelected 
                    ? 'bg-blue-50 dark:bg-blue-600/20 border-l-2 border-l-blue-500' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div 
                  className={`w-10 h-10 rounded-full ${avatar.colorClass} flex items-center justify-center text-white font-medium shadow-sm`}
                  style={avatar.bgColor ? { backgroundColor: avatar.bgColor } : undefined}
                >
                  {avatar.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 dark:text-gray-100 truncate">
                    {record.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    更新于 {record.updatedAt}
                  </div>
                </div>
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}
