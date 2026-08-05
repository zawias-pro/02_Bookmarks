import type { LocalBookmark } from '../../model/model.ts'
import { db } from '../../persistence/database.ts'
import styles from './BookmarkItem.module.css'

const BookmarkItem = ({ bookmark }: { bookmark: LocalBookmark }) => {
  const removeBookmark = async () => {
    await db.bookmarks.delete(bookmark.id)
  }

  return (
    <li className={styles.item}>
      <a href={bookmark.link} target="_self" rel="noopener noreferrer">
        <img src={bookmark.link+'/favicon.ico'} alt={bookmark.title} />
        <div className={styles.details}>
          <div className={styles.title}>{bookmark.title}</div>
          <div className={styles.link}>{bookmark.link}</div>
        </div>
      </a>
      <button type="button" onClick={() => void removeBookmark()}>Delete</button>
    </li>
  )
}

export { BookmarkItem }
