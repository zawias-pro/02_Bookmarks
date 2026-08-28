import { useState, type FormEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { createId, db } from '../persistence/database.ts'
import { Modal } from '../components/Modal/Modal.tsx'
import { Field } from '../components/Field/Field.tsx'
import { Button } from '../components/Button/Button.tsx'
import { useAppStore } from '../store/appStore.ts'

const AddBookmarkForm = () => {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []) ?? []
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
      categoryId: categoryId || undefined,
      order: await db.bookmarks.count() + 1,
      updatedAt: now,
    })
    setTitle('')
    setLink('')
    setCategoryId('')
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
        <Field label="Category" htmlFor="bookmark-category">
          <select id="bookmark-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">No category</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </Field>
        <Button type="submit">Add</Button>
      </form>
    </Modal>
  )
}

export { AddBookmarkForm }