import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
import { db } from '../persistence/database.ts'
import { deleteCategory, updateCategory } from '../sync/sync.ts'
import { useAppStore } from '../store/appStore.ts'

const EditCategoryForm = () => {
  const categoryId = useAppStore((state) => state.selectedCategoryId)
  const isOpen = useAppStore((state) => state.isCategoryEditFormOpen)
  const setOpen = useAppStore((state) => state.setCategoryEditFormOpen)
  const setSelectedCategoryId = useAppStore((state) => state.setSelectedCategoryId)
  const category = useLiveQuery(() => categoryId === null ? undefined : db.categories.get(categoryId), [categoryId])
  const [name, setName] = useState('')

  useEffect(() => {
    setName(category?.name ?? '')
  }, [category])

  const updateCategoryEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!category || !trimmedName) return
    try {
      await updateCategory(category.id, trimmedName)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save category.')
    }
    if (navigator.onLine === false) toast.info("You're offline. Saved on this device, will sync on reconnect.")
    setOpen(false)
  }

  const removeCategory = async () => {
    if (!category) throw new Error('Cannot delete category because no category is selected.')
    if (!window.confirm(`Delete category "${category.name}"? Related bookmarks will be kept without a category.`)) return
    try {
      await deleteCategory(category.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete category.')
    }
    if (navigator.onLine === false) toast.info("You're offline. Deleted on this device, will sync on reconnect.")
    setOpen(false)
    setSelectedCategoryId(null)
  }

  if (!isOpen || !category) return null

  return (
    <Modal titleId="edit-category-title" onClose={() => setOpen(false)}>
      <h2 id="edit-category-title">Edit category</h2>
      <form onSubmit={updateCategoryEntry}>
        <Field label="Category name" htmlFor="edit-category-name">
          <input id="edit-category-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Button type="submit">Save</Button>
        <Button type="button" variant="dangerGhost" onClick={() => void removeCategory()}>Delete category</Button>
      </form>
    </Modal>
  )
}

export { EditCategoryForm }
