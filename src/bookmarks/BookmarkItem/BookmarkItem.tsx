import type { MouseEvent } from 'react'
import type { LocalBookmark } from '../../model/model.ts'
import { useAppStore } from '../../store/appStore.ts'
import styles from './BookmarkItem.module.css'

const BookmarkItem = ({ bookmark }: { bookmark: LocalBookmark }) => {
  const isEditMode = useAppStore((state) => state.isEditMode)
  const setEditingBookmarkId = useAppStore((state) => state.setEditingBookmarkId)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isEditMode) return
    event.preventDefault()
    setEditingBookmarkId(bookmark.id)
  }

  return (
    <li className={styles.item}>
      <a className={styles.link} href={bookmark.link} target="_self" rel="noopener noreferrer" title={bookmark.title}
         onClick={handleClick}>
        <span className={styles.icon}>
          {bookmark.favicon
            ? <img src={bookmark.favicon} alt="" aria-hidden />
            : <span className={styles.placeholder} aria-hidden>{bookmark.title.slice(0, 1).toUpperCase()}</span>}
        </span>
        <span className={styles.title}>{bookmark.title}</span>
      </a>
    </li>
  )
}

export { BookmarkItem }
