import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../persistence/database.ts'
import { useAppStore } from '../../store/appStore.ts'
import { Button } from '../../components/Button/Button.tsx'
import { EditTagForm } from '../EditTagForm.tsx'
import styles from './TagHeader.module.css'

const TagHeader = () => {
  const selectedFilter = useAppStore((state) => state.selectedFilter)
  const isEditMode = useAppStore((state) => state.isEditMode)
  const setTagEditFormOpen = useAppStore((state) => state.setTagEditFormOpen)
  const tagId = selectedFilter.kind === 'tag' ? selectedFilter.tagId : null
  const tag = useLiveQuery(() => tagId === null ? undefined : db.tags.get(tagId), [tagId])

  let title = 'Tag'
  if (selectedFilter.kind === 'all') title = 'All bookmarks'
  else if (selectedFilter.kind === 'untagged') title = 'Untagged'
  else title = tag?.name ?? 'Tag'

  return (
    <>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
        {isEditMode && tag && <Button variant="ghost" onClick={() => setTagEditFormOpen(true)}>Edit</Button>}
      </header>
      <EditTagForm />
    </>
  )
}

export { TagHeader }
