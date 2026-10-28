import { useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { uncategorizedCategoryId } from '../../model/model.ts'
import { useAppStore } from '../../store/appStore.ts'
import styles from './CategoriesList.module.css'

const CategoriesList = () => {
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const visibleCategories = categories?.filter((category) => category.id !== uncategorizedCategoryId).sort((left, right) => left.name.localeCompare(right.name))
  // A synced hidden board means this account's categories already arrived once, so an absent one is really gone.
  const hasSynced = categories?.some((category) => category.id === uncategorizedCategoryId && Boolean(category.remoteId)) ?? false
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId)
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory)
  const seenCategoryId = useRef<string | null>(null)

  useEffect(() => {
    if (!visibleCategories || selectedCategoryId === uncategorizedCategoryId) return
    if (visibleCategories.some((category) => category.id === selectedCategoryId)) {
      seenCategoryId.current = selectedCategoryId
      return
    }
    if (visibleCategories.length > 0 || seenCategoryId.current === selectedCategoryId || hasSynced) setSelectedCategory(uncategorizedCategoryId)
  }, [visibleCategories, selectedCategoryId, setSelectedCategory, hasSynced])

  const optionClass = (isSelected: boolean) => isSelected ? `${styles.option} ${styles.selected}` : styles.option

  return (
    <nav aria-label="Categories">
      <ul className={styles.list}>
        <li>
          <button className={optionClass(selectedCategoryId === uncategorizedCategoryId)} type="button"
                  onClick={() => setSelectedCategory(uncategorizedCategoryId)}>
            Uncategorized
          </button>
        </li>
        {(visibleCategories ?? []).map((category) => (
          <li key={category.id}>
            <button className={optionClass(selectedCategoryId === category.id)}
                    type="button" onClick={() => setSelectedCategory(category.id)}>
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { CategoriesList }
