/// <reference path="../pb_data/types.d.ts" />

// Every bookmark belongs to a real category. Older clients shared one hidden category record with a
// fixed id between all accounts, and kept bookmarks without any category; both move to a per-user
// "Unnamed" category so the relation can be required.
migrate((app) => {
  const users = app.findAllRecords('users');
  const allCategories = app.findAllRecords('categories');

  const uncategorized = allCategories.filter((category) => category.getString('name') === '_uncategorized');
  const uncategorizedIds = uncategorized.map((category) => category.id);

  for (const user of users) {
    const bookmarks = app.findRecordsByFilter('bookmarks', 'user = {:user}', '', 0, 0, { user: user.id });
    const needsCategory = bookmarks.filter((bookmark) => {
      const category = bookmark.getString('category');
      return !category || uncategorizedIds.includes(category);
    });
    if (needsCategory.length === 0) continue;
    const owned = allCategories.filter((category) => category.getString('user') === user.id);
    let target = owned.find((category) => category.getString('name') === 'Unnamed');
    if (!target) {
      const topLevel = owned.filter((category) => !category.getString('parent'));
      target = new Record(app.findCollectionByNameOrId('categories'));
      target.set('name', 'Unnamed');
      target.set('user', user.id);
      target.set('order', topLevel.reduce((last, category) => Math.max(last, category.getInt('order')), -1) + 1);
      app.save(target);
    }
    for (const bookmark of needsCategory) {
      bookmark.set('category', target.id);
      app.save(bookmark);
    }
  }

  // The hidden records are gone; a sub-category that was nested under one becomes top-level.
  for (const category of uncategorized) {
    for (const child of allCategories.filter((item) => item.getString('parent') === category.id)) {
      child.set('parent', '');
      app.save(child);
    }
    app.delete(category);
  }

  const bookmarks = app.findCollectionByNameOrId('bookmarks');
  bookmarks.fields.getByName('category').required = true;
  return app.save(bookmarks);
}, (app) => {
  const bookmarks = app.findCollectionByNameOrId('bookmarks');
  bookmarks.fields.getByName('category').required = false;
  return app.save(bookmarks);
});
