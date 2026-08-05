import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Modal } from '../components/Modal/Modal.tsx'
import { db } from '../persistence/database.ts'
import { useAppStore } from '../store/appStore.ts'

const EditBookmarkForm = () => {
  const editingBookmarkId = useAppStore((state) => state.editingBookmarkId)
  const setEditingBookmarkId = useAppStore((state) => state.setEditingBookmarkId)
  const bookmark = useLiveQuery(
    () => editingBookmarkId === null ? undefined : db.bookmarks.get(editingBookmarkId),
    [editingBookmarkId],
  )
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')

  useEffect(() => {
    setTitle(bookmark?.title ?? '')
    setLink(bookmark?.link ?? '')
  }, [bookmark])

  const updateBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!bookmark || !title.trim() || !link.trim()) return
    await db.bookmarks.update(bookmark.id, { title: title.trim(), link: link.trim(), updatedAt: new Date().toISOString() })
    setEditingBookmarkId(null)
  }

  if (!editingBookmarkId || !bookmark) return null

  return (
    <Modal titleId="edit-bookmark-title" onClose={() => setEditingBookmarkId(null)}>
      <h2 id="edit-bookmark-title">Edit bookmark</h2>
      <form onSubmit={updateBookmark} className="add-form">
        <label htmlFor="edit-bookmark-title-input">Title</label>
        <input id="edit-bookmark-title-input" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        <label htmlFor="edit-bookmark-link-input">URL</label>
        <input id="edit-bookmark-link-input" type="url" value={link} onChange={(event) => setLink(event.target.value)} />
        <button type="submit">Save</button>
      </form>
    </Modal>
  )
}

export { EditBookmarkForm }
