import assert from 'node:assert/strict'
import test from 'node:test'
import { addSvgNamespace, withSvgNamespace } from './svg.ts'

test('a missing namespace is added to the root svg tag', () => {
  assert.equal(
    addSvgNamespace('<svg viewBox="0 0 32 32"><rect/></svg>'),
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect/></svg>',
  )
  assert.equal(
    addSvgNamespace('<?xml version="1.0"?>\n<svg width="8" height="8"/>'),
    '<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"/>',
  )
})

test('an existing namespace and markup without a root svg are left alone', () => {
  const namespaced = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>'
  assert.equal(addSvgNamespace(namespaced), namespaced)
  const html = '<html><body></body></html>'
  assert.equal(addSvgNamespace(html), html)
})

test('only svg data urls are patched, in both encodings', () => {
  const svg = '<svg viewBox="0 0 1 1"/>'
  const patched = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"/>'
  assert.equal(withSvgNamespace(`data:image/svg+xml,${encodeURIComponent(svg)}`), `data:image/svg+xml,${encodeURIComponent(patched)}`)
  assert.equal(withSvgNamespace(`data:image/svg+xml;base64,${btoa(svg)}`), `data:image/svg+xml;base64,${btoa(patched)}`)
  const png = 'data:image/png;base64,iVBORw0KGgo='
  assert.equal(withSvgNamespace(png), png)
})

test('a well formed svg keeps its exact data url', () => {
  const dataUrl = `data:image/svg+xml;base64,${btoa('<svg xmlns="http://www.w3.org/2000/svg"/>')}`
  assert.equal(withSvgNamespace(dataUrl), dataUrl)
})
