import { useState, type FormEvent } from 'react'
import { createId, db } from '../persistence/database.ts'

const AddCategoryForm = () => {
  const [name, setName] = useState('')

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    if (await db.categories.where('name').equalsIgnoreCase(trimmedName).first()) return

    await db.categories.add({ id: createId(), name: trimmedName, createdAt: new Date().toISOString() })
    setName('')
  }

  return (
    <form className="category-form" onSubmit={addCategory}>
      <label htmlFor="category-name">Add category</label>
      <input id="category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" />
      <button type="submit">Add</button>
    </form>
  )
}

export { AddCategoryForm }
