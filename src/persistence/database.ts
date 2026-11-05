import Dexie, { type Table } from 'dexie';
import type { LocalBookmark, LocalCategory, LocalIcon, OutboxMutation } from '../model/model.ts';
import { chooseDefaultCategory } from '../categories/tree.ts';

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
    // The hidden uncategorized board is gone: every bookmark gets a real category, and the record
    // whose fixed id older clients shared is dropped together with its mutations.
    this.version(11).stores({
      bookmarks: 'id, remoteId, updatedAt, order, categoryId',
      categories: 'id, remoteId, name, createdAt, updatedAt',
      icons: 'id, name, updatedAt',
      profiles: 'id',
      tombstones: 'id, remoteId, collection',
      outbox: 'id, createdAt, collection, entityId, remoteId',
    }).upgrade(async (transaction) => {
      const legacyId = 'untaggedtag0000';
      const categories = transaction.table<LocalCategory>('categories');
      const bookmarks = transaction.table<LocalBookmark>('bookmarks');
      const outbox = transaction.table<OutboxMutation>('outbox');
      const legacy = await categories.get(legacyId);
      const affected = [
        ...await bookmarks.filter((bookmark) => !bookmark.categoryId).toArray(),
        ...(legacy ? await bookmarks.where('categoryId').equals(legacyId).toArray() : []),
      ];
      await outbox.where('entityId').equals(legacyId).delete();
      await categories.delete(legacyId);
      if (affected.length === 0) return;
      // Inline, because an upgrade must keep choosing the name it shipped with.
      const legacyDefaultName = 'Unnamed';
      const now = new Date().toISOString();
      // Nothing to move to means the device kept bookmarks but deleted its last category; that state
      // cannot be created any more, so the repair names the default category itself.
      const existing = chooseDefaultCategory(await categories.toArray(), legacyDefaultName);
      const target: LocalCategory = existing ?? {
        id: createId(),
        name: legacyDefaultName,
        parentId: null,
        order: 0,
        createdAt: now,
        updatedAt: now,
      };
      if (!existing) {
        await categories.put(target);
        await outbox.put({ id: createId(), collection: 'categories', operation: 'create', entityId: target.id, snapshot: target, createdAt: now });
      }
      // updatedAt stays the server's value, because it is the conflict base for the next push.
      await categories.update(target.id, { positions: { ...target.positions, ...legacy?.positions } });
      await bookmarks.bulkPut(affected.map((bookmark) => ({ ...bookmark, categoryId: target.id })));
      const moved = new Set(affected.map((bookmark) => bookmark.id));
      await outbox.filter((mutation) => mutation.collection === 'bookmarks' && moved.has(mutation.entityId))
        .modify((mutation) => { mutation.snapshot = { ...mutation.snapshot, categoryId: target.id }; });
    });
  }
}

const db = new BookmarksDatabase();

const createId = () => crypto.randomUUID();

export { createId, db };
