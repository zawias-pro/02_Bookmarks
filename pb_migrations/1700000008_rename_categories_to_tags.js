/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const tags = app.findCollectionByNameOrId("categories");
  tags.name = "tags";
  app.save(tags);

  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  bookmarks.fields.add(new RelationField({
    "id": "field_tags",
    "name": "tags",
    "collectionId": "categories_coll_01",
    "cascadeDelete": false,
    "maxSelect": 99,
    "required": false
  }));
  app.save(bookmarks);

  for (const bookmark of app.findAllRecords("bookmarks")) {
    const category = bookmark.get("categories");
    let tagIds = [];
    if (Array.isArray(category)) tagIds = category;
    else if (category) tagIds = [category];
    bookmark.set("tags", tagIds);
    app.save(bookmark);
  }

  bookmarks.fields.removeByName("categories");
  return app.save(bookmarks);
}, (app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  bookmarks.fields.add(new RelationField({
    "id": "field_categories",
    "name": "categories",
    "collectionId": "categories_coll_01",
    "cascadeDelete": false,
    "maxSelect": 1,
    "required": false
  }));
  app.save(bookmarks);

  for (const bookmark of app.findAllRecords("bookmarks")) {
    const tags = bookmark.get("tags");
    let tagIds = [];
    if (Array.isArray(tags)) tagIds = tags;
    else if (tags) tagIds = [tags];
    bookmark.set("categories", tagIds[0] ?? "");
    app.save(bookmark);
  }

  bookmarks.fields.removeByName("tags");
  app.save(bookmarks);

  const tags = app.findCollectionByNameOrId("tags");
  tags.name = "categories";
  return app.save(tags);
});
