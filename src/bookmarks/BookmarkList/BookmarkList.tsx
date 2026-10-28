import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../persistence/database.ts';
import { useAppStore } from '../../store/appStore.ts';
import { Button } from '../../components/Button/Button.tsx';
import { AddBookmarkForm } from '../AddBookmarkForm.tsx';
import { BookmarkItem } from '../BookmarkItem/BookmarkItem.tsx';
import styles from './BookmarkList.module.css';

const BookmarkList = () => {
  const selectedFilter = useAppStore((state) => state.selectedFilter);
  const isEditMode = useAppStore((state) => state.isEditMode);
  const isBookmarkFormOpen = useAppStore((state) => state.isBookmarkFormOpen);
  const setBookmarkFormOpen = useAppStore((state) => state.setBookmarkFormOpen);
  const bookmarks = useLiveQuery(async () => {
    const items = await db.bookmarks.orderBy('order').toArray();
    if (selectedFilter.kind === 'all') return items;
    if (selectedFilter.kind === 'untagged') return items.filter((bookmark) => bookmark.tagIds.length === 0);
    return items.filter((bookmark) => bookmark.tagIds.includes(selectedFilter.tagId));
  }, [selectedFilter]) ?? [];
  const emptyMessage = selectedFilter.kind === 'all' ? 'No bookmarks yet.' : 'No bookmarks match this filter.';
  return (
    <div>
      <ul className={styles.list}>
        {bookmarks.map((bookmark) => (
          <BookmarkItem key={bookmark.id} bookmark={bookmark} />
        ))}
      </ul>
      {bookmarks.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
      {isEditMode && (
        <div className={styles.actions}>
          <Button onClick={() => setBookmarkFormOpen(true)}>Add bookmark</Button>
        </div>
      )}
      {isBookmarkFormOpen && <AddBookmarkForm />}
    </div>
  );
};

export { BookmarkList };
