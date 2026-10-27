import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import styles from './TagPicker.module.css'

const TagPicker = ({
  selectedTagIds,
  onChange,
}: {
  selectedTagIds: string[]
  onChange: (tagIds: string[]) => void
}) => {
  const tags = useLiveQuery(() => db.tags.orderBy('name').toArray(), []) ?? []

  const toggleTag = (tagId: string, isSelected: boolean) => {
    onChange(isSelected ? [...selectedTagIds, tagId] : selectedTagIds.filter((id) => id !== tagId))
  }

  if (tags.length === 0) return <p className={styles.empty}>No tags yet. Add tags from the sidebar.</p>

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Tags</legend>
      <div className={styles.options}>
        {tags.map((tag) => (
          <label key={tag.id} className={styles.option}>
            <input
              type="checkbox"
              checked={selectedTagIds.includes(tag.id)}
              onChange={(event) => toggleTag(tag.id, event.target.checked)}
            />
            <span>{tag.name}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export { TagPicker }
