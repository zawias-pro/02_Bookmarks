import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Modal } from '../components/Modal/Modal.tsx'
import { db } from '../persistence/database.ts'
import { useAppStore } from '../store/appStore.ts'

const EditCategoryForm = () => {
  const categoryId = useAppStore((state) => state.selectedCategoryId)
  const isOpen = useAppStore((state) => state.isCategoryEditFormOpen)
  const setOpen = useAppStore((state) => state.setCategoryEditFormOpen)
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

  if (!isOpen || !category) return null

  return (
    <Modal titleId="edit-category-title" onClose={() => setOpen(false)}>
      <h2 id="edit-category-title">Edit category</h2>
      <form onSubmit={updateCategory}>
        <label htmlFor="edit-category-name">Category name</label>
        <input id="edit-category-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        <button type="submit">Save</button>
      </form>
    </Modal>
  )
}

export { EditCategoryForm }
