/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const categories = app.findCollectionByNameOrId("categories");
  categories.fields.add(new RelationField({
    id: "field_category_parent",
    name: "parent",
    collectionId: categories.id,
    cascadeDelete: false,
    maxSelect: 1,
    required: false,
  }));
  categories.fields.add(new NumberField({
    id: "field_category_order",
    name: "order",
    required: false,
    min: 0,
  }));
  app.save(categories);

  // Existing categories keep the name order the sidebar showed until someone reorders them.
  app.findAllRecords("categories")
    .sort((left, right) => left.getString("name").localeCompare(right.getString("name")))
    .forEach((category, index) => {
      category.set("order", index);
      app.save(category);
    });
}, (app) => {
  const categories = app.findCollectionByNameOrId("categories");
  categories.fields.removeByName("parent");
  categories.fields.removeByName("order");
  return app.save(categories);
});
