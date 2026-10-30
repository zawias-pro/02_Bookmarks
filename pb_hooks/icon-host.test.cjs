const assert = require('node:assert/strict');
const test = require('node:test');
const { isPrivateHost } = require('./icon-host.cjs');

test('public hosts pass', () => {
  for (const host of ['github.com', 'vpn.example.com', '193.0.1.1']) assert.equal(isPrivateHost(host), false, host);
});

test('loopback, private and mesh ranges are refused', () => {
  for (const host of ['127.0.0.1', '10.250.0.102', '192.168.1.5', '172.16.0.1', '172.31.255.255', '169.254.1.1', '0.0.0.0']) {
    assert.equal(isPrivateHost(host), true, host);
  }
});

test('local names and literals without a dot are refused', () => {
  for (const host of ['localhost', 'router', 'nas.local', 'db.internal', 'x.home.arpa', '::1', '[fd00::1]']) {
    assert.equal(isPrivateHost(host), true, host);
  }
});
