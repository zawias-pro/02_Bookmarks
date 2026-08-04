import type { RecordModel } from 'pocketbase';
import { db } from './database';
import { pb } from './pocketbase';
import type { LocalBookmark } from '../types/bookmark';

type RemoteBookmark = RecordModel & Pick<LocalBookmark, 'title' | 'link' | 'favicon' | 'order'>;

const pushBookmarks = async () => {
  if (!pb.authStore.isValid || !pb.authStore.record) {
    throw new Error('Sign in to PocketBase before pushing.');
  }

  const localBookmarks = await db.bookmarks.toArray();
  const remoteBookmarks = await pb.collection<RemoteBookmark>('bookmarks').getFullList({
    filter: `user = "${pb.authStore.record.id}"`,
  });
  for (const bookmark of remoteBookmarks) {
    await pb.collection<RemoteBookmark>('bookmarks').delete(bookmark.id);
  }

  for (const bookmark of localBookmarks) {
    const data = {
      title: bookmark.title,
      link: bookmark.link,
      favicon: bookmark.favicon,
      order: bookmark.order,
      user: pb.authStore.record.id,
    };

    const remote = await pb.collection<RemoteBookmark>('bookmarks').create(data);

    await db.bookmarks.update(bookmark.id, { remoteId: remote.id, updatedAt: remote.updated });
  }

  return localBookmarks.length;
};

const pullBookmarks = async () => {
  if (!pb.authStore.isValid || !pb.authStore.record) {
    throw new Error('Sign in to PocketBase before pulling.');
  }

  const remoteBookmarks = await pb.collection<RemoteBookmark>('bookmarks').getFullList({
    filter: `user = "${pb.authStore.record.id}"`,
    sort: 'order',
  });
  await db.transaction('rw', db.bookmarks, async () => {
    await db.bookmarks.clear();
    await db.bookmarks.bulkAdd(remoteBookmarks.map((bookmark) => ({
      id: bookmark.id,
      remoteId: bookmark.id,
      title: bookmark.title,
      link: bookmark.link,
      favicon: bookmark.favicon,
      order: bookmark.order,
      updatedAt: bookmark.updated,
    })));
  });

  return remoteBookmarks.length;
};

export { pullBookmarks, pushBookmarks };
