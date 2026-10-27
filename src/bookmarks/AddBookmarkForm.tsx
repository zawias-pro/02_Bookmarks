import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createBookmark } from '../sync/sync.ts'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
import { useAppStore } from '../store/appStore.ts'
import { TagPicker } from './TagPicker/TagPicker.tsx'

const AddBookmarkForm = () => {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const selectedFilter = useAppStore((state) => state.selectedFilter)
  const [tagIds, setTagIds] = useState<string[]>(selectedFilter.kind === 'tag' ? [selectedFilter.tagId] : [])
  const isBookmarkFormOpen = useAppStore((state) => state.isBookmarkFormOpen)
  const setBookmarkFormOpen = useAppStore((state) => state.setBookmarkFormOpen)

  const addBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !link.trim()) return
    try {
      await createBookmark({ title, link, tagIds })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save bookmark.')
    }
    if (navigator.onLine === false) toast.info("You're offline. Saved on this device, will sync on reconnect.")
    setTitle('')
    setLink('')
    setTagIds([])
    setBookmarkFormOpen(false)
  }

  if (!isBookmarkFormOpen) return null

  return (
    <Modal titleId="add-bookmark-title" onClose={() => setBookmarkFormOpen(false)}>
      <h2 id="add-bookmark-title">Add bookmark</h2>
      <form onSubmit={addBookmark}>
        <Field label="Title" htmlFor="bookmark-title">
          <input id="bookmark-title" aria-label="Bookmark title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </Field>
        <Field label="URL" htmlFor="bookmark-link">
          <input id="bookmark-link" aria-label="Bookmark URL" placeholder="https://example.com" type="url" value={link} onChange={(event) => setLink(event.target.value)} />
        </Field>
        <TagPicker selectedTagIds={tagIds} onChange={setTagIds} />
        <Button type="submit">Add</Button>
      </form>
    </Modal>
  )
}

export { AddBookmarkForm }
