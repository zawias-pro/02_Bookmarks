import { AddCategoryForm } from '../../categories/AddCategoryForm.tsx'
import { CategoriesList } from '../../categories/CategoriesList/CategoriesList.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { SyncButton } from '../../sync/SyncButton/SyncButton.tsx'
import { SyncModal } from '../../sync/SyncModal/SyncModal.tsx'
import { useAppStore } from '../../store/appStore.ts'
import { SettingsModal } from '../../settings/SettingsModal/SettingsModal.tsx'
import { useState } from 'react'
import styles from './Sidebar.module.css'

const Sidebar = () => {
  const setCategoryFormOpen = useAppStore((state) => state.setCategoryFormOpen)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  return (
    <aside className={styles.sidebar}>
      <header className={styles.navbar}>
        <h1 className={styles.brandTitle}>02_Bookmarks</h1>
        <div className={styles.actions}>
          <SyncButton />
          <button type="button" className={styles.settingsButton} onClick={() => setSettingsOpen(true)} aria-label="Open settings" title="Open settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.37-.31-.6-.22l-2.49 1a7.7 7.7 0 0 0-1.69-.98l-.38-2.65A.51.51 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.38 2.65a7.7 7.7 0 0 0-1.69.98l-2.49-1c-.23-.08-.48 0-.6.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.37.31.6.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65a7.7 7.7 0 0 0 1.69-.98l2.49 1c.23.08.48 0 .6-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>
      <h2 className={styles.sidebarTitle}>Categories</h2>
      <CategoriesList />
      <Button onClick={() => setCategoryFormOpen(true)}>Add category</Button>
      <AddCategoryForm />
      <SyncModal />
      {isSettingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </aside>
  )
}

export { Sidebar }
