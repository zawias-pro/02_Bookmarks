/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  const favicon = bookmarks.fields.getById("field_favicon");
  favicon.type = "file";
  favicon.mimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/x-icon"];
  favicon.thumbs = [];
  favicon.maxSelect = 1;
  favicon.maxSize = 5242880;
  favicon.protected = false;
  delete favicon.min;
  delete favicon.max;
  delete favicon.pattern;
  return app.save(bookmarks);
}, (app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  const favicon = bookmarks.fields.getById("field_favicon");
  favicon.type = "text";
  favicon.min = null;
  favicon.max = 5000;
  favicon.pattern = "";
  delete favicon.mimeTypes;
  delete favicon.thumbs;
  delete favicon.maxSelect;
  delete favicon.maxSize;
  delete favicon.protected;
  return app.save(bookmarks);
});
