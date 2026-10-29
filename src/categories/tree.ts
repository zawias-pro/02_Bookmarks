import type { LocalCategory } from '../model/model.ts'

const maxCategoryDepth = 3

type CategoryRow = { category: LocalCategory; depth: number }
type CategoryMove = { id: string; parentId: string | null; order: number }

const sortCategories = (categories: LocalCategory[]) =>
  [...categories].sort((left, right) => left.order - right.order || left.name.localeCompare(right.name))

// Flat render order of the tree, so a row carries its indent and the list stays one element.
const categoryRows = (categories: LocalCategory[]): CategoryRow[] => {
  const rows: CategoryRow[] = []
  const seen = new Set<string>()
  const visit = (parentId: string | null, depth: number) => {
    for (const category of sortCategories(categories.filter((item) => item.parentId === parentId))) {
      if (seen.has(category.id)) continue
      seen.add(category.id)
      rows.push({ category, depth })
      if (depth < maxCategoryDepth) visit(category.id, depth + 1)
    }
  }
  visit(null, 1)
  // A category whose parent is gone, or one caught in a parent cycle, still has to be reachable.
  for (const category of sortCategories(categories)) {
    if (seen.has(category.id)) continue
    seen.add(category.id)
    rows.push({ category, depth: 1 })
    visit(category.id, 2)
  }
  return rows
}

const categorySiblings = (categories: LocalCategory[], parentId: string | null, excludedId?: string) =>
  sortCategories(categories.filter((category) => category.parentId === parentId && category.id !== excludedId))

// A "Parent / Child" label for places where the tree cannot be shown as nesting.
const categoryPaths = (categories: LocalCategory[]) => {
  const paths = new Map<string, string>()
  const stack: string[] = []
  for (const { category, depth } of categoryRows(categories)) {
    stack.length = depth - 1
    stack.push(category.name)
    paths.set(category.id, stack.join(' / '))
  }
  return paths
}

const descendantsOf = (categories: LocalCategory[], id: string) => {
  const children = new Map<string, string[]>()
  for (const category of categories) {
    if (category.parentId === null) continue
    children.set(category.parentId, [...(children.get(category.parentId) ?? []), category.id])
  }
  const descendants = new Set<string>()
  const pending = [id]
  while (pending.length > 0) {
    for (const child of children.get(pending.pop()!) ?? []) {
      if (descendants.has(child)) continue
      descendants.add(child)
      pending.push(child)
    }
  }
  return descendants
}

const depthOf = (categories: LocalCategory[], id: string) => {
  const byId = new Map(categories.map((category) => [category.id, category]))
  const seen = new Set([id])
  let depth = 1
  let parentId = byId.get(id)?.parentId ?? null
  while (parentId !== null && !seen.has(parentId)) {
    seen.add(parentId)
    depth += 1
    parentId = byId.get(parentId)?.parentId ?? null
  }
  return depth
}

const subtreeHeight = (categories: LocalCategory[], id: string) => {
  const base = depthOf(categories, id)
  return Math.max(...[id, ...descendantsOf(categories, id)].map((item) => depthOf(categories, item) - base + 1))
}

const canMoveCategory = (categories: LocalCategory[], movingId: string, parentId: string | null) => {
  if (parentId === null) return true
  if (parentId === movingId || !categories.some((category) => category.id === parentId)) return false
  if (descendantsOf(categories, movingId).has(parentId)) return false
  return depthOf(categories, parentId) + subtreeHeight(categories, movingId) <= maxCategoryDepth
}

const planCategoryMove = (categories: LocalCategory[], movingId: string, parentId: string | null, index: number): CategoryMove[] => {
  const moving = categories.find((category) => category.id === movingId)
  if (!moving) throw new Error('Cannot move a category that does not exist.')
  if (!canMoveCategory(categories, movingId, parentId)) throw new Error(`A category cannot be nested ${maxCategoryDepth} levels deep or into itself.`)
  if (!Number.isInteger(index) || index < 0) throw new Error('Category position must be a non-negative integer.')
  const target = categorySiblings(categories, parentId, movingId)
  if (index > target.length) throw new Error('Category position is out of range.')
  const moves: CategoryMove[] = []
  const place = (category: LocalCategory, order: number, nextParentId: string | null) => {
    if (category.parentId === nextParentId && category.order === order) return
    moves.push({ id: category.id, parentId: nextParentId, order })
  }
  // shortcut: every shifted sibling is rewritten, one sync update each; fine for tens of categories, use fractional orders past a few hundred.
  [...target.slice(0, index), moving, ...target.slice(index)].forEach((category, order) => place(category, order, parentId))
  if (moving.parentId !== parentId) categorySiblings(categories, moving.parentId, movingId).forEach((category, order) => place(category, order, moving.parentId))
  return moves
}

// Deleting a category moves its children into its own place, after its remaining siblings.
const planCategoryDelete = (categories: LocalCategory[], id: string): CategoryMove[] => {
  const deleted = categories.find((category) => category.id === id)
  if (!deleted) throw new Error('Cannot delete a category that does not exist.')
  const moves: CategoryMove[] = []
  let order = categorySiblings(categories, deleted.parentId, id).reduce((last, category) => Math.max(last, category.order), -1) + 1
  for (const child of categorySiblings(categories, id)) {
    moves.push({ id: child.id, parentId: deleted.parentId, order })
    order += 1
  }
  return moves
}

export { canMoveCategory, categoryPaths, categoryRows, categorySiblings, descendantsOf, planCategoryDelete, planCategoryMove }
