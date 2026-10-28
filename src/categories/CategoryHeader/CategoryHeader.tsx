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
  const setCategoryEditFormOpen = useAppStore((state) => state.setCategoryEditFormOpen)
  const category = useLiveQuery(() => db.categories.get(selectedCategoryId), [selectedCategoryId])
  const title = selectedCategoryId === uncategorizedCategoryId ? 'Uncategorized' : category?.name ?? 'Category'
  const canEdit = isEditMode && category && category.id !== uncategorizedCategoryId

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {canEdit && <Button variant="ghost" onClick={() => setCategoryEditFormOpen(true)}>Edit</Button>}
      </header>
      <EditCategoryForm />
    </>
  )
}

export { CategoryHeader }
