import type { LocalBookmark } from '../../model/model.ts'
import styles from './BookmarkItem.module.css'

const BookmarkItem = ({ bookmark }: { bookmark: LocalBookmark }) => (
  <li className={styles.item}>
    <a className={styles.link} href={bookmark.link} target="_self" rel="noopener noreferrer" title={bookmark.title}>
      <span className={styles.icon}>
        {bookmark.favicon
          ? <img src={bookmark.favicon} alt="" aria-hidden />
          : <span className={styles.placeholder} aria-hidden>{bookmark.title.slice(0, 1).toUpperCase()}</span>}
      </span>
      <span className={styles.title}>{bookmark.title}</span>
    </a>
  </li>
)

export { BookmarkItem }
