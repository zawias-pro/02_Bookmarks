import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../persistence/database.ts';
import { useAppStore } from '../store/appStore.ts';
import { AddBookmarkForm } from './AddBookmarkForm.tsx';

const BookmarkList = () => {
  const categoryId = useAppStore((state) => state.selectedCategoryId);
  const isBookmarkFormOpen = useAppStore((state) => state.isBookmarkFormOpen);
  const setBookmarkFormOpen = useAppStore((state) => state.setBookmarkFormOpen);
  const bookmarks = useLiveQuery(async () => {
    const items = await db.bookmarks.orderBy('order').toArray();
    return categoryId === null ? items : items.filter((bookmark) => bookmark.categoryIds?.includes(categoryId));
  }, [categoryId]) ?? [];
  const removeBookmark = async (id: string) => {
    await db.bookmarks.delete(id);
  };

  return (
    <div className="card">
      <h2 className="card-title">Local Bookmarks</h2>
      <p>Changes are saved to this device immediately, even offline.</p>
      <button type="button" onClick={() => setBookmarkFormOpen(true)}>Add bookmark</button>
      {isBookmarkFormOpen && <AddBookmarkForm />}

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
