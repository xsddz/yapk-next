import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import Sidebar from './components/Sidebar'
import PasswordDetail from './components/PasswordDetail'
import { usePasswordStore } from './stores/passwordStore'
import type { PasswordRecord } from './types'

function App() {
  const { 
    records, 
    selectedRecord, 
    searchText,
    isAddMode,
    setRecords, 
    setSelectedRecord,
    setSearchText,
    setAddMode
  } = usePasswordStore()

  // Load password records on mount
  useEffect(() => {
    loadRecords('')
  }, [])

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

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100">
      <Sidebar
        records={records}
        searchText={searchText}
        onSearch={handleSearch}
        onAddClick={handleAddClick}
        isAddMode={isAddMode}
        selectedId={selectedRecord?.id}
        onSelectRecord={handleSelectRecord}
      />
      <main className="flex-1 overflow-hidden">
        <PasswordDetail
          record={selectedRecord}
          onSave={handleSave}
          onDelete={handleDelete}
          onCancel={handleCancel}
        />
      </main>
    </div>
  )
}

export default App
