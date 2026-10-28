import { AddTagForm } from '../../tags/AddTagForm.tsx'
import { TagsList } from '../../tags/TagsList/TagsList.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { SyncButton } from '../../sync/SyncButton/SyncButton.tsx'
import { SyncModal } from '../../sync/SyncModal/SyncModal.tsx'
import { useAppStore } from '../../store/appStore.ts'
import { SettingsModal } from '../../settings/SettingsModal/SettingsModal.tsx'
import { useState } from 'react'
import styles from './Sidebar.module.css'

const Sidebar = () => {
  const setTagFormOpen = useAppStore((state) => state.setTagFormOpen)
  const isEditMode = useAppStore((state) => state.isEditMode)
  const toggleEditMode = useAppStore((state) => state.toggleEditMode)
  const [isSettingsOpen, setSettingsOpen] = useState(false)

  return (
    <aside className={styles.sidebar}>
      <header className={styles.navbar}>
        <h1 className={styles.brandTitle}>02_Bookmarks</h1>
        <div className={styles.actions}>
          <SyncButton />
          <button type="button" className={styles.iconButton} onClick={toggleEditMode}
                  aria-label="Toggle edit mode" aria-pressed={isEditMode} title="Toggle edit mode">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
            </svg>
          </button>
          <button type="button" className={styles.iconButton} onClick={() => setSettingsOpen(true)} aria-label="Open settings" title="Open settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M19.43 12.98c.04-.32.07-.65.07-.98s-.02-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.37-.31-.6-.22l-2.49 1a7.7 7.7 0 0 0-1.69-.98l-.38-2.65A.51.51 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.38 2.65a7.7 7.7 0 0 0-1.69.98l-2.49-1c-.23-.08-.48 0-.6.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.08.65-.08.98s.03.66.08.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.37.31.6.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.38-2.65a7.7 7.7 0 0 0 1.69-.98l2.49 1c.23.08.48 0 .6-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </header>
      <h2 className={styles.sidebarTitle}>Tags</h2>
      <TagsList />
      {isEditMode && <Button onClick={() => setTagFormOpen(true)}>Add tag</Button>}
      <AddTagForm />
      <SyncModal />
      {isSettingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </aside>
  )
}

export { Sidebar }
