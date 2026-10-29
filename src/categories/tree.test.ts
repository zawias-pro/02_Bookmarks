import assert from 'node:assert/strict'
import test from 'node:test'
import type { LocalCategory } from '../model/model.ts'
import { canMoveCategory, categoryRows, planCategoryDelete, planCategoryMove } from './tree.ts'

const category = (id: string, parentId: string | null, order: number): LocalCategory => ({
  id,
  name: id,
  parentId,
  order,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const layout = (categories: LocalCategory[]) => categoryRows(categories).map(({ category, depth }) => `${depth}:${category.id}`)

test('rows follow parent order, then child order', () => {
  const categories = [category('b', null, 1), category('a', null, 0), category('a1', 'a', 1), category('a0', 'a', 0)]
  assert.deepEqual(layout(categories), ['1:a', '2:a0', '2:a1', '1:b'])
})

test('a category with a missing parent stays reachable at the top', () => {
  assert.deepEqual(layout([category('orphan', 'gone', 0)]), ['1:orphan'])
})

test('a parent cycle does not hide its categories', () => {
  assert.deepEqual(layout([category('left', 'right', 0), category('right', 'left', 0)]).length, 2)
})

test('nesting past three levels is refused', () => {
  const categories = [category('top', null, 0), category('mid', 'top', 0), category('low', 'mid', 0)]
  assert.equal(canMoveCategory(categories, 'top', 'low'), false)
  assert.throws(() => planCategoryMove(categories, 'top', 'low', 0))
})

test('a category cannot be nested into itself or its own subtree', () => {
  const categories = [category('top', null, 0), category('mid', 'top', 0)]
  assert.equal(canMoveCategory(categories, 'top', 'top'), false)
  assert.equal(canMoveCategory(categories, 'top', 'mid'), false)
})

test('a branch that already holds grandchildren cannot go deeper', () => {
  const categories = [category('top', null, 0), category('mid', 'top', 0), category('low', 'mid', 0), category('other', null, 1)]
  assert.equal(canMoveCategory(categories, 'top', 'other'), false)
  assert.equal(canMoveCategory(categories, 'other', 'top'), true)
})

test('moving inside the same parent renumbers only the shifted siblings', () => {
  const categories = [category('a', null, 0), category('b', null, 1), category('c', null, 2)]
  assert.deepEqual(planCategoryMove(categories, 'c', null, 0), [
    { id: 'c', parentId: null, order: 0 },
    { id: 'a', parentId: null, order: 1 },
    { id: 'b', parentId: null, order: 2 },
  ])
})

test('moving a category that is already in place plans nothing', () => {
  assert.deepEqual(planCategoryMove([category('a', null, 0), category('b', null, 1)], 'a', null, 0), [])
})

test('moving to another parent renumbers both sibling lists', () => {
  const categories = [category('root', null, 0), category('a', null, 1), category('b', null, 2), category('child', 'root', 0)]
  assert.deepEqual(planCategoryMove(categories, 'a', 'root', 0), [
    { id: 'a', parentId: 'root', order: 0 },
    { id: 'child', parentId: 'root', order: 1 },
    { id: 'b', parentId: null, order: 1 },
  ])
})

test('a move that changes nothing plans nothing', () => {
  assert.deepEqual(planCategoryMove([category('a', null, 0), category('b', null, 1)], 'b', null, 1), [])
})

test('an out of range position is refused', () => {
  assert.throws(() => planCategoryMove([category('a', null, 0)], 'a', null, 2))
})

test('deleting a category moves its children after its remaining siblings', () => {
  const categories = [category('a', null, 0), category('x', null, 1), category('x1', 'x', 0), category('x2', 'x', 1)]
  assert.deepEqual(planCategoryDelete(categories, 'x'), [
    { id: 'x1', parentId: null, order: 1 },
    { id: 'x2', parentId: null, order: 2 },
  ])
})

test('deleting a nested category keeps its subtree and moves it up one level', () => {
  const categories = [category('root', null, 0), category('mid', 'root', 0), category('leaf', 'mid', 0)]
  assert.deepEqual(planCategoryDelete(categories, 'mid'), [{ id: 'leaf', parentId: 'root', order: 0 }])
})

test('deleting a category without children plans nothing', () => {
  assert.deepEqual(planCategoryDelete([category('a', null, 0)], 'a'), [])
})
