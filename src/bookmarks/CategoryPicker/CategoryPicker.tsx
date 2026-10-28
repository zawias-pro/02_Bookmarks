import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { uncategorizedCategoryId } from '../../model/model.ts'
import { Field } from '../../components/Field/Field.tsx'

const CategoryPicker = ({
  categoryId,
  onChange,
}: {
  categoryId: string | null
  onChange: (categoryId: string | null) => void
}) => {
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? []
  const visibleCategories = categories
    .filter((category) => category.id !== uncategorizedCategoryId)
    .sort((left, right) => left.name.localeCompare(right.name))

  return (
    <Field label="Category" htmlFor="bookmark-category">
      <select id="bookmark-category" value={categoryId ?? ''} onChange={(event) => onChange(event.target.value || null)}>
        <option value="">No category</option>
        {visibleCategories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
    </Field>
  )
}

export { CategoryPicker }
