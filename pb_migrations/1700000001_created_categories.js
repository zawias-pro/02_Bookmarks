/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const categories = new Collection({
    "id": "categories_coll_01",
    "name": "categories",
    "type": "base",
    "system": false,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text321495293",
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "system": false,
        "id": "field_category_name",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false
      },
      {
        "system": false,
        "id": "field_category_user",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "collectionId": "_pb_users_auth_",
        "cascadeDelete": true,
        "maxSelect": 1
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX idx_category_user_name ON categories (user, name)"
    ],
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    "createRule": "@request.auth.id != '' && user = @request.auth.id",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id"
  });

  app.save(categories);

  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  bookmarks.fields.add(new RelationField({
    "id": "field_categories",
    "name": "categories",
    "collectionId": "categories_coll_01",
    "cascadeDelete": false,
    "maxSelect": 99,
    "required": false
  }));

  return app.save(bookmarks);
}, (app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks");
  bookmarks.fields.removeById("field_categories");
  app.save(bookmarks);
  return app.delete(app.findCollectionByNameOrId("categories"));
});
