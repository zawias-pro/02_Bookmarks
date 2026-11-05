// Shared by the icon routes. PocketBase runs every handler in its own scope, so helpers live in modules.

// Returns the request host, or '' when the target is not an absolute http(s) URL.
const iconHost = (target) => {
  const match = /^(https?):\/\/([^/?#]+)/i.exec(target);
  if (!match) return '';
  return match[2].replace(/^.*@/, '').replace(/:\d+$/, '').toLowerCase();
};

// The largest body a route copies back. A page is read for its <head> only, and an icon this large
// is not an icon; bounding the copy keeps one bookmark from filling the server's memory.
const maxBodyBytes = 2 * 1024 * 1024;

// Fetches a public URL and returns its content type and bytes, or undefined when it cannot be read.
const fetchBody = (target, timeout) => {
  let response;
  try {
    response = $http.send({ url: target, timeout, headers: { 'user-agent': '02-bookmarks-icon-proxy' } });
  } catch {
    return undefined;
  }
  if (response.statusCode < 200 || response.statusCode > 299) return undefined;
  return {
    contentType: (response.headers['Content-Type'] || ['application/octet-stream'])[0],
    body: response.body.slice(0, maxBodyBytes),
  };
};

module.exports = { fetchBody, iconHost };
