import { useState, type FormEvent } from 'react'
import { createId, db } from '../persistence/database.ts'

const AddBookmarkForm = () => {
  const [title, setTitle] = useState('')
  const [link, setLink] = useState('')

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
  }

  return (
    <form onSubmit={addBookmark} className="add-form">
      <input aria-label="Bookmark title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
      <input aria-label="Bookmark URL" placeholder="https://example.com" type="url" value={link} onChange={(event) => setLink(event.target.value)} />
      <button type="submit">Add</button>
    </form>
  )
}

export { AddBookmarkForm }
