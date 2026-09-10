/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  bookmarks.fields.removeByName("favicon");
  app.save(bookmarks);
  bookmarks.fields.add(new FileField({
    id: "field_favicon_file",
    name: "favicon",
    mimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml", "image/x-icon"],
    maxSelect: 1,
    maxSize: 5242880,
    protected: false,
  }));
  return app.save(bookmarks);
});
