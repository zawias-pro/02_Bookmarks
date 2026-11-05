/// <reference path="../pb_data/types.d.ts" />

// Candidate icons are probed here, in order, so a bookmark costs one request instead of one per path.
// The session requirement matches the icon proxy: an open route would be a door into the server's network.
routerAdd('POST', '/api/bookmarks/icon-probe', (e) => {
  const { fetchBody, iconHost } = require(`${__hooks}/icon-fetch.cjs`);
  const { isPrivateHost } = require(`${__hooks}/icon-host.cjs`);

  const requested = e.requestInfo().body.urls;
  if (!Array.isArray(requested) || requested.length === 0) throw new BadRequestError('At least one icon URL is required.');

  // Each fetch gets only what is left of the budget, so the route answers inside the 15s the client waits.
  const deadline = Date.now() + 11000;
  for (const target of requested.slice(0, 16)) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    const url = String(target);
    const host = iconHost(url);
    if (!host || isPrivateHost(host)) continue;

    const icon = fetchBody(url, Math.min(4, Math.ceil(remaining / 1000)));
    if (!icon || icon.contentType.indexOf('image/') !== 0) continue;
    // An error page served under an image content type is not an icon; an svg legitimately starts with '<'.
    if (icon.contentType.indexOf('svg') === -1 && icon.body[0] === 0x3c) continue;

    return e.blob(200, icon.contentType, icon.body);
  }
  throw new NotFoundError('No icon was found.');
}, $apis.requireAuth());
