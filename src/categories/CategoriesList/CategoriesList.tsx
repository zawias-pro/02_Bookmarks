import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { toast } from 'sonner'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { db } from '../../persistence/database.ts'
import { uncategorizedCategoryId } from '../../model/model.ts'
import type { LocalCategory } from '../../model/model.ts'
import { moveCategory } from '../../sync/sync.ts'
import { canMoveCategory, categoryPaths, categoryRows, categorySiblings } from '../tree.ts'
import { useAppStore } from '../../store/appStore.ts'
import styles from './CategoriesList.module.css'

type DropZone = 'before' | 'inside' | 'after'
type DropTarget = { rowId: string; zone: DropZone; parentId: string | null; index: number }
type DragEvent = DragMoveEvent | DragEndEvent

// The third of the target row under the dragged row decides: above it reorders, the middle nests, below it reorders.
const resolveTarget = (event: DragEvent, categories: LocalCategory[]): DropTarget | null => {
  const movingId = String(event.active.id)
  const rowId = event.over ? String(event.over.id) : null
  const row = rowId ? categories.find((category) => category.id === rowId) : undefined
  const dragged = event.active.rect.current.translated
  if (!rowId || !row || !dragged || !event.over || rowId === movingId) return null
  const middle = dragged.top + dragged.height / 2
  const ratio = (middle - event.over.rect.top) / event.over.rect.height
  const zoneFor = (value: number): DropZone => {
    if (value < 0.3) return 'before'
    if (value > 0.7) return 'after'
    return 'inside'
  }
  const pointerZone = zoneFor(ratio)
  const zone = pointerZone === 'inside' && !canMoveCategory(categories, movingId, rowId) ? 'after' : pointerZone
  const parentId = zone === 'inside' ? rowId : row.parentId
  if (!canMoveCategory(categories, movingId, parentId)) return null
  const siblings = categorySiblings(categories, parentId, movingId)
  const position = siblings.findIndex((category) => category.id === rowId)
  if (zone === 'inside') return { rowId, zone, parentId, index: 0 }
  return { rowId, zone, parentId, index: zone === 'after' ? position + 1 : position }
}

const pointerSensorOptions = { activationConstraint: { distance: 6 } }

const CategoryRow = ({
  category,
  depth,
  label,
  selected,
  disabled,
  dropZone,
  onSelect,
}: {
  category: LocalCategory
  depth: number
  label: string
  selected: boolean
  disabled: boolean
  dropZone: DropZone | undefined
  onSelect: (categoryId: string) => void
}) => {
  const { setNodeRef: setDragRef, listeners, isDragging } = useDraggable({ id: category.id, disabled })
  const { setNodeRef: setDropRef } = useDroppable({ id: category.id })
  const setNodeRef = (node: HTMLLIElement | null) => {
    setDragRef(node)
    setDropRef(node)
  }

  return (
    <li ref={setNodeRef} className={styles.row} data-drop={dropZone} data-draggable={disabled ? undefined : 'true'}>
      <button className={selected ? `${styles.option} ${styles.selected}` : styles.option} type="button"
              data-depth={depth} data-dragging={isDragging ? 'true' : undefined}
              aria-label={depth > 1 ? label : undefined}
              onClick={() => onSelect(category.id)} {...listeners}>
        {category.name}
      </button>
    </li>
  )
}

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
  const [dragged, setDragged] = useState<LocalCategory | null>(null)
  const [target, setTarget] = useState<DropTarget | null>(null)
  const sensors = useSensors(useSensor(PointerSensor, pointerSensorOptions))

  useEffect(() => {
    if (selectedCategoryId === uncategorizedCategoryId) return
    if (visibleCategories.some((category) => category.id === selectedCategoryId)) {
      seenCategoryId.current = selectedCategoryId
      return
    }
    if (visibleCategories.length > 0 || seenCategoryId.current === selectedCategoryId || hasSynced) setSelectedCategory(uncategorizedCategoryId)
  }, [visibleCategories, selectedCategoryId, setSelectedCategory, hasSynced])

  const startDrag = (event: DragStartEvent) => {
    setDragged(visibleCategories.find((category) => category.id === event.active.id) ?? null)
  }

  const moveDrag = (event: DragMoveEvent) => {
    const next = resolveTarget(event, visibleCategories)
    setTarget((current) => current && next && current.rowId === next.rowId && current.zone === next.zone ? current : next)
  }

  const endDrag = (event: DragEndEvent) => {
    const drop = resolveTarget(event, visibleCategories)
    setDragged(null)
    setTarget(null)
    if (!drop) return
    void moveCategory(String(event.active.id), drop.parentId, drop.index).catch((error) => {
      toast.error(error instanceof Error ? error.message : 'Could not move category.')
    })
  }

  const cancelDrag = () => {
    setDragged(null)
    setTarget(null)
  }

  const optionClass = (isSelected: boolean) => isSelected ? `${styles.option} ${styles.selected}` : styles.option

  return (
    <nav aria-label="Categories">
      <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragStart={startDrag}
                  onDragMove={moveDrag} onDragEnd={endDrag} onDragCancel={cancelDrag}>
        <ul className={styles.list}>
          <li>
            <button className={optionClass(selectedCategoryId === uncategorizedCategoryId)} type="button"
                    onClick={() => setSelectedCategory(uncategorizedCategoryId)}>
              Uncategorized
            </button>
          </li>
          {rows.map(({ category, depth }) => (
            <CategoryRow key={category.id} category={category} depth={depth} label={paths.get(category.id) ?? category.name}
                         selected={selectedCategoryId === category.id} disabled={!isEditMode}
                         dropZone={target?.rowId === category.id ? target.zone : undefined}
                         onSelect={setSelectedCategory} />
          ))}
        </ul>
        {/* The sidebar's backdrop-filter would capture a fixed overlay, so it renders on body. */}
        {createPortal(
          <DragOverlay dropAnimation={null} modifiers={[restrictToVerticalAxis]}>
            {dragged && <div className={styles.overlay}><div className={styles.option}>{dragged.name}</div></div>}
          </DragOverlay>,
          document.body,
        )}
      </DndContext>
    </nav>
  )
}

export { CategoriesList }
