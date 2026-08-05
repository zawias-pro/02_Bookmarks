import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../persistence/database.ts'
import { useAppStore } from '../store/appStore.ts'

const CategoriesList = () => {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []) ?? []
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId)
  const setSelectedCategoryId = useAppStore((state) => state.setSelectedCategoryId)

  return (
    <nav aria-label="Categories">
      <ul>
        <li>
          <button className={selectedCategoryId === null ? 'category-option selected' : 'category-option'} type="button"
                  onClick={() => setSelectedCategoryId(null)}>
            No category
          </button>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <button className={selectedCategoryId === category.id ? 'category-option selected' : 'category-option'}
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
