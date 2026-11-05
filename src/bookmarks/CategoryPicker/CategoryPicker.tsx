import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { categoryPaths, categoryRows } from '../../categories/tree.ts'
import { Field } from '../../components/Field/Field.tsx'

const CategoryPicker = ({
  categoryId,
  onChange,
}: {
  categoryId: string
  onChange: (categoryId: string) => void
}) => {
  const categories = useLiveQuery(() => db.categories.toArray(), []) ?? []
  const paths = categoryPaths(categories)

  return (
    <Field label="Category" htmlFor="bookmark-category">
      <select id="bookmark-category" value={categoryId} onChange={(event) => onChange(event.target.value)}>
        {categoryRows(categories).map(({ category }) => (
          <option key={category.id} value={category.id}>{paths.get(category.id)}</option>
        ))}
      </select>
    </Field>
  )
}

export { CategoryPicker }
