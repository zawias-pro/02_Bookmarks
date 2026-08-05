import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../persistence/database.ts'
import { useAppStore } from '../store/appStore.ts'
import { EditCategoryForm } from './EditCategoryForm.tsx'

const CategoryHeader = () => {
  const categoryId = useAppStore((state) => state.selectedCategoryId)
  const setSelectedCategoryId = useAppStore((state) => state.setSelectedCategoryId)
  const setCategoryEditFormOpen = useAppStore((state) => state.setCategoryEditFormOpen)
  const category = useLiveQuery(() => categoryId === null ? undefined : db.categories.get(categoryId), [categoryId])

  const deleteCategory = async () => {
    if (!category) return
    await db.transaction('rw', db.categories, db.bookmarks, async () => {
      await db.bookmarks.where('categoryId').equals(category.id).modify({ categoryId: undefined })
      await db.categories.delete(category.id)
    })
    setSelectedCategoryId(null)
  }

  return (
    <>
      <header>
        <h1>{category?.name ?? 'No category'}</h1>
        {category && (
          <>
            <button type="button" onClick={() => setCategoryEditFormOpen(true)}>Edit</button>
            <button type="button" onClick={() => void deleteCategory()}>Delete</button>
          </>
        )}
      </header>
      <EditCategoryForm />
    </>
  )
}

export { CategoryHeader }
