import Dexie, { type Table } from 'dexie';
import type { LocalBookmark, LocalCategory, OutboxMutation } from '../model/model.ts';

class BookmarksDatabase extends Dexie {
  bookmarks!: Table<LocalBookmark, string>;
  categories!: Table<LocalCategory, string>;
  outbox!: Table<OutboxMutation, string>;

  constructor() {
    super('bookmarks-offline');
    this.version(1).stores({
      bookmarks: 'id, remoteId, updatedAt, order',
      categories: 'id, name, createdAt',
      profiles: 'id',
    });
    this.version(2).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, name, createdAt',
      profiles: 'id',
    }).upgrade((transaction) => transaction.table('bookmarks').toCollection().modify((bookmark: LocalBookmark & { categoryIds?: string[] }) => {
      if (!bookmark.categoryId && bookmark.categoryIds?.[0]) bookmark.categoryId = bookmark.categoryIds[0];
      delete bookmark.categoryIds;
    }));
    this.version(3).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, remoteId, name, createdAt',
      profiles: 'id',
    }).upgrade((transaction) => transaction.table('categories').toCollection().modify((category: LocalCategory) => {
      if (!category.updatedAt) category.updatedAt = category.createdAt;
    }));
    this.version(4).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, remoteId, name, createdAt',
      profiles: 'id',
      tombstones: 'id, remoteId, collection',
    });
    this.version(5).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, remoteId, name, createdAt, updatedAt',
      profiles: 'id',
      tombstones: 'id, remoteId, collection',
      outbox: 'id, createdAt, collection, entityId, remoteId',
    });
  }
}

const db = new BookmarksDatabase();

const createId = () => crypto.randomUUID();

export { createId, db };
