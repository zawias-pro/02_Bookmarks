import { create } from 'zustand'
import { pb } from '../persistence/pocketbase.ts'
import type { RecordModel } from 'pocketbase'

type AuthUser = RecordModel & {
  email?: string
  username?: string
}

type AppStore = {
  isAuthFormOpen: boolean
  isCategoryFormOpen: boolean
  isBookmarkFormOpen: boolean
  authUser: AuthUser | null
  selectedCategoryId: string | null
  setAuthFormOpen: (isOpen: boolean) => void
  setCategoryFormOpen: (isOpen: boolean) => void
  setBookmarkFormOpen: (isOpen: boolean) => void
  setSelectedCategoryId: (categoryId: string | null) => void
}

const useAppStore = create<AppStore>((set) => ({
  isAuthFormOpen: false,
  isCategoryFormOpen: false,
  isBookmarkFormOpen: false,
  authUser: pb.authStore.record as AuthUser | null,
  selectedCategoryId: null,
  setAuthFormOpen: (isOpen) => set({ isAuthFormOpen: isOpen }),
  setCategoryFormOpen: (isOpen) => set({ isCategoryFormOpen: isOpen }),
  setBookmarkFormOpen: (isOpen) => set({ isBookmarkFormOpen: isOpen }),
  setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
}))

pb.authStore.onChange((_token, record) => {
  useAppStore.setState({ authUser: record as AuthUser | null })
}, true)

export { useAppStore }
