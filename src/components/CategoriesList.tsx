import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../persistence/database'
import { useAppStore } from '../store/appStore.ts'

const CategoriesList = () => {
  const categories = useLiveQuery(() => db.categories.orderBy('name').toArray(), []) ?? []
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId)
  const setSelectedCategoryId = useAppStore((state) => state.setSelectedCategoryId)

  return (
    <nav aria-label="Bookmark categories" className="category-list">
      <button className={selectedCategoryId === null ? 'category-option selected' : 'category-option'} type="button" onClick={() => setSelectedCategoryId(null)}>
        Any category
      </button>
      {categories.map((category) => (
        <button className={selectedCategoryId === category.id ? 'category-option selected' : 'category-option'} type="button" key={category.id} onClick={() => setSelectedCategoryId(category.id)}>
          {category.name}
        </button>
      ))}
    </nav>
  )
}

export { CategoriesList }
