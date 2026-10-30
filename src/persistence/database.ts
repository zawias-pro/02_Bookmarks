import Dexie, { type Table } from 'dexie';
import type { LocalBookmark, LocalCategory, LocalIcon, OutboxMutation } from '../model/model.ts';

type LegacyTag = {
  id: string;
  remoteId?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  positions?: Record<string, number>;
};
type LegacyTaggedBookmark = Omit<LocalBookmark, 'categoryId'> & { tagIds?: string[]; categoryId?: string | null; categoryIds?: string[] };
type LegacyOutboxMutation = Omit<OutboxMutation, 'collection' | 'snapshot'> & {
  collection: 'bookmarks' | 'categories' | 'tags';
  snapshot: LegacyTaggedBookmark | LegacyTag;
};
type LegacyOrderedCategory = Omit<LocalCategory, 'parentId' | 'order'> & { parentId?: string | null; order?: number };

class BookmarksDatabase extends Dexie {
  bookmarks!: Table<LocalBookmark, string>;
  categories!: Table<LocalCategory, string>;
  icons!: Table<LocalIcon, string>;
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
    }).upgrade((transaction) => transaction.table('bookmarks').toCollection().modify((bookmark: LegacyTaggedBookmark) => {
      if (!bookmark.categoryId && bookmark.categoryIds?.[0]) bookmark.categoryId = bookmark.categoryIds[0];
      delete bookmark.categoryIds;
    }));
    this.version(3).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, remoteId, name, createdAt',
      profiles: 'id',
    }).upgrade((transaction) => transaction.table('categories').toCollection().modify((category: LegacyTag) => {
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
      const categories = await transaction.table<LegacyTag>('categories').toArray();
      if (categories.length > 0) await transaction.table<LegacyTag>('tags').bulkPut(categories);
      await transaction.table<LegacyTaggedBookmark>('bookmarks').toCollection().modify((bookmark) => {
        bookmark.tagIds = bookmark.categoryId ? [bookmark.categoryId] : [];
        delete bookmark.categoryId;
      });
      await transaction.table<LegacyOutboxMutation>('outbox').toCollection().modify((mutation) => {
        if (mutation.collection === 'categories') mutation.collection = 'tags';
        if (mutation.collection === 'bookmarks') {
          const snapshot = mutation.snapshot as LegacyTaggedBookmark;
          snapshot.tagIds = snapshot.categoryId ? [snapshot.categoryId] : [];
          delete snapshot.categoryId;
        }
      });
    });
    this.version(7).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      tags: 'id, remoteId, name, createdAt, updatedAt',
      categories: 'id, remoteId, name, createdAt, updatedAt',
      profiles: 'id',
      tombstones: 'id, remoteId, collection',
      outbox: 'id, createdAt, collection, entityId, remoteId',
    }).upgrade(async (transaction) => {
      const tags = await transaction.table<LegacyTag>('tags').toArray();
      if (tags.length > 0) await transaction.table<LegacyOrderedCategory>('categories').bulkPut(tags);
      await transaction.table<LegacyOrderedCategory>('categories').toCollection().modify((category) => {
        if (category.name === '_untagged') category.name = '_uncategorized';
      });
      await transaction.table<LegacyTaggedBookmark>('bookmarks').toCollection().modify((bookmark) => {
        bookmark.categoryId = bookmark.tagIds?.[0] ?? null;
        delete bookmark.tagIds;
      });
      await transaction.table<LegacyOutboxMutation>('outbox').toCollection().modify((mutation) => {
        if (mutation.collection === 'tags') mutation.collection = 'categories';
        if (mutation.collection === 'bookmarks') {
          const snapshot = mutation.snapshot as LegacyTaggedBookmark;
          snapshot.categoryId = snapshot.tagIds?.[0] ?? null;
          delete snapshot.tagIds;
        }
      });
    });
    this.version(8).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      tags: null,
      categories: 'id, remoteId, name, createdAt, updatedAt',
      profiles: 'id',
      tombstones: 'id, remoteId, collection',
      outbox: 'id, createdAt, collection, entityId, remoteId',
    });
    // Every existing category becomes a top-level entry, ordered by the name order the sidebar showed.
    this.version(9).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, remoteId, name, createdAt, updatedAt',
      profiles: 'id',
      tombstones: 'id, remoteId, collection',
      outbox: 'id, createdAt, collection, entityId, remoteId',
    }).upgrade(async (transaction) => {
      const categories = await transaction.table<LegacyOrderedCategory>('categories').toArray();
      const ordered = [...categories].sort((left, right) => left.name.localeCompare(right.name));
      await transaction.table<LocalCategory>('categories').bulkPut(ordered.map((category, index) => ({ ...category, parentId: null, order: index })));
    });
    this.version(10).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, remoteId, name, createdAt, updatedAt',
      icons: 'id, name, updatedAt',
      profiles: 'id',
      tombstones: 'id, remoteId, collection',
      outbox: 'id, createdAt, collection, entityId, remoteId',
    });
  }
}

const db = new BookmarksDatabase();

const createId = () => crypto.randomUUID();

export { createId, db };
