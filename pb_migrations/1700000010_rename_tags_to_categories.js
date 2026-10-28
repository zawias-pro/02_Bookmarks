/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const categories = app.findCollectionByNameOrId("tags");
  categories.name = "categories";
  app.save(categories);

  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  bookmarks.fields.add(new RelationField({
    "id": "field_category",
    "name": "category",
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
    bookmark.set("category", tagIds[0] ?? "");
    app.save(bookmark);
  }

  bookmarks.fields.removeByName("tags");
  app.save(bookmarks);

  for (const category of app.findAllRecords("categories")) {
    if (category.get("name") !== "_untagged") continue;
    category.set("name", "_uncategorized");
    app.save(category);
  }
}, (app) => {
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
    const category = bookmark.get("category");
    bookmark.set("tags", category ? [category] : []);
    app.save(bookmark);
  }

  bookmarks.fields.removeByName("category");
  app.save(bookmarks);

  for (const category of app.findAllRecords("categories")) {
    if (category.get("name") !== "_uncategorized") continue;
    category.set("name", "_untagged");
    app.save(category);
  }

  const categories = app.findCollectionByNameOrId("categories");
  categories.name = "tags";
  return app.save(categories);
});
