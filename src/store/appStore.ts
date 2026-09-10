import { create } from 'zustand'
import { pb } from '../persistence/pocketbase.ts'
import { nextThemeSetting, readThemeSetting, resolveThemeSetting, themeMediaQuery, themeStorageKey, type Theme, type ThemeSetting } from '../theming/theme.ts'
import type { RecordModel } from 'pocketbase'

type AuthUser = RecordModel & {
  email?: string
  username?: string
}

type AppStore = {
  isAuthFormOpen: boolean
  isCategoryFormOpen: boolean
  isCategoryEditFormOpen: boolean
  isBookmarkFormOpen: boolean
  editingBookmarkId: string | null
  authUser: AuthUser | null
  isAuthChecked: boolean
  selectedCategoryId: string | null
  themeSetting: ThemeSetting
  theme: Theme
  setAuthFormOpen: (isOpen: boolean) => void
  setCategoryFormOpen: (isOpen: boolean) => void
  setCategoryEditFormOpen: (isOpen: boolean) => void
  setBookmarkFormOpen: (isOpen: boolean) => void
  setEditingBookmarkId: (bookmarkId: string | null) => void
  setAuthChecked: (isChecked: boolean) => void
  setSelectedCategoryId: (categoryId: string | null) => void
  cycleThemeSetting: () => void
  syncSystemTheme: (theme: Theme) => void
}

const initialThemeSetting = readThemeSetting()

const useAppStore = create<AppStore>((set, get) => ({
  isAuthFormOpen: false,
  isCategoryFormOpen: false,
  isCategoryEditFormOpen: false,
  isBookmarkFormOpen: false,
  editingBookmarkId: null,
  authUser: pb.authStore.record as AuthUser | null,
  isAuthChecked: false,
  selectedCategoryId: null,
  themeSetting: initialThemeSetting,
  theme: resolveThemeSetting(initialThemeSetting),
  setAuthFormOpen: (isOpen) => set({ isAuthFormOpen: isOpen }),
  setCategoryFormOpen: (isOpen) => set({ isCategoryFormOpen: isOpen }),
  setCategoryEditFormOpen: (isOpen) => set({ isCategoryEditFormOpen: isOpen }),
  setBookmarkFormOpen: (isOpen) => set({ isBookmarkFormOpen: isOpen }),
  setEditingBookmarkId: (bookmarkId) => set({ editingBookmarkId: bookmarkId }),
  setAuthChecked: (isChecked) => set({ isAuthChecked: isChecked }),
  setSelectedCategoryId: (categoryId) => set({ selectedCategoryId: categoryId }),
  cycleThemeSetting: () => {
    const setting = nextThemeSetting(get().themeSetting)
    localStorage.setItem(themeStorageKey, setting)
    set({ themeSetting: setting, theme: resolveThemeSetting(setting) })
  },
  syncSystemTheme: (theme) => {
    if (get().themeSetting === 'auto') set({ theme })
  },
}))

window.matchMedia(themeMediaQuery).addEventListener('change', (event) => {
  useAppStore.getState().syncSystemTheme(event.matches ? 'dark' : 'light')
})

pb.authStore.onChange((_token, record) => {
  useAppStore.setState({ authUser: record as AuthUser | null })
}, true)

export { useAppStore }
