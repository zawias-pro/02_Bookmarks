import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { useAppStore } from '../../store/appStore.ts'
import styles from './CategoriesList.module.css'

const CategoriesList = () => {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []) ?? []
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId)
  const setSelectedCategoryId = useAppStore((state) => state.setSelectedCategoryId)

  const optionClass = (isSelected: boolean) => isSelected ? `${styles.option} ${styles.selected}` : styles.option

  return (
    <nav aria-label="Categories">
      <ul className={styles.list}>
        <li>
          <button className={optionClass(selectedCategoryId === null)} type="button"
                  onClick={() => setSelectedCategoryId(null)}>
            No category
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button className={optionClass(selectedCategoryId === category.id)}
                    type="button" onClick={() => setSelectedCategoryId(category.id)}>
              {category.name}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export { CategoriesList }
