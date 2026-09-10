import type { LocalBookmark } from '../../model/model.ts'
import { useAppStore } from '../../store/appStore.ts'
import { Button } from '../../components/Button/Button.tsx'
import styles from './BookmarkItem.module.css'

const BookmarkItem = ({ bookmark }: { bookmark: LocalBookmark }) => {
  const setEditingBookmarkId = useAppStore((state) => state.setEditingBookmarkId)

  return (
    <li className={styles.item}>
      <a href={bookmark.link} target="_self" rel="noopener noreferrer">
        {bookmark.favicon
          ? <img src={bookmark.favicon} alt="" aria-hidden />
          : <span className={styles.placeholder} aria-hidden>{bookmark.title.slice(0, 1).toUpperCase()}</span>}
        <div className={styles.details}>
          <div className={styles.title}>{bookmark.title}</div>
          <div className={styles.link}>{bookmark.link}</div>
        </div>
      </a>
      <Button variant="ghost" onClick={() => setEditingBookmarkId(bookmark.id)}>Edit</Button>
    </li>
  )
}

export { BookmarkItem }
