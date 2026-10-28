/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const tags = app.findCollectionByNameOrId("tags");
  tags.fields.add(new JSONField({
    id: "field_tag_positions",
    name: "positions",
    required: false,
    maxSize: 0,
  }));
  return app.save(tags);
}, (app) => {
  const tags = app.findCollectionByNameOrId("tags");
  tags.fields.removeByName("positions");
  return app.save(tags);
});
