import { useState, type FormEvent } from 'react'
import { createId, db } from '../persistence/database.ts'
import { Modal } from '../components/Modal/Modal.tsx'
import { useAppStore } from '../store/appStore.ts'

const AddCategoryForm = () => {
  const [name, setName] = useState('')
  const isCategoryFormOpen = useAppStore((state) => state.isCategoryFormOpen)
  const setCategoryFormOpen = useAppStore((state) => state.setCategoryFormOpen)

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    if (await db.categories.where('name').equalsIgnoreCase(trimmedName).first()) return

    await db.categories.add({ id: createId(), name: trimmedName, createdAt: new Date().toISOString() })
    setName('')
    setCategoryFormOpen(false)
  }

  if (!isCategoryFormOpen) return null

  return (
    <Modal titleId="add-category-title" onClose={() => setCategoryFormOpen(false)}>
      <h2 id="add-category-title">Add category</h2>
      <form className="category-form" onSubmit={addCategory}>
        <label htmlFor="category-name">Category name</label>
        <input id="category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" autoFocus />
        <button type="submit">Add</button>
      </form>
    </Modal>
  )
}

export { AddCategoryForm }
