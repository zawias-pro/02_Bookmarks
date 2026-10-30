/// <reference path="../pb_data/types.d.ts" />

// The browser cannot read cross-origin icon bytes, so icons are fetched here and streamed back.
// The route requires a session: otherwise it would be an open proxy into the server's network.
// Helpers must live inside the handler: PocketBase runs every handler in its own isolated scope.
// shortcut: $http.send follows redirects, so a public URL that redirects to a private address is
// not caught; close it if the instance ever allows public signup.
routerAdd('GET', '/api/bookmarks/icon-proxy', (e) => {
  const { isPrivateHost } = require(`${__hooks}/icon-host.cjs`);

  const target = e.request.url.query().get('url') || '';
  const match = /^(https?):\/\/([^/?#]+)/i.exec(target);
  if (!match) throw new BadRequestError('The icon URL must be an absolute http(s) URL.');
  const host = match[2].replace(/^.*@/, '').replace(/:\d+$/, '').toLowerCase();
  if (isPrivateHost(host)) throw new BadRequestError('The icon URL must point at a public host.');

  let response;
  try {
    response = $http.send({ url: target, timeout: 5, headers: { 'user-agent': '02-bookmarks-icon-proxy' } });
  } catch (error) {
    e.app.logger().warn('icon proxy request failed', 'url', target, 'error', error);
    throw new BadRequestError('Could not read the icon.');
  }
  if (response.statusCode < 200 || response.statusCode > 299) throw new BadRequestError('Could not read the icon.');

  const contentType = (response.headers['Content-Type'] || ['application/octet-stream'])[0];
  if (contentType.indexOf('image/') !== 0 && contentType.indexOf('text/html') !== 0) {
    throw new BadRequestError('The URL did not return an image.');
  }
  return e.blob(200, contentType, response.body);
}, $apis.requireAuth());
