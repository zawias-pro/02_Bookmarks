import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createTag } from '../sync/sync.ts'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
import { useAppStore } from '../store/appStore.ts'

const AddTagForm = () => {
  const [name, setName] = useState('')
  const isTagFormOpen = useAppStore((state) => state.isTagFormOpen)
  const setTagFormOpen = useAppStore((state) => state.setTagFormOpen)

  const addTag = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return
    try {
      await createTag(trimmedName)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save tag.')
    }
    if (navigator.onLine === false) toast.info("You're offline. Saved on this device, will sync on reconnect.")
    setName('')
    setTagFormOpen(false)
  }

  if (!isTagFormOpen) return null

  return (
    <Modal titleId="add-tag-title" onClose={() => setTagFormOpen(false)}>
      <h2 id="add-tag-title">Add tag</h2>
      <form onSubmit={addTag}>
        <Field label="Tag name" htmlFor="tag-name">
          <input id="tag-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Tag name" autoFocus />
        </Field>
        <Button type="submit">Add</Button>
      </form>
    </Modal>
  )
}

export { AddTagForm }
