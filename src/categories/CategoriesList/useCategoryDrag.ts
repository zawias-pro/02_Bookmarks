import type { LocalCategory } from '../../model/model.ts'
import { usePointerDrag } from '../../components/usePointerDrag.ts'
import { canMoveCategory, categorySiblings } from '../tree.ts'

type DropZone = 'before' | 'inside' | 'after'
type DropTarget = { rowId: string; zone: DropZone; parentId: string | null; index: number }

const rowAt = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-category-row]')

// The third of a row under the pointer decides: above it reorders, the middle nests, below it reorders.
const zoneAt = (row: HTMLElement, y: number): DropZone => {
  const rect = row.getBoundingClientRect()
  const ratio = (y - rect.top) / rect.height
  if (ratio < 0.3) return 'before'
  if (ratio > 0.7) return 'after'
  return 'inside'
}

const useCategoryDrag = (categories: LocalCategory[], onDrop: (categoryId: string, parentId: string | null, index: number) => void) => {
  const byId = new Map(categories.map((category) => [category.id, category]))

  return usePointerDrag<DropTarget, LocalCategory>({
    sameTarget: (left, right) => left.rowId === right.rowId && left.zone === right.zone,
    resolveTarget: (x, y, category) => {
      const row = rowAt(x, y)
      const rowId = row?.dataset.categoryRow
      const target = rowId ? byId.get(rowId) : undefined
      if (!row || !target || target.id === category.id) return null
      const pointerZone = zoneAt(row, y)
      const zone = pointerZone === 'inside' && !canMoveCategory(categories, category.id, target.id) ? 'after' : pointerZone
      const parentId = zone === 'inside' ? target.id : target.parentId
      if (!canMoveCategory(categories, category.id, parentId)) return null
      const siblings = categorySiblings(categories, parentId, category.id)
      const position = siblings.findIndex((item) => item.id === target.id)
      if (zone === 'inside') return { rowId: target.id, zone, parentId, index: 0 }
      return { rowId: target.id, zone, parentId, index: zone === 'after' ? position + 1 : position }
    },
    onDrop: (category, target) => onDrop(category.id, target.parentId, target.index),
  })
}

export { useCategoryDrag }
