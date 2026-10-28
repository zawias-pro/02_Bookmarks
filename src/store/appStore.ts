import { create } from 'zustand'
import { pb } from '../persistence/pocketbase.ts'
import { readThemeSetting, resolveThemeSetting, themeMediaQuery, themeStorageKey, type Theme, type ThemeSetting } from '../theming/theme.ts'
import type { RecordModel } from 'pocketbase'

type AuthUser = RecordModel & {
  email?: string
  username?: string
}

type RealtimeStatus = 'off' | 'connecting' | 'live' | 'reconnecting'

type BookmarkFilter = { kind: 'all' } | { kind: 'untagged' } | { kind: 'tag'; tagId: string }

type AppStore = {
  isAuthFormOpen: boolean
  isSyncModalOpen: boolean
  isEditMode: boolean
  isTagFormOpen: boolean
  isTagEditFormOpen: boolean
  isBookmarkFormOpen: boolean
  editingBookmarkId: string | null
  authUser: AuthUser | null
  isAuthChecked: boolean
  selectedFilter: BookmarkFilter
  realtimeStatus: RealtimeStatus
  themeSetting: ThemeSetting
  theme: Theme
  setAuthFormOpen: (isOpen: boolean) => void
  setSyncModalOpen: (isOpen: boolean) => void
  toggleEditMode: () => void
  setTagFormOpen: (isOpen: boolean) => void
  setTagEditFormOpen: (isOpen: boolean) => void
  setBookmarkFormOpen: (isOpen: boolean) => void
  setEditingBookmarkId: (bookmarkId: string | null) => void
  setAuthChecked: (isChecked: boolean) => void
  setFilter: (filter: BookmarkFilter) => void
  setRealtimeStatus: (status: RealtimeStatus) => void
  setThemeSetting: (setting: ThemeSetting) => void
  syncSystemTheme: (theme: Theme) => void
}

const initialThemeSetting = readThemeSetting()

const useAppStore = create<AppStore>((set, get) => ({
  isAuthFormOpen: false,
  isSyncModalOpen: false,
  isEditMode: false,
  isTagFormOpen: false,
  isTagEditFormOpen: false,
  isBookmarkFormOpen: false,
  editingBookmarkId: null,
  authUser: pb.authStore.record as AuthUser | null,
  isAuthChecked: false,
  selectedFilter: { kind: 'all' },
  realtimeStatus: 'off',
  themeSetting: initialThemeSetting,
  theme: resolveThemeSetting(initialThemeSetting),
  setAuthFormOpen: (isOpen) => set({ isAuthFormOpen: isOpen }),
  setSyncModalOpen: (isOpen) => set({ isSyncModalOpen: isOpen }),
  toggleEditMode: () => set((state) => ({ isEditMode: !state.isEditMode })),
  setTagFormOpen: (isOpen) => set({ isTagFormOpen: isOpen }),
  setTagEditFormOpen: (isOpen) => set({ isTagEditFormOpen: isOpen }),
  setBookmarkFormOpen: (isOpen) => set({ isBookmarkFormOpen: isOpen }),
  setEditingBookmarkId: (bookmarkId) => set({ editingBookmarkId: bookmarkId }),
  setAuthChecked: (isChecked) => set({ isAuthChecked: isChecked }),
  setFilter: (filter) => set({ selectedFilter: filter }),
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
export type { BookmarkFilter, RealtimeStatus }
