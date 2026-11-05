import type { MouseEvent } from 'react'
import { isStandaloneApp } from '../../core/layout.ts'
import type { LocalBookmark } from '../../model/model.ts'
import { useAppStore } from '../../store/appStore.ts'
import styles from './BookmarkItem.module.css'

// A link must not take over the installed app window, so it opens in a browser-backed view instead.
const linkTarget = isStandaloneApp() ? '_blank' : '_self'

const BookmarkItem = ({ bookmark }: { bookmark: LocalBookmark }) => {
  const isEditMode = useAppStore((state) => state.isEditMode)
  const setEditingBookmarkId = useAppStore((state) => state.setEditingBookmarkId)

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!isEditMode) return
    event.preventDefault()
    setEditingBookmarkId(bookmark.id)
  }

  return (
    <a className={isEditMode ? `${styles.link} ${styles.draggable}` : styles.link}
       href={bookmark.link} target={linkTarget} rel="noopener noreferrer" title={bookmark.title}
       draggable={false} onClick={handleClick}>
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
