/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  const favicon = bookmarks.fields.getById("field_favicon");
  favicon.max = null;
  return app.save(bookmarks);
}, (app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  const favicon = bookmarks.fields.getById("field_favicon");
  favicon.max = 500;
  return app.save(bookmarks);
});
