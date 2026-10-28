import { create } from 'zustand'
import { uncategorizedCategoryId } from '../model/model.ts'
import { pb } from '../persistence/pocketbase.ts'
import { readThemeSetting, resolveThemeSetting, themeMediaQuery, themeStorageKey, type Theme, type ThemeSetting } from '../theming/theme.ts'
import type { RecordModel } from 'pocketbase'

type AuthUser = RecordModel & {
  email?: string
  username?: string
}

type RealtimeStatus = 'off' | 'connecting' | 'live' | 'reconnecting'

type AppStore = {
  isAuthFormOpen: boolean
  isSyncModalOpen: boolean
  isEditMode: boolean
  isCategoryFormOpen: boolean
  isCategoryEditFormOpen: boolean
  isBookmarkFormOpen: boolean
  editingBookmarkId: string | null
  authUser: AuthUser | null
  isAuthChecked: boolean
  selectedCategoryId: string
  realtimeStatus: RealtimeStatus
  themeSetting: ThemeSetting
  theme: Theme
  setAuthFormOpen: (isOpen: boolean) => void
  setSyncModalOpen: (isOpen: boolean) => void
  toggleEditMode: () => void
  setCategoryFormOpen: (isOpen: boolean) => void
  setCategoryEditFormOpen: (isOpen: boolean) => void
  setBookmarkFormOpen: (isOpen: boolean) => void
  setEditingBookmarkId: (bookmarkId: string | null) => void
  setAuthChecked: (isChecked: boolean) => void
  setSelectedCategory: (categoryId: string) => void
  setRealtimeStatus: (status: RealtimeStatus) => void
  setThemeSetting: (setting: ThemeSetting) => void
  syncSystemTheme: (theme: Theme) => void
}

const selectedCategoryStorageKey = 'bookmarks.selectedCategoryId'
const previousSelectedCategoryStorageKey = 'bookmarks.selectedTagId'
const initialThemeSetting = readThemeSetting()

const useAppStore = create<AppStore>((set, get) => ({
  isAuthFormOpen: false,
  isSyncModalOpen: false,
  isEditMode: false,
  isCategoryFormOpen: false,
  isCategoryEditFormOpen: false,
  isBookmarkFormOpen: false,
  editingBookmarkId: null,
  authUser: pb.authStore.record as AuthUser | null,
  isAuthChecked: false,
  selectedCategoryId: localStorage.getItem(selectedCategoryStorageKey)
    ?? localStorage.getItem(previousSelectedCategoryStorageKey)
    ?? uncategorizedCategoryId,
  realtimeStatus: 'off',
  themeSetting: initialThemeSetting,
  theme: resolveThemeSetting(initialThemeSetting),
  setAuthFormOpen: (isOpen) => set({ isAuthFormOpen: isOpen }),
  setSyncModalOpen: (isOpen) => set({ isSyncModalOpen: isOpen }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setCategoryFormOpen: (isOpen) => set({ isCategoryFormOpen: isOpen }),
  setCategoryEditFormOpen: (isOpen) => set({ isCategoryEditFormOpen: isOpen }),
  setBookmarkFormOpen: (isOpen) => set({ isBookmarkFormOpen: isOpen }),
  setEditingBookmarkId: (bookmarkId) => set({ editingBookmarkId: bookmarkId }),
  setAuthChecked: (isChecked) => set({ isAuthChecked: isChecked }),
  setSelectedCategory: (categoryId) => {
    localStorage.setItem(selectedCategoryStorageKey, categoryId)
    set({ selectedCategoryId: categoryId })
  },
  setRealtimeStatus: (status) => set({ realtimeStatus: status }),
  setThemeSetting: (setting) => {
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
export type { RealtimeStatus }
