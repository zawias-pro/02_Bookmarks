import assert from 'node:assert/strict'
import test from 'node:test'
import { faviconRejected } from './rejected.ts'

const refusal = (code: string, field = 'favicon') => ({
  status: 400,
  message: 'Failed to create record.',
  data: { data: { [field]: { code, message: 'Failed to create record.' } } },
})

test('an icon the server refuses by its bytes is recognised', () => {
  assert.equal(faviconRejected(refusal('validation_invalid_mime_type')), true)
})

test('any other failure is not mistaken for a refused icon', () => {
  assert.equal(faviconRejected(refusal('validation_required')), false)
  assert.equal(faviconRejected(refusal('validation_invalid_mime_type', 'title')), false)
  assert.equal(faviconRejected({ status: 500, data: { data: { favicon: { code: 'validation_invalid_mime_type' } } } }), false)
  assert.equal(faviconRejected({ status: 400, data: {} }), false)
  assert.equal(faviconRejected(new Error('offline')), false)
})
