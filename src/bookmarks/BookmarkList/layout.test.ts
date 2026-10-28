import assert from 'node:assert/strict'
import test from 'node:test'
import type { LocalBookmark } from '../../model/model.ts'
import { layoutBookmarks } from './layout.ts'

const bookmark = (id: string, order: number): LocalBookmark => ({
  id,
  title: id,
  link: 'https://example.com',
  order,
  categoryId: null,
  updatedAt: '2026-01-01T00:00:00.000Z',
})

const slots = (bySlot: Map<number, LocalBookmark>) =>
  Object.fromEntries([...bySlot].map(([slot, item]) => [slot, item.id]))

test('an empty board has no slots', () => {
  const { bySlot, maxSlot } = layoutBookmarks([], {})
  assert.equal(bySlot.size, 0)
  assert.equal(maxSlot, 0)
})

test('explicit slots win and gaps stay blank', () => {
  const { bySlot, maxSlot } = layoutBookmarks([bookmark('a', 1), bookmark('b', 2)], { a: 3 })
  assert.deepEqual(slots(bySlot), { 3: 'a', 4: 'b' })
  assert.equal(maxSlot, 4)
})

test('a slot collision moves the later bookmark to the next free slot', () => {
  const { bySlot } = layoutBookmarks([bookmark('a', 1), bookmark('b', 2)], { a: 2, b: 2 })
  assert.deepEqual(slots(bySlot), { 2: 'a', 3: 'b' })
})

test('bookmarks without a slot go last, never into a blank', () => {
  const { bySlot, maxSlot } = layoutBookmarks(
    [bookmark('a', 1), bookmark('b', 2), bookmark('c', 3)],
    { a: 5, c: 9 },
  )
  assert.deepEqual(slots(bySlot), { 5: 'a', 9: 'c', 10: 'b' })
  assert.equal(maxSlot, 10)
})

test('slots below one are treated as missing', () => {
  const { bySlot } = layoutBookmarks([bookmark('a', 1)], { a: 0 })
  assert.deepEqual(slots(bySlot), { 1: 'a' })
})
