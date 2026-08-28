import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { useAppStore } from '../../store/appStore.ts'
import { Button } from '../../components/Button/Button.tsx'
import { EditCategoryForm } from '../EditCategoryForm.tsx'
import styles from './CategoryHeader.module.css'

const CategoryHeader = () => {
  const categoryId = useAppStore((state) => state.selectedCategoryId)
  const setCategoryEditFormOpen = useAppStore((state) => state.setCategoryEditFormOpen)
  const category = useLiveQuery(() => categoryId === null ? undefined : db.categories.get(categoryId), [categoryId])

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{category?.name ?? 'No category'}</h1>
        {category && <Button variant="ghost" onClick={() => setCategoryEditFormOpen(true)}>Edit</Button>}
      </header>
      <EditCategoryForm />
    </>
  )
}

export { CategoryHeader }
