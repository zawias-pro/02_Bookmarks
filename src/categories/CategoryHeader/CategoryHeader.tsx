import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { uncategorizedCategoryId } from '../../model/model.ts'
import { useAppStore } from '../../store/appStore.ts'
import { Button } from '../../components/Button/Button.tsx'
import { EditCategoryForm } from '../EditCategoryForm.tsx'
import styles from './CategoryHeader.module.css'

const CategoryHeader = () => {
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId)
  const isEditMode = useAppStore((state) => state.isEditMode)
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen)
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen)
  const setCategoryEditFormOpen = useAppStore((state) => state.setCategoryEditFormOpen)
  const category = useLiveQuery(() => db.categories.get(selectedCategoryId), [selectedCategoryId])
  const title = selectedCategoryId === uncategorizedCategoryId ? 'Uncategorized' : category?.name ?? 'Category'
  const canEdit = isEditMode && category && category.id !== uncategorizedCategoryId

  return (
    <>
      <header className={styles.header}>
        <div className={styles.leading}>
          <Button variant="ghost" className={styles.sidebarToggle} onClick={() => setSidebarOpen(!isSidebarOpen)}
                  aria-label="Toggle sidebar" aria-expanded={isSidebarOpen} aria-controls="sidebar" title="Toggle sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <path d="M9 4v16" />
            </svg>
          </Button>
          <h1 className={styles.title}>{title}</h1>
        </div>
        {canEdit && <Button variant="ghost" onClick={() => setCategoryEditFormOpen(true)}>Edit</Button>}
      </header>
      <EditCategoryForm />
    </>
  )
}

export { CategoryHeader }
