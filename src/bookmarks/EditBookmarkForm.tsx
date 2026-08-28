import { useEffect, useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
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
  const [categoryId, setCategoryId] = useState('')
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []) ?? []

  useEffect(() => {
    setTitle(bookmark?.title ?? '')
    setLink(bookmark?.link ?? '')
    setCategoryId(bookmark?.categoryId ?? '')
  }, [bookmark])

  const updateBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!bookmark || !title.trim() || !link.trim()) return
    await db.bookmarks.update(bookmark.id, { title: title.trim(), link: link.trim(), categoryId: categoryId || undefined, updatedAt: new Date().toISOString() })
    setEditingBookmarkId(null)
  }

  const deleteBookmark = async () => {
    if (!bookmark) throw new Error('Cannot delete bookmark because no bookmark is selected.')
    if (!window.confirm(`Delete bookmark "${bookmark.title}"?`)) return
    await db.bookmarks.delete(bookmark.id)
    setEditingBookmarkId(null)
  }

  if (!editingBookmarkId || !bookmark) return null

  return (
    <Modal titleId="edit-bookmark-title" onClose={() => setEditingBookmarkId(null)}>
      <h2 id="edit-bookmark-title">Edit bookmark</h2>
      <form onSubmit={updateBookmark}>
        <Field label="Title" htmlFor="edit-bookmark-title-input">
          <input id="edit-bookmark-title-input" value={title} onChange={(event) => setTitle(event.target.value)} autoFocus />
        </Field>
        <Field label="URL" htmlFor="edit-bookmark-link-input">
          <input id="edit-bookmark-link-input" type="url" value={link} onChange={(event) => setLink(event.target.value)} />
        </Field>
        <Field label="Category" htmlFor="edit-bookmark-category">
          <select id="edit-bookmark-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Button type="submit">Save</Button>
        <Button type="button" variant="dangerGhost" onClick={() => void deleteBookmark()}>Delete bookmark</Button>
      </form>
    </Modal>
  )
}

export { EditBookmarkForm }
