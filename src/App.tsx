import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Sidebar from './components/Sidebar'
import PasswordDetail from './components/PasswordDetail'
import LockScreen from './components/LockScreen'
import { PasswordHealth } from './components/PasswordHealth'
import { CategoryManager } from './components/CategoryManager'
import { DataTransfer } from './components/DataTransfer'
import { Settings } from './components/Settings'
import { usePasswordStore } from './stores/passwordStore'
import { useThemeStore, applyTheme } from './stores/themeStore'
import type { PasswordRecord, Category } from './types'

function App() {
  const { 
    records, 
    selectedRecord, 
    searchText,
    isAddMode,
    isLocked,
    setRecords, 
    setSelectedRecord,
    setSearchText,
    setAddMode,
    setLocked
  } = usePasswordStore()

  const [isFirstTime, setIsFirstTime] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showHealthCheck, setShowHealthCheck] = useState(false)
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showDataTransfer, setShowDataTransfer] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null | 'all'>('all')

  const { mode } = useThemeStore()

  // Apply theme on mount
  useEffect(() => {
    applyTheme(mode)
  }, [mode])

  // Check master password status on mount
  useEffect(() => {
    checkMasterPassword()
  }, [])

  const checkMasterPassword = async () => {
    try {
      const isSet = await invoke<boolean>('is_master_password_set')
      setIsFirstTime(!isSet)
      setLocked(true)
    } catch (error) {
      console.error('Failed to check master password:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUnlock = () => {
    setLocked(false)
    loadRecords('')
    loadCategories()
  }

  // Load categories
  const loadCategories = async () => {
    try {
      const result = await invoke<Category[]>('list_categories')
      setCategories(result)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  // Load password records
  const loadRecords = async (search: string) => {
    try {
      const result = await invoke<PasswordRecord[]>('list_records', { search })
      setRecords(result)
    } catch (error) {
      console.error('Failed to load records:', error)
    }
  }

  const handleSearch = (text: string) => {
    setSearchText(text)
    loadRecords(text)
  }

  const handleAddClick = () => {
    setAddMode(!isAddMode)
    if (!isAddMode) {
      setSelectedRecord({
        id: 0,
        title: '',
        siteOrApp: '',
        loginName: '',
        loginPass: '',
        remarks: '',
        categoryId: selectedCategoryId === 'all' ? null : selectedCategoryId,
        createdAt: '',
        updatedAt: ''
      })
    } else {
      setSelectedRecord(null)
    }
  }

  const handleSelectRecord = (record: PasswordRecord) => {
    setAddMode(false)
    setSelectedRecord(record)
  }

  const handleSave = async (record: PasswordRecord) => {
    try {
      if (record.id === 0) {
        await invoke('add_record', { record })
      } else {
        await invoke('update_record', { record })
      }
      setAddMode(false)
      setSelectedRecord(null)
      loadRecords(searchText)
    } catch (error) {
      console.error('Failed to save record:', error)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await invoke('delete_record', { id })
      setSelectedRecord(null)
      loadRecords(searchText)
    } catch (error) {
      console.error('Failed to delete record:', error)
    }
  }

  const handleCancel = () => {
    setAddMode(false)
    setSelectedRecord(null)
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  // Lock screen
  if (isLocked) {
    return <LockScreen isFirstTime={isFirstTime} onUnlock={handleUnlock} />
  }

  // Main app
  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Sidebar
        records={records}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        searchText={searchText}
        onSearch={handleSearch}
        onAddClick={handleAddClick}
        isAddMode={isAddMode}
        selectedId={selectedRecord?.id}
        onSelectRecord={handleSelectRecord}
        onHealthCheck={() => setShowHealthCheck(true)}
        onCategorySelect={setSelectedCategoryId}
        onManageCategories={() => setShowCategoryManager(true)}
        onDataTransfer={() => setShowDataTransfer(true)}
        onSettings={() => setShowSettings(true)}
      />
      <main className="flex-1 overflow-hidden">
        <PasswordDetail
          record={selectedRecord}
          categories={categories}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={handleCancel}
        />
      </main>

      {/* Password Health Check Modal */}
      {showHealthCheck && (
        <PasswordHealth
          records={records.map(r => ({ id: r.id, name: r.title }))}
          onClose={() => setShowHealthCheck(false)}
          onSelectRecord={(id) => {
            const record = records.find(r => r.id === id)
            if (record) {
              handleSelectRecord(record)
              setShowHealthCheck(false)
            }
          }}
        />
      )}
      {/* Category Manager Modal */}
      {showCategoryManager && (
        <CategoryManager
          onClose={() => setShowCategoryManager(false)}
          onCategoriesChange={loadCategories}
        />
      )}
      {/* Data Transfer Modal */}
      {showDataTransfer && (
        <DataTransfer
          onClose={() => setShowDataTransfer(false)}
          onDataChange={() => {
            loadRecords(searchText)
            loadCategories()
          }}
        />
      )}
      {/* Settings Modal */}
      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

export default App
