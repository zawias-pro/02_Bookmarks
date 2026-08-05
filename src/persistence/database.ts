import Dexie, { type Table } from 'dexie';
import type { LocalBookmark, LocalCategory, LocalProfile } from '../model/model.ts';

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
    this.version(2).stores({
      bookmarks: 'id, remoteId, updatedAt, order',
      categories: 'id, name, createdAt',
      profiles: 'id',
    }).upgrade((transaction) => transaction.table('bookmarks').toCollection().modify((bookmark: LocalBookmark & { categoryIds?: string[] }) => {
      if (!bookmark.categoryId && bookmark.categoryIds?.[0]) bookmark.categoryId = bookmark.categoryIds[0];
      delete bookmark.categoryIds;
    }));
  }
}

const db = new BookmarksDatabase();

const createId = () => crypto.randomUUID();

export { createId, db };
