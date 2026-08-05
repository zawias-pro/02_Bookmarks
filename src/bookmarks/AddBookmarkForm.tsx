import { useState, type FormEvent } from 'react'
import { createId, db } from '../persistence/database.ts'
import { Modal } from '../components/Modal/Modal.tsx'
import { useAppStore } from '../store/appStore.ts'

const AddBookmarkForm = () => {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const isBookmarkFormOpen = useAppStore((state) => state.isBookmarkFormOpen)
  const setBookmarkFormOpen = useAppStore((state) => state.setBookmarkFormOpen)

  const addBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!title.trim() || !link.trim()) return
    const now = new Date().toISOString()
    await db.bookmarks.add({
      id: createId(),
      title: title.trim(),
      link: link.trim(),
      order: await db.bookmarks.count() + 1,
      updatedAt: now,
    })
    setTitle('')
    setLink('')
    setBookmarkFormOpen(false)
  }

  if (!isBookmarkFormOpen) return null

  return (
    <Modal titleId="add-bookmark-title" onClose={() => setBookmarkFormOpen(false)}>
      <h2 id="add-bookmark-title">Add bookmark</h2>
      <form onSubmit={addBookmark} className="add-form">
        <label htmlFor="bookmark-title">Title</label>
        <input id="bookmark-title" aria-label="Bookmark title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        <label htmlFor="bookmark-link">URL</label>
        <input id="bookmark-link" aria-label="Bookmark URL" placeholder="https://example.com" type="url" value={link} onChange={(event) => setLink(event.target.value)} />
        <button type="submit">Add</button>
      </form>
    </Modal>
  )
}

export { AddBookmarkForm }
