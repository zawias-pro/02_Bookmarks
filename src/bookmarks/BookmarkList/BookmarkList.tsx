import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { db } from '../../persistence/database.ts';
import { uncategorizedCategoryId } from '../../model/model.ts';
import type { LocalBookmark } from '../../model/model.ts';
import { moveCategoryBookmark } from '../../sync/sync.ts';
import { useAppStore } from '../../store/appStore.ts';
import { Button } from '../../components/Button/Button.tsx';
import { AddBookmarkForm } from '../AddBookmarkForm.tsx';
import { EditBookmarkForm } from '../EditBookmarkForm.tsx';
import { BookmarkItem } from '../BookmarkItem/BookmarkItem.tsx';
import { layoutBookmarks } from './layout.ts';
import styles from './BookmarkList.module.css';

const pointerSensorOptions = { activationConstraint: { distance: 6 } }

const DraggableBookmark = ({ bookmark, disabled }: { bookmark: LocalBookmark; disabled: boolean }) => {
  const { setNodeRef, listeners, isDragging } = useDraggable({ id: bookmark.id, disabled });
  return (
    <div ref={setNodeRef} className={styles.handle} data-draggable={disabled ? undefined : 'true'}
         data-dragging={isDragging ? 'true' : undefined} {...listeners}>
      <BookmarkItem bookmark={bookmark} />
    </div>
  );
};

const EmptySlot = ({ slot }: { slot: number }) => {
  const { setNodeRef, isOver } = useDroppable({ id: slot });
  return (
    <li ref={setNodeRef} className={styles.slot} data-over={isOver ? 'true' : undefined}>
      <span className={styles.target} />
    </li>
  );
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
  const [dragged, setDragged] = useState<LocalBookmark | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, pointerSensorOptions));

  const startDrag = (event: DragStartEvent) => {
    setDragged(bookmarks.find((bookmark) => bookmark.id === event.active.id) ?? null);
  };

  const endDrag = (event: DragEndEvent) => {
    setDragged(null);
    const slot = event.over?.id;
    if (typeof slot !== 'number') return;
    const layout = Object.fromEntries([...bySlot].map(([cellSlot, bookmark]) => [bookmark.id, cellSlot]));
    void moveCategoryBookmark(selectedCategoryId, String(event.active.id), slot, layout).catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Could not move bookmark.');
    });
  };

  const cellCount = Math.ceil(maxSlot / 6) * 6 + (dragged ? 6 : 0);
  const emptyMessage = selectedCategoryId === uncategorizedCategoryId ? 'No uncategorized bookmarks.' : 'No bookmarks in this category.';

  return (
    <div>
      <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={startDrag}
                  onDragEnd={endDrag} onDragCancel={() => setDragged(null)}>
        <ul className={styles.list} data-dragging={dragged ? 'true' : undefined}>
          {Array.from({ length: cellCount }, (_unused, index) => index + 1).map((slot) => {
            const bookmark = bySlot.get(slot);
            return bookmark
              ? (
                <li key={slot} className={styles.slot}>
                  <DraggableBookmark bookmark={bookmark} disabled={!isEditMode} />
                </li>
              )
              : <EmptySlot key={slot} slot={slot} />;
          })}
        </ul>
        <DragOverlay dropAnimation={null}>
          {dragged && <div className={styles.overlay}><BookmarkItem bookmark={dragged} /></div>}
        </DragOverlay>
      </DndContext>
      {bookmarks.length === 0 && <p className={styles.empty}>{emptyMessage}</p>}
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
