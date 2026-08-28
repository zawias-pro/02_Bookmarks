import type { LocalBookmark } from '../../model/model.ts'
import { useAppStore } from '../../store/appStore.ts'
import { Button } from '../../components/Button/Button.tsx'
import styles from './BookmarkItem.module.css'

const BookmarkItem = ({ bookmark }: { bookmark: LocalBookmark }) => {
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
      <Button variant="ghost" onClick={() => setEditingBookmarkId(bookmark.id)}>Edit</Button>
    </li>
  )
}

export { BookmarkItem }
