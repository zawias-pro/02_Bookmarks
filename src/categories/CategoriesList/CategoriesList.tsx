import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import { db } from '../../persistence/database.ts'
import { uncategorizedCategoryId } from '../../model/model.ts'
import { moveCategory } from '../../sync/sync.ts'
import { categoryPaths, categoryRows } from '../tree.ts'
import { transformAt } from '../../components/usePointerDrag.ts'
import { useAppStore } from '../../store/appStore.ts'
import { useCategoryDrag } from './useCategoryDrag.ts'
import styles from './CategoriesList.module.css'

const CategoriesList = () => {
  const categories = useLiveQuery(() => db.categories.toArray(), [])
  const visibleCategories = (categories ?? []).filter((category) => category.id !== uncategorizedCategoryId)
  const rows = categoryRows(visibleCategories)
  const paths = categoryPaths(visibleCategories)
  // A synced hidden board means this account's categories already arrived once, so an absent one is really gone.
  const hasSynced = categories?.some((category) => category.id === uncategorizedCategoryId && Boolean(category.remoteId)) ?? false
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId)
  const setSelectedCategory = useAppStore((state) => state.setSelectedCategory)
  const isEditMode = useAppStore((state) => state.isEditMode)
  const seenCategoryId = useRef<string | null>(null)

  useEffect(() => {
    if (selectedCategoryId === uncategorizedCategoryId) return
    if (visibleCategories.some((category) => category.id === selectedCategoryId)) {
      seenCategoryId.current = selectedCategoryId
      return
    }
    if (visibleCategories.length > 0 || seenCategoryId.current === selectedCategoryId || hasSynced) setSelectedCategory(uncategorizedCategoryId)
  }, [visibleCategories, selectedCategoryId, setSelectedCategory, hasSynced])

  const { drag, startDrag, ghostRef, positionRef } = useCategoryDrag(visibleCategories, (categoryId, parentId, index) => {
    void moveCategory(categoryId, parentId, index).catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Could not move category.')
    })
  })

  const optionClass = (isSelected: boolean) => isSelected ? `${styles.option} ${styles.selected}` : styles.option

  return (
    <nav aria-label="Categories">
      <ul className={drag ? `${styles.list} ${styles.dragging}` : styles.list}>
        <li>
          <button className={optionClass(selectedCategoryId === uncategorizedCategoryId)} type="button"
                  onClick={() => setSelectedCategory(uncategorizedCategoryId)}>
            Uncategorized
          </button>
        </li>
        {rows.map(({ category, depth }) => {
          const dropZone = drag?.target?.rowId === category.id ? drag.target.zone : undefined
          return (
            <li key={category.id} className={styles.row} data-category-row={category.id} data-drop={dropZone}>
              <button className={optionClass(selectedCategoryId === category.id)}
                      type="button" data-depth={depth} aria-label={depth > 1 ? paths.get(category.id) : undefined}
                      onClick={() => setSelectedCategory(category.id)}
                      onPointerDown={isEditMode ? (event) => startDrag(category, event) : undefined}>
                {category.name}
              </button>
            </li>
          )
        })}
      </ul>
      {/* The sidebar's backdrop-filter would contain and clip a fixed ghost, so it renders on body. */}
      {drag && createPortal(
        <div ref={ghostRef} className={styles.ghost} style={{ transform: transformAt(positionRef.current.x, positionRef.current.y) }}>
          <div className={styles.option}>{drag.item.name}</div>
        </div>,
        document.body,
      )}
    </nav>
  )
}

export { CategoriesList }
