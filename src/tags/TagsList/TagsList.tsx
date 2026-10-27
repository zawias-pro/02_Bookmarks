import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { useAppStore } from '../../store/appStore.ts'
import styles from './TagsList.module.css'

const TagsList = () => {
  const tags = useLiveQuery(() => db.tags.orderBy('name').toArray(), [])
  const selectedFilter = useAppStore((state) => state.selectedFilter)
  const setFilter = useAppStore((state) => state.setFilter)

  useEffect(() => {
    if (!tags || selectedFilter.kind !== 'tag') return
    if (!tags.some((tag) => tag.id === selectedFilter.tagId)) setFilter({ kind: 'all' })
  }, [tags, selectedFilter, setFilter])

  const optionClass = (isSelected: boolean) => isSelected ? `${styles.option} ${styles.selected}` : styles.option

  return (
    <nav aria-label="Tags">
      <ul className={styles.list}>
        <li>
          <button className={optionClass(selectedFilter.kind === 'all')} type="button"
                  onClick={() => setFilter({ kind: 'all' })}>
            All bookmarks
          </button>
        </li>
        <li>
          <button className={optionClass(selectedFilter.kind === 'untagged')} type="button"
                  onClick={() => setFilter({ kind: 'untagged' })}>
            Untagged
          </button>
        </li>
        {(tags ?? []).map((tag) => (
          <li key={tag.id}>
            <button className={optionClass(selectedFilter.kind === 'tag' && selectedFilter.tagId === tag.id)}
                    type="button" onClick={() => setFilter({ kind: 'tag', tagId: tag.id })}>
              {tag.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { TagsList }
