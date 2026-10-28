import type { MouseEvent, PointerEvent } from 'react'
import type { LocalBookmark } from '../../model/model.ts'
import { useAppStore } from '../../store/appStore.ts'
import styles from './BookmarkItem.module.css'

const BookmarkItem = ({
  bookmark,
  onDragStart,
}: {
  bookmark: LocalBookmark
  onDragStart?: (event: PointerEvent<HTMLAnchorElement>) => void
}) => {
  const isEditMode = useAppStore((state) => state.isEditMode)
  const setEditingBookmarkId = useAppStore((state) => state.setEditingBookmarkId)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isEditMode) return
    event.preventDefault()
    setEditingBookmarkId(bookmark.id)
  }

  return (
    <a className={isEditMode ? `${styles.link} ${styles.draggable}` : styles.link}
       href={bookmark.link} target="_self" rel="noopener noreferrer" title={bookmark.title}
       draggable={false} onClick={handleClick} onPointerDown={isEditMode ? onDragStart : undefined}>
      <span className={styles.icon}>
        {bookmark.favicon
          ? <img src={bookmark.favicon} alt="" aria-hidden draggable={false} />
          : <span className={styles.placeholder} aria-hidden>{bookmark.title.slice(0, 1).toUpperCase()}</span>}
      </span>
      <span className={styles.title}>{bookmark.title}</span>
    </a>
  )
}

export { BookmarkItem }
