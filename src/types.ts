export interface PasswordRecord {
  id: number
  title: string
  siteOrApp: string
  loginName: string
  loginPass: string
  remarks: string
  categoryId: number | null
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  icon: string
  color: string
  createdAt: string
}

export interface CategoryCount {
  categoryId: number | null
  count: number
}
