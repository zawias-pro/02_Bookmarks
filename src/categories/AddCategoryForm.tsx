import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createCategory } from '../sync/sync.ts'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
import { useAppStore } from '../store/appStore.ts'

const AddCategoryForm = () => {
  const [name, setName] = useState('')
  const isCategoryFormOpen = useAppStore((state) => state.isCategoryFormOpen)
  const setCategoryFormOpen = useAppStore((state) => state.setCategoryFormOpen)

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    try {
      await createCategory(trimmedName)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save category.')
    }
    if (navigator.onLine === false) toast.info("You're offline. Saved on this device, will sync on reconnect.")
    setName('')
    setCategoryFormOpen(false)
  }

  if (!isCategoryFormOpen) return null

  return (
    <Modal titleId="add-category-title" onClose={() => setCategoryFormOpen(false)}>
      <h2 id="add-category-title">Add category</h2>
      <form onSubmit={addCategory}>
        <Field label="Category name" htmlFor="category-name">
          <input id="category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" autoFocus />
        </Field>
        <Button type="submit">Add</Button>
      </form>
    </Modal>
  )
}

export { AddCategoryForm }
