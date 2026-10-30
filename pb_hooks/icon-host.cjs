// The icon proxy must not become a door into the server's own network, so it only fetches public hosts.
// Loaded with require() from inside the route handler: PocketBase runs handlers in isolated scopes.
const isPrivateHost = (host) => {
  if (host.charAt(0) === '[') return true;
  if (host === 'localhost' || host.indexOf('.') === -1) return true;
  if (/\.(local|internal|home\.arpa)$/.test(host)) return true;
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4) return false;
  const first = Number(ipv4[1]);
  const second = Number(ipv4[2]);
  return first === 10 || first === 127 || first === 0
    || (first === 192 && second === 168)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 169 && second === 254);
};

module.exports = { isPrivateHost };
