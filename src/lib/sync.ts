import type { RecordModel } from 'pocketbase';
import { db } from './database';
import { pb } from './pocketbase';
import type { LocalBookmark, LocalCategory } from '../types/bookmark';

type RemoteCategory = RecordModel & Pick<LocalCategory, 'name'>;
type RemoteBookmark = RecordModel & Pick<LocalBookmark, 'title' | 'link' | 'favicon' | 'order'> & { categories?: string[] };

const pushBookmarks = async () => {
  if (!pb.authStore.isValid || !pb.authStore.record) {
    throw new Error('Sign in to PocketBase before pushing.');
  }

  const localBookmarks = await db.bookmarks.toArray();
  const localCategories = await db.categories.toArray();
  const remoteCategories = await pb.collection<RemoteCategory>('categories').getFullList({
    filter: `user = "${pb.authStore.record.id}"`,
  });
  const remoteBookmarks = await pb.collection<RemoteBookmark>('bookmarks').getFullList({
    filter: `user = "${pb.authStore.record.id}"`,
  });
  for (const bookmark of remoteBookmarks) {
    await pb.collection<RemoteBookmark>('bookmarks').delete(bookmark.id);
  }

  for (const category of remoteCategories) {
    await pb.collection<RemoteCategory>('categories').delete(category.id);
  }

  const categoryIds = new Map<string, string>();
  for (const category of localCategories) {
    const remote = await pb.collection<RemoteCategory>('categories').create({
      name: category.name,
      user: pb.authStore.record.id,
    });
    categoryIds.set(category.id, remote.id);
  }

  for (const bookmark of localBookmarks) {
    const data = {
      title: bookmark.title,
      link: bookmark.link,
      favicon: bookmark.favicon,
      order: bookmark.order,
      categories: bookmark.categoryIds?.flatMap((categoryId) => {
        const remoteId = categoryIds.get(categoryId);
        return remoteId ? [remoteId] : [];
      }),
      user: pb.authStore.record.id,
    };

    const remote = await pb.collection<RemoteBookmark>('bookmarks').create(data);

    await db.bookmarks.update(bookmark.id, { remoteId: remote.id, updatedAt: remote.updated });
  }

  return { bookmarks: localBookmarks.length, categories: localCategories.length };
};

const pullBookmarks = async () => {
  if (!pb.authStore.isValid || !pb.authStore.record) {
    throw new Error('Sign in to PocketBase before pulling.');
  }

  const remoteBookmarks = await pb.collection<RemoteBookmark>('bookmarks').getFullList({
    filter: `user = "${pb.authStore.record.id}"`,
    sort: 'order',
  });
  const remoteCategories = await pb.collection<RemoteCategory>('categories').getFullList({
    filter: `user = "${pb.authStore.record.id}"`,
    sort: 'name',
  });
  await db.transaction('rw', db.bookmarks, db.categories, async () => {
    await db.categories.clear();
    await db.bookmarks.clear();
    await db.categories.bulkAdd(remoteCategories.map((category) => ({
      id: category.id,
      name: category.name,
      createdAt: category.created,
    })));
    await db.bookmarks.bulkAdd(remoteBookmarks.map((bookmark) => ({
      id: bookmark.id,
      remoteId: bookmark.id,
      title: bookmark.title,
      link: bookmark.link,
      favicon: bookmark.favicon,
      order: bookmark.order,
      categoryIds: bookmark.categories,
      updatedAt: bookmark.updated,
    })));
  });

  return { bookmarks: remoteBookmarks.length, categories: remoteCategories.length };
};

export { pullBookmarks, pushBookmarks };
