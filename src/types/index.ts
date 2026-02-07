export interface PasswordRecord {
  id: number
  title: string
  siteOrApp: string
  loginName: string
  loginPass: string
  remarks: string
  createdAt: string
  updatedAt: string
}

export interface AppState {
  records: PasswordRecord[]
  selectedRecord: PasswordRecord | null
  searchText: string
  isAddMode: boolean
  isLocked: boolean
}
