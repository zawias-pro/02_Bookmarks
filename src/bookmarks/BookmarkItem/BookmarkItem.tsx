import type { LocalBookmark } from '../../model/model.ts'
import { db } from '../../persistence/database.ts'
import { useAppStore } from '../../store/appStore.ts'
import styles from './BookmarkItem.module.css'

const BookmarkItem = ({ bookmark }: { bookmark: LocalBookmark }) => {
  const removeBookmark = async () => {
    await db.bookmarks.delete(bookmark.id)
  }
  const setEditingBookmarkId = useAppStore((state) => state.setEditingBookmarkId)

  return (
    <li className={styles.item}>
      <a href={bookmark.link} target="_self" rel="noopener noreferrer">
        <img
          src={`https://favicon.vemetric.com/${new URL(bookmark.link).hostname}?size=64`}
          alt={`Icon for ${bookmark.title}`}
          aria-hidden
        />
        <div className={styles.details}>
          <div className={styles.title}>{bookmark.title}</div>
          <div className={styles.link}>{bookmark.link}</div>
        </div>
      </a>
      <button type="button" onClick={() => void removeBookmark()}>Delete</button>
      <button type="button" onClick={() => setEditingBookmarkId(bookmark.id)}>Edit</button>
    </li>
  )
}

export { BookmarkItem }
