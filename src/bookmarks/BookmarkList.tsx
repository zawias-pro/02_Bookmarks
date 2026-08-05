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
    <div>
      <h2>Local Bookmarks</h2>
      <button type="button" onClick={() => setBookmarkFormOpen(true)}>Add bookmark</button>
      {isBookmarkFormOpen && <AddBookmarkForm />}
      <div>
        {bookmarks.map((bookmark) => (
          <div key={bookmark.id}>
            <div>
              <div >
                <span>{bookmark.title}</span>
                <a
                  href={bookmark.link}
                  target="_blank"
                  rel="noopener noreferrer"
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
