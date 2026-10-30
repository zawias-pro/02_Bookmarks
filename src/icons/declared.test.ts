import assert from 'node:assert/strict'
import test from 'node:test'
import { iconCandidates, pickDeclaredIcon } from './declared.ts'

test('candidate icons use the origin of the link', () => {
  assert.deepEqual(iconCandidates('https://vpn.example.com:8443/app/page?x=1'), [
    'https://vpn.example.com:8443/favicon.ico',
    'https://vpn.example.com:8443/favicon.png',
    'https://vpn.example.com:8443/favicon.svg',
    'https://vpn.example.com:8443/apple-touch-icon.png',
    'https://vpn.example.com:8443/apple-touch-icon-precomposed.png',
  ])
})

test('a declared icon is resolved against the page URL', () => {
  const html = '<html><head><link rel="icon" href="/static/icon.png"></head></html>'
  assert.deepEqual(pickDeclaredIcon(html, 'https://vpn.example.com/app/page'), ['https://vpn.example.com/static/icon.png'])
})

test('the largest declared icon wins', () => {
  const html = [
    '<link rel="icon" sizes="16x16" href="/small.png">',
    '<link rel="apple-touch-icon" sizes="180x180" href="/large.png">',
    '<link rel="shortcut icon" href="/plain.ico">',
  ].join('')
  assert.deepEqual(pickDeclaredIcon(html, 'https://example.com/'), [
    'https://example.com/large.png',
    'https://example.com/small.png',
    'https://example.com/plain.ico',
  ])
})

test('an inline data icon is kept as is', () => {
  const html = '<link rel="icon" href="data:image/svg+xml,%3Csvg%3E%3C/svg%3E">'
  assert.deepEqual(pickDeclaredIcon(html, 'https://example.com/'), ['data:image/svg+xml,%3Csvg%3E%3C/svg%3E'])
})

test('non-icon and malformed links are ignored', () => {
  const html = [
    '<link rel="stylesheet" href="/app.css">',
    '<link rel="mask-icon" href="/mask.svg">',
    '<link rel="icon" href="http://[broken">',
    '<link rel="icon" href="/ok.png">',
  ].join('')
  assert.deepEqual(pickDeclaredIcon(html, 'https://example.com/'), ['https://example.com/ok.png'])
})
