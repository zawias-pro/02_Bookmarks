/// <reference path="../pb_data/types.d.ts" />

// The browser cannot read cross-origin icon bytes, so icons are fetched here and streamed back.
// The route requires a session: otherwise it would be an open proxy into the server's network.
// shortcut: $http.send follows redirects, so a public URL that redirects to a private address is
// not caught; close it if the instance ever allows public signup.
routerAdd('GET', '/api/bookmarks/icon-proxy', (e) => {
  const { fetchBody, iconHost } = require(`${__hooks}/icon-fetch.cjs`);
  const { isPrivateHost } = require(`${__hooks}/icon-host.cjs`);

  const target = e.request.url.query().get('url') || '';
  const host = iconHost(target);
  if (!host) throw new BadRequestError('The icon URL must be an absolute http(s) URL.');
  if (isPrivateHost(host)) throw new BadRequestError('The icon URL must point at a public host.');

  const icon = fetchBody(target, 5);
  if (!icon) throw new BadRequestError('Could not read the icon.');

  if (icon.contentType.indexOf('image/') !== 0 && icon.contentType.indexOf('text/html') !== 0) {
    throw new BadRequestError('The URL did not return an image.');
  }
  return e.blob(200, icon.contentType, icon.body);
}, $apis.requireAuth());
