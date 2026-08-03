/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "bookmarks_coll_01",
    "name": "bookmarks",
    "type": "base",
    "system": false,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "hidden": false,
        "id": "text321495292",
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
        "id": "field_link",
        "name": "link",
        "type": "url",
        "required": true,
        "presentable": false,
        "unique": false
      },
      {
        "system": false,
        "id": "field_title",
        "name": "title",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false
      },
      {
        "system": false,
        "id": "field_favicon",
        "name": "favicon",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false
      },
      {
        "system": false,
        "id": "field_order",
        "name": "order",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false
      },
      {
        "system": false,
        "id": "field_user",
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
      "CREATE INDEX idx_user_order ON bookmarks (user, order)"
    ],
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    "createRule": "@request.auth.id != '' && user = @request.auth.id",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("bookmarks");
  return app.delete(collection);
});
