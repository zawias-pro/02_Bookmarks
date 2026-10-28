import type { LocalBookmark } from '../../model/model.ts'

const layoutBookmarks = (bookmarks: LocalBookmark[], positions: Record<string, number>) => {
  const ordered = [...bookmarks].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
  const bySlot = new Map<number, LocalBookmark>()
  const unplaced: LocalBookmark[] = []
  for (const bookmark of ordered) {
    const slot = positions[bookmark.id]
    if (!Number.isInteger(slot) || slot < 1 || bySlot.has(slot)) unplaced.push(bookmark)
    else bySlot.set(slot, bookmark)
  }
  let maxSlot = bySlot.size === 0 ? 0 : Math.max(...bySlot.keys())
  for (const bookmark of unplaced) {
    maxSlot += 1
    bySlot.set(maxSlot, bookmark)
  }
  return { bySlot, maxSlot }
}

export { layoutBookmarks }
