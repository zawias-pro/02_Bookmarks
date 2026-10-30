/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  bookmarks.fields.add(new SelectField({
    id: "field_icon_source",
    name: "iconSource",
    required: false,
    maxSelect: 1,
    values: ["auto", "custom"],
  }));

  return app.save(bookmarks);
}, (app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  bookmarks.fields.removeByName("iconSource");
  return app.save(bookmarks);
});
