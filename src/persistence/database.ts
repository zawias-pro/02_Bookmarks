import Dexie, { type Table } from 'dexie';
import type { LocalBookmark, LocalCategory, LocalProfile } from '../bookmarks/bookmark.ts';

class BookmarksDatabase extends Dexie {
  bookmarks!: Table<LocalBookmark, string>;
  categories!: Table<LocalCategory, string>;
  profiles!: Table<LocalProfile, string>;

  constructor() {
    super('bookmarks-offline');
    this.version(1).stores({
      bookmarks: 'id, remoteId, updatedAt, order',
      categories: 'id, name, createdAt',
      profiles: 'id',
    });
  }
}

const db = new BookmarksDatabase();

const createId = () => crypto.randomUUID();

export { createId, db };
