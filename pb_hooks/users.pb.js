/// <reference path="../pb_data/types.d.ts" />

// Every account starts with one real category, so every bookmark has a category to live in.
// The name is the one src/model/model.ts expects; keep the two in step.
onRecordAfterCreateSuccess((e) => {
  try {
    const categories = e.app.findCollectionByNameOrId('categories');
    const category = new Record(categories);
    category.set('name', 'Unnamed');
    category.set('user', e.record.id);
    category.set('order', 0);
    e.app.save(category);
  } catch (error) {
    // A category can be added from the app, so a failure here is reported rather than failing signup.
    e.app.logger().error('could not create the default category', 'user', e.record.id, 'error', error);
  }
  e.next();
}, 'users');
