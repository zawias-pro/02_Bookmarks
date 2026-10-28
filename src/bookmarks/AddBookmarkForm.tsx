import { useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { createBookmark } from '../sync/sync.ts'
import { uncategorizedCategoryId } from '../model/model.ts'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
import { useAppStore } from '../store/appStore.ts'
import { CategoryPicker } from './CategoryPicker/CategoryPicker.tsx'

const AddBookmarkForm = () => {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId)
  const [categoryId, setCategoryId] = useState<string | null>(selectedCategoryId === uncategorizedCategoryId ? null : selectedCategoryId)
  const isBookmarkFormOpen = useAppStore((state) => state.isBookmarkFormOpen)
  const setBookmarkFormOpen = useAppStore((state) => state.setBookmarkFormOpen)

  const addBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !link.trim()) return
    try {
      await createBookmark({ title, link, categoryId })
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save bookmark.')
    }
    if (navigator.onLine === false) toast.info("You're offline. Saved on this device, will sync on reconnect.")
    setTitle('')
    setLink('')
    setCategoryId(null)
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
        <CategoryPicker categoryId={categoryId} onChange={setCategoryId} />
        <Button type="submit">Add</Button>
      </form>
    </Modal>
  )
}

export { AddBookmarkForm }
