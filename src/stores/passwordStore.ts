import { create } from 'zustand'
import type { PasswordRecord } from '../types'

interface PasswordState {
  records: PasswordRecord[]
  selectedRecord: PasswordRecord | null
  searchText: string
  isAddMode: boolean
  isLocked: boolean
  
  setRecords: (records: PasswordRecord[]) => void
  setSelectedRecord: (record: PasswordRecord | null) => void
  setSearchText: (text: string) => void
  setAddMode: (mode: boolean) => void
  setLocked: (locked: boolean) => void
}

export const usePasswordStore = create<PasswordState>((set) => ({
  records: [],
  selectedRecord: null,
  searchText: '',
  isAddMode: false,
  isLocked: true,

  setRecords: (records) => set({ records }),
  setSelectedRecord: (selectedRecord) => set({ selectedRecord }),
  setSearchText: (searchText) => set({ searchText }),
  setAddMode: (isAddMode) => set({ isAddMode }),
  setLocked: (isLocked) => set({ isLocked }),
}))
