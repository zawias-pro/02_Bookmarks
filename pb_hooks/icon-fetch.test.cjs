const assert = require('node:assert/strict');
const test = require('node:test');
const { iconHost } = require('./icon-fetch.cjs');

test('an absolute http url yields its host', () => {
  assert.equal(iconHost('https://cdn.example.com:8443/icon.png'), 'cdn.example.com');
  assert.equal(iconHost('http://example.com'), 'example.com');
  assert.equal(iconHost('https://user:pass@example.com/icon.png'), 'example.com');
  assert.equal(iconHost('https://EXAMPLE.com/icon.png'), 'example.com');
});

test('anything else yields no host', () => {
  for (const target of ['', 'data:image/png;base64,AAAA', '/favicon.ico', 'ftp://example.com/icon.png', 'javascript:alert(1)']) {
    assert.equal(iconHost(target), '', target);
  }
});
