import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { uncategorizedCategoryId } from '../../model/model.ts'
import { categoryPaths, categoryRows } from '../../categories/tree.ts'
import { Field } from '../../components/Field/Field.tsx'

const CategoryPicker = ({
  categoryId,
  onChange,
}: {
  categoryId: string | null
  onChange: (categoryId: string | null) => void
}) => {
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? []
  const visibleCategories = categories.filter((category) => category.id !== uncategorizedCategoryId)
  const paths = categoryPaths(visibleCategories)

  return (
    <Field label="Category" htmlFor="bookmark-category">
      <select id="bookmark-category" value={categoryId ?? ''} onChange={(event) => onChange(event.target.value || null)}>
        <option value="">No category</option>
        {categoryRows(visibleCategories).map(({ category }) => (
          <option key={category.id} value={category.id}>{paths.get(category.id)}</option>
        ))}
      </select>
    </Field>
  )
}

export { CategoryPicker }
