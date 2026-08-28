import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../persistence/database.ts';
import { useAppStore } from '../../store/appStore.ts';
import { Button } from '../../components/Button/Button.tsx';
import { AddBookmarkForm } from '../AddBookmarkForm.tsx';
import { BookmarkItem } from '../BookmarkItem/BookmarkItem.tsx';
import { EditBookmarkForm } from '../EditBookmarkForm.tsx';
import styles from './BookmarkList.module.css';

const BookmarkList = () => {
  const categoryId = useAppStore((state) => state.selectedCategoryId);
  const isBookmarkFormOpen = useAppStore((state) => state.isBookmarkFormOpen);
  const setBookmarkFormOpen = useAppStore((state) => state.setBookmarkFormOpen);
  const bookmarks = useLiveQuery(async () => {
    const items = await db.bookmarks.orderBy('order').toArray();
    return categoryId === null ? items.filter((bookmark) => !bookmark.categoryId) : items.filter((bookmark) => bookmark.categoryId === categoryId);
  }, [categoryId]) ?? [];
  return (
    <div>
      <ul className={styles.list}>
        {bookmarks.map((bookmark) => (
          <BookmarkItem key={bookmark.id} bookmark={bookmark} />
        ))}
      </ul>
      {bookmarks.length === 0 && <p className={styles.empty}>This category is empty.</p>}
      <div className={styles.actions}>
        <Button onClick={() => setBookmarkFormOpen(true)}>Add bookmark</Button>
      </div>
      {isBookmarkFormOpen && <AddBookmarkForm />}
      <EditBookmarkForm />
    </div>
  );
};

export { BookmarkList }
