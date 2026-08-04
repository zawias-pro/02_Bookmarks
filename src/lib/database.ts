import Dexie, { type Table } from 'dexie';
import type { LocalBookmark, LocalProfile } from '../types/bookmark';

class BookmarksDatabase extends Dexie {
  bookmarks!: Table<LocalBookmark, string>;
  profiles!: Table<LocalProfile, string>;

  constructor() {
    super('bookmarks-offline');
    this.version(1).stores({
      bookmarks: 'id, remoteId, updatedAt, order',
      profiles: 'id',
    });
  }
}

const db = new BookmarksDatabase();

const createId = () => crypto.randomUUID();

const seedBookmarks = async () => {
  if (await db.bookmarks.count() > 0) {
    return;
  }

  const now = new Date().toISOString();
  await db.bookmarks.bulkAdd([
    { id: createId(), title: 'PocketBase Documentation', link: 'https://pocketbase.io/docs', order: 1, updatedAt: now },
    { id: createId(), title: 'React Documentation', link: 'https://react.dev', order: 2, updatedAt: now },
    { id: createId(), title: 'Vite Guide', link: 'https://vitejs.dev', order: 3, updatedAt: now },
  ]);
};

export { createId, db, seedBookmarks };
