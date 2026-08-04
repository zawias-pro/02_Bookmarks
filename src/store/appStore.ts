import { create } from 'zustand'

type AppStore = {
  isAuthFormOpen: boolean
  selectedCategoryId: string | null
  setAuthFormOpen: (isOpen: boolean) => void
  setSelectedCategoryId: (categoryId: string | null) => void
}

const useAppStore = create<AppStore>((set) => ({
  isAuthFormOpen: false,
  selectedCategoryId: null,
  setAuthFormOpen: (isOpen) => set({ isAuthFormOpen: isOpen }),
  setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
}))

export { useAppStore }
