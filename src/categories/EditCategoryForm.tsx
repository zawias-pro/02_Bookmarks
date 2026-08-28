import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
import { db } from '../persistence/database.ts'
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

  const updateCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!category || !trimmedName) return
    const duplicate = await db.categories.where('name').equalsIgnoreCase(trimmedName).first()
    if (duplicate && duplicate.id !== category.id) return
    await db.categories.update(category.id, { name: trimmedName })
    setOpen(false)
  }

  const deleteCategory = async () => {
    if (!category) throw new Error('Cannot delete category because no category is selected.')
    if (!window.confirm(`Delete category "${category.name}"? Related bookmarks will be kept without a category.`)) return
    await db.transaction('rw', db.categories, db.bookmarks, async () => {
      await db.bookmarks.where('categoryId').equals(category.id).modify({ categoryId: undefined })
      await db.categories.delete(category.id)
    })
    setOpen(false)
    setSelectedCategoryId(null)
  }

  if (!isOpen || !category) return null

  return (
    <Modal titleId="edit-category-title" onClose={() => setOpen(false)}>
      <h2 id="edit-category-title">Edit category</h2>
      <form onSubmit={updateCategory}>
        <Field label="Category name" htmlFor="edit-category-name">
          <input id="edit-category-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Button type="submit">Save</Button>
        <Button type="button" variant="dangerGhost" onClick={() => void deleteCategory()}>Delete category</Button>
      </form>
    </Modal>
  )
}

export { EditCategoryForm }
