import { useEffect, useState, type FormEvent } from 'react';
import type { LocalBookmark } from '../types/bookmark';
import { createId, db } from '../lib/database';

const BookmarkList = ({
  categoryId
}: {
  categoryId: string | null
}) => {
  const [bookmarks, setBookmarks] = useState<LocalBookmark[]>([]);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    db.bookmarks.orderBy('order').toArray().then((items) => {
      setBookmarks(categoryId === null ? items : items.filter((bookmark) => bookmark.categoryIds?.includes(categoryId)));
    });
  }, [categoryId]);

  const addBookmark = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !link.trim()) return;
    const now = new Date().toISOString();
    await db.bookmarks.add({ id: createId(), title: title.trim(), link: link.trim(), order: bookmarks.length + 1, updatedAt: now });
    setTitle('');
    setLink('');
    const items = await db.bookmarks.orderBy('order').toArray();
    setBookmarks(categoryId === null ? items : items.filter((bookmark) => bookmark.categoryIds?.includes(categoryId)));
  };

  const removeBookmark = async (id: string) => {
    await db.bookmarks.delete(id);
    const items = await db.bookmarks.orderBy('order').toArray();
    setBookmarks(categoryId === null ? items : items.filter((bookmark) => bookmark.categoryIds?.includes(categoryId)));
  };

  return (
    <div className="card">
      <h2 className="card-title">Local Bookmarks</h2>
      <p>Changes are saved to this device immediately, even offline.</p>
      <form onSubmit={addBookmark} className="add-form">
        <input aria-label="Bookmark title" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <input aria-label="Bookmark URL" placeholder="https://example.com" type="url" value={link} onChange={(event) => setLink(event.target.value)} />
        <button type="submit">Add</button>
      </form>

      <div className="bookmark-list">
        {bookmarks.map((bookmark) => (
          <div className="bookmark-item" key={bookmark.id}>
            <div className="bookmark-info">
              <div className="bookmark-details">
                <span className="bookmark-title">{bookmark.title}</span>
                <a
                  href={bookmark.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bookmark-link"
                >
                  {bookmark.link}
                </a>
              </div>
            </div>
            <button type="button" onClick={() => void removeBookmark(bookmark.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export { BookmarkList };
