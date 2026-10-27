import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
import { db } from '../persistence/database.ts'
import { deleteTag, updateTag } from '../sync/sync.ts'
import { useAppStore } from '../store/appStore.ts'

const EditTagForm = () => {
  const selectedFilter = useAppStore((state) => state.selectedFilter)
  const isOpen = useAppStore((state) => state.isTagEditFormOpen)
  const setOpen = useAppStore((state) => state.setTagEditFormOpen)
  const setFilter = useAppStore((state) => state.setFilter)
  const tagId = selectedFilter.kind === 'tag' ? selectedFilter.tagId : null
  const tag = useLiveQuery(() => tagId === null ? undefined : db.tags.get(tagId), [tagId])
  const [name, setName] = useState('')

  useEffect(() => {
    setName(tag?.name ?? '')
  }, [tag])

  const updateTagEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedName = name.trim()
    if (!tag || !trimmedName) return
    try {
      await updateTag(tag.id, trimmedName)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save tag.')
    }
    if (navigator.onLine === false) toast.info("You're offline. Saved on this device, will sync on reconnect.")
    setOpen(false)
  }

  const removeTag = async () => {
    if (!tag) throw new Error('Cannot delete tag because no tag is selected.')
    if (!window.confirm(`Delete tag "${tag.name}"? Bookmarks will keep their other tags.`)) return
    try {
      await deleteTag(tag.id)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not delete tag.')
    }
    if (navigator.onLine === false) toast.info("You're offline. Deleted on this device, will sync on reconnect.")
    setOpen(false)
    setFilter({ kind: 'all' })
  }

  if (!isOpen || !tag) return null

  return (
    <Modal titleId="edit-tag-title" onClose={() => setOpen(false)}>
      <h2 id="edit-tag-title">Edit tag</h2>
      <form onSubmit={updateTagEntry}>
        <Field label="Tag name" htmlFor="edit-tag-name">
          <input id="edit-tag-name" value={name} onChange={(event) => setName(event.target.value)} autoFocus />
        </Field>
        <Button type="submit">Save</Button>
        <Button type="button" variant="dangerGhost" onClick={() => void removeTag()}>Delete tag</Button>
      </form>
    </Modal>
  )
}

export { EditTagForm }
