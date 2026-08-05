/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks")
  const categories = bookmarks.fields.getById("field_categories")
  categories.maxSelect = 1
  return app.save(bookmarks)
}, (app) => {
  const bookmarks = app.findCollectionByNameOrId("bookmarks")
  const categories = bookmarks.fields.getById("field_categories")
  categories.maxSelect = 99
  return app.save(bookmarks)
})
