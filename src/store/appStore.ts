import { create } from 'zustand'

type AppStore = {
  isAuthFormOpen: boolean
  setAuthFormOpen: (isOpen: boolean) => void
}

const useAppStore = create<AppStore>((set) => ({
  isAuthFormOpen: false,
  setAuthFormOpen: (isOpen) => set({ isAuthFormOpen: isOpen }),
}))

export { useAppStore }
