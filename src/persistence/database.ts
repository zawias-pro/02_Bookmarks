import Dexie, { type Table } from 'dexie';
import type { LocalBookmark, LocalTag, OutboxMutation } from '../model/model.ts';

type LegacyBookmark = Omit<LocalBookmark, 'tagIds'> & { tagIds?: string[]; categoryId?: string };
type LegacyOutboxMutation = Omit<OutboxMutation, 'collection' | 'snapshot'> & {
  collection: 'bookmarks' | 'categories' | 'tags';
  snapshot: LegacyBookmark | LocalTag;
};

class BookmarksDatabase extends Dexie {
  bookmarks!: Table<LocalBookmark, string>;
  tags!: Table<LocalTag, string>;
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
    }).upgrade((transaction) => transaction.table('bookmarks').toCollection().modify((bookmark: LegacyBookmark & { categoryIds?: string[] }) => {
      if (!bookmark.categoryId && bookmark.categoryIds?.[0]) bookmark.categoryId = bookmark.categoryIds[0];
      delete bookmark.categoryIds;
    }));
    this.version(3).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, remoteId, name, createdAt',
      profiles: 'id',
    }).upgrade((transaction) => transaction.table('categories').toCollection().modify((category: LocalTag) => {
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
    this.version(6).stores({
      bookmarks: 'id, remoteId, updatedAt, order, *tagIds',
      tags: 'id, remoteId, name, createdAt, updatedAt',
      categories: null,
      profiles: 'id',
      tombstones: 'id, remoteId, collection',
      outbox: 'id, createdAt, collection, entityId, remoteId',
    }).upgrade(async (transaction) => {
      const categories = await transaction.table<LocalTag>('categories').toArray();
      if (categories.length > 0) await transaction.table<LocalTag>('tags').bulkPut(categories);
      await transaction.table<LegacyBookmark>('bookmarks').toCollection().modify((bookmark) => {
        bookmark.tagIds = bookmark.categoryId ? [bookmark.categoryId] : [];
        delete bookmark.categoryId;
      });
      await transaction.table<LegacyOutboxMutation>('outbox').toCollection().modify((mutation) => {
        if (mutation.collection === 'categories') mutation.collection = 'tags';
        if (mutation.collection === 'bookmarks') {
          const snapshot = mutation.snapshot as LegacyBookmark;
          snapshot.tagIds = snapshot.categoryId ? [snapshot.categoryId] : [];
          delete snapshot.categoryId;
        }
      });
    });
  }
}

const db = new BookmarksDatabase();

const createId = () => crypto.randomUUID();

export { createId, db };
