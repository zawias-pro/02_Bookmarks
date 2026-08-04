import { create } from 'zustand'
import { pb } from '../persistence/pocketbase.ts'

type AppStore = {
  isAuthFormOpen: boolean
  isSyncEnabled: boolean
  selectedCategoryId: string | null
  setAuthFormOpen: (isOpen: boolean) => void
  setSelectedCategoryId: (categoryId: string | null) => void
}

const useAppStore = create<AppStore>((set) => ({
  isAuthFormOpen: false,
  isSyncEnabled: pb.authStore.isValid,
  selectedCategoryId: null,
  setAuthFormOpen: (isOpen) => set({ isAuthFormOpen: isOpen }),
  setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
}))

pb.authStore.onChange(() => {
  useAppStore.setState({ isSyncEnabled: pb.authStore.isValid })
}, true)

export { useAppStore }
