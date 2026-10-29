import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { db } from '../../persistence/database.ts';
import { uncategorizedCategoryId } from '../../model/model.ts';
import type { LocalBookmark } from '../../model/model.ts';
import { moveCategoryBookmark } from '../../sync/sync.ts';
import { useAppStore } from '../../store/appStore.ts';
import { Button } from '../../components/Button/Button.tsx';
import { AddBookmarkForm } from '../AddBookmarkForm.tsx';
import { EditBookmarkForm } from '../EditBookmarkForm.tsx';
import { BookmarkItem } from '../BookmarkItem/BookmarkItem.tsx';
import { transformAt, usePointerDrag } from '../../components/usePointerDrag.ts';
import { layoutBookmarks } from './layout.ts';
import styles from './BookmarkList.module.css';

const slotAt = (x: number, y: number) => {
  const cell = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-slot]');
  if (!cell || cell.dataset.occupied !== 'false') return null;
  return Number(cell.dataset.slot);
};

const BookmarkList = () => {
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId);
  const isEditMode = useAppStore((state) => state.isEditMode);
  const isBookmarkFormOpen = useAppStore((state) => state.isBookmarkFormOpen);
  const setBookmarkFormOpen = useAppStore((state) => state.setBookmarkFormOpen);
  const category = useLiveQuery(() => db.categories.get(selectedCategoryId), [selectedCategoryId]);
  const bookmarks = useLiveQuery(
    () => selectedCategoryId === uncategorizedCategoryId
      ? db.bookmarks.filter((bookmark) => bookmark.categoryId === null).toArray()
      : db.bookmarks.where('categoryId').equals(selectedCategoryId).toArray(),
    [selectedCategoryId],
  ) ?? [];
  const { bySlot, maxSlot } = layoutBookmarks(bookmarks, category?.positions ?? {});
  const { drag, startDrag, ghostRef, positionRef } = usePointerDrag<number, LocalBookmark>({
    resolveTarget: slotAt,
    onDrop: (bookmark, slot) => {
      const layout = Object.fromEntries([...bySlot].map(([cellSlot, item]) => [item.id, cellSlot]));
      void moveCategoryBookmark(selectedCategoryId, bookmark.id, slot, layout).catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Could not move bookmark.');
      });
    },
  });
  const cellCount = Math.ceil(maxSlot / 6) * 6 + (drag ? 6 : 0);
  const emptyMessage = selectedCategoryId === uncategorizedCategoryId ? 'No uncategorized bookmarks.' : 'No bookmarks in this category.';

  return (
    <div>
      <ul className={drag ? `${styles.list} ${styles.dragging}` : styles.list}>
        {Array.from({ length: cellCount }, (_unused, index) => index + 1).map((slot) => {
          const bookmark = bySlot.get(slot);
          return (
            <li key={slot} className={styles.slot} data-slot={slot} data-occupied={bookmark ? 'true' : 'false'}
                data-active={drag?.target === slot ? 'true' : undefined}>
              {bookmark && (
                <BookmarkItem bookmark={bookmark}
                              onDragStart={isEditMode ? (event) => startDrag(bookmark, event) : undefined} />
              )}
            </li>
          );
        })}
      </ul>
      {bookmarks.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
      {drag && (
        <div ref={ghostRef} className={styles.ghost} style={{ transform: transformAt(positionRef.current.x, positionRef.current.y) }}>
          <BookmarkItem bookmark={drag.item} />
        </div>
      )}
      {isEditMode && (
        <div className={styles.actions}>
          <Button onClick={() => setBookmarkFormOpen(true)}>Add bookmark</Button>
        </div>
      )}
      {isBookmarkFormOpen && <AddBookmarkForm />}
      <EditBookmarkForm />
    </div>
  );
};

export { BookmarkList };
