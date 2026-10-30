/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = new Collection({
    "id": "icons_coll_01",
    "name": "icons",
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
        "id": "field_icon_name",
        "name": "name",
        "type": "text",
        "required": true,
        "presentable": true,
        "unique": false
      },
      {
        "system": false,
        "id": "field_icon_image",
        "name": "image",
        "type": "file",
        "required": true,
        "presentable": false,
        "unique": false,
        "maxSelect": 1,
        "maxSize": 5242880,
        "mimeTypes": [
          "image/jpeg",
          "image/png",
          "image/gif",
          "image/webp",
          "image/svg+xml",
          "image/x-icon"
        ],
        "thumbs": [],
        "protected": false
      },
      {
        "system": false,
        "id": "field_icon_user",
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
      "CREATE INDEX idx_icon_user_name ON icons (user, name)"
    ],
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    "createRule": "@request.auth.id != '' && user = @request.auth.id",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id"
  });

  return app.save(collection);
}, (app) => {
  return app.delete(app.findCollectionByNameOrId("icons"));
});
