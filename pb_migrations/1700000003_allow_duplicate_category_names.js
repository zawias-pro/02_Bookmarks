/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const categories = app.findCollectionByNameOrId("categories");
  categories.indexes = categories.indexes.filter((index) => index !== "CREATE UNIQUE INDEX idx_category_user_name ON categories (user, name)");
  return app.save(categories);
}, (app) => {
  const categories = app.findCollectionByNameOrId("categories");
  categories.indexes.push("CREATE UNIQUE INDEX idx_category_user_name ON categories (user, name)");
  return app.save(categories);
});
