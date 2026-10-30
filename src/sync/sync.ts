import type { RecordModel } from 'pocketbase';
import { db, createId } from '../persistence/database.ts';
import { pb } from '../persistence/pocketbase.ts';
import { categoryRows, descendantsOf, planCategoryDelete, planCategoryMove } from '../categories/tree.ts';
import { dataUrlToFile, resolveFavicon } from '../icons/favicon.ts';
import { uncategorizedCategoryId, uncategorizedCategoryName } from '../model/model.ts';
import type { IconSource, LocalBookmark, LocalCategory, OutboxMutation } from '../model/model.ts';

type RemoteCategory = RecordModel & Pick<LocalCategory, 'name' | 'order'> & { positions?: Record<string, number>; parent?: string };
type RemoteBookmark = RecordModel & Pick<LocalBookmark, 'title' | 'link' | 'favicon' | 'iconSource' | 'order'> & { category?: string };
type Collection = OutboxMutation['collection'];
type Notice = { kind: 'info' | 'conflict'; message: string };

const collectionFor = (collection: Collection) => pb.collection<RemoteBookmark | RemoteCategory>(collection);
const isNotFound = (error: unknown) => typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
const userId = () => {
  if (!pb.authStore.isValid || !pb.authStore.record) throw new Error('Sign in to PocketBase before syncing.');
  return pb.authStore.record.id;
};
const localByRemote = async (collection: Collection, remoteId: string) =>
  collection === 'bookmarks'
    ? (await db.bookmarks.where('remoteId').equals(remoteId).first())
    : (await db.categories.where('remoteId').equals(remoteId).first());

const faviconUrl = (bookmark: RemoteBookmark) => {
  if (!bookmark.favicon) return undefined;
  if (bookmark.favicon.startsWith('data:')) return bookmark.favicon;
  return pb.files.getURL(bookmark, bookmark.favicon);
};

const remoteCategoryId = async (categoryId: string | null) => {
  if (categoryId === null) return '';
  const category = await db.categories.get(categoryId);
  if (!category) throw new Error(`Cannot sync bookmark because category ${categoryId} does not exist locally.`);
  if (!category.remoteId) throw new Error(`Cannot sync bookmark because category "${category.name}" has not synced yet.`);
  return category.remoteId;
};

const remoteParentId = async (parentId: string | null) => {
  if (parentId === null) return '';
  const parent = await db.categories.get(parentId);
  if (!parent) throw new Error(`Cannot sync category because its parent ${parentId} does not exist locally.`);
  if (!parent.remoteId) throw new Error(`Cannot sync category because its parent "${parent.name}" has not synced yet.`);
  return parent.remoteId;
};

const bookmarkFormData = async (snapshot: LocalBookmark, user?: string) => {
  const data = new FormData();
  data.set('title', snapshot.title);
  data.set('link', snapshot.link);
  data.set('order', String(snapshot.order));
  data.set('iconSource', snapshot.iconSource === 'custom' ? 'custom' : 'auto');
  data.set('category', await remoteCategoryId(snapshot.categoryId));
  if (user) data.set('user', user);
  if (snapshot.favicon?.startsWith('data:')) data.set('favicon', await dataUrlToFile(snapshot.favicon));
  return data;
};

// Slots are stored against local bookmark ids but shared as remote ids, the only key both devices know.
const remotePositionKeys = async (positions: Record<string, number>) => {
  const ids = Object.keys(positions);
  if (ids.length === 0) return {};
  const bookmarks = await db.bookmarks.bulkGet(ids);
  return Object.fromEntries(ids.flatMap((id, index) => {
    const remoteId = bookmarks[index]?.remoteId;
    return remoteId ? [[remoteId, positions[id]] as [string, number]] : [];
  }));
};

const categoryFormData = async (snapshot: LocalCategory) => ({
  name: snapshot.name,
  order: snapshot.order,
  parent: await remoteParentId(snapshot.parentId),
  positions: JSON.stringify(await remotePositionKeys(snapshot.positions ?? {})),
});

const enqueue = async (mutation: Omit<OutboxMutation, 'id' | 'createdAt'>) => {
  const previous = await db.outbox.where('entityId').equals(mutation.entityId).toArray();
  const createMutation = previous.find((item) => item.operation === 'create');
  await db.outbox.bulkDelete(previous.map((item) => item.id));
  // A pending create means the entity never reached the server, so deleting it needs no remote call.
  if (createMutation && mutation.operation === 'delete') return;
  await db.outbox.add({
    ...mutation,
    operation: createMutation ? 'create' : mutation.operation,
    remoteId: createMutation ? undefined : mutation.remoteId,
    baseRemoteUpdatedAt: createMutation ? undefined : mutation.baseRemoteUpdatedAt,
    id: createId(),
    createdAt: createMutation?.createdAt ?? new Date().toISOString(),
  });
};

const createCategory = async (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be empty.');
  if (trimmed === uncategorizedCategoryName) throw new Error('That category name is reserved.');
  const id = createId();
  await db.transaction('rw', db.categories, db.outbox, async () => {
    const now = new Date().toISOString();
    const topLevel = await db.categories.filter((item) => item.parentId === null).toArray();
    const category: LocalCategory = {
      id,
      name: trimmed,
      parentId: null,
      order: topLevel.reduce((last, item) => Math.max(last, item.order), -1) + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.categories.add(category);
    await enqueue({ collection: 'categories', operation: 'create', entityId: category.id, snapshot: category });
  });
  void syncNow();
  return id;
};

const updateCategory = async (id: string, name: string) => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Category name cannot be empty.');
  if (trimmed === uncategorizedCategoryName) throw new Error('That category name is reserved.');
  await db.transaction('rw', db.categories, db.outbox, async () => {
    const category = await db.categories.get(id);
    if (!category) throw new Error('Cannot update category because it does not exist locally.');
    const updated = { ...category, name: trimmed, updatedAt: new Date().toISOString() };
    await db.categories.put(updated);
    await enqueue({ collection: 'categories', operation: category.remoteId ? 'update' : 'create', entityId: id, remoteId: category.remoteId, baseRemoteUpdatedAt: category.remoteId ? category.updatedAt : undefined, snapshot: updated });
  });
  void syncNow();
};

const deleteCategory = async (id: string) => {
  await db.transaction('rw', db.categories, db.bookmarks, db.outbox, async () => {
    const categories = await db.categories.toArray();
    const category = categories.find((item) => item.id === id);
    if (!category) throw new Error('Cannot delete category because it does not exist locally.');
    // Sub-categories survive their parent: they take its place among its siblings.
    const moves = planCategoryDelete(categories, id);
    for (const bookmark of await db.bookmarks.where('categoryId').equals(id).toArray()) {
      const updated = { ...bookmark, categoryId: null, updatedAt: new Date().toISOString() };
      await db.bookmarks.put(updated);
      await enqueue({ collection: 'bookmarks', operation: bookmark.remoteId ? 'update' : 'create', entityId: bookmark.id, remoteId: bookmark.remoteId, baseRemoteUpdatedAt: bookmark.remoteId ? bookmark.updatedAt : undefined, snapshot: updated });
    }
    for (const move of moves) {
      const child = categories.find((item) => item.id === move.id);
      if (!child) throw new Error(`Cannot delete category because its child ${move.id} does not exist locally.`);
      const updated = { ...child, ...move, updatedAt: new Date().toISOString() };
      await db.categories.put(updated);
      await enqueue({ collection: 'categories', operation: child.remoteId ? 'update' : 'create', entityId: child.id, remoteId: child.remoteId, baseRemoteUpdatedAt: child.remoteId ? child.updatedAt : undefined, snapshot: updated });
    }
    await db.categories.delete(id);
    await enqueue({ collection: 'categories', operation: 'delete', entityId: id, remoteId: category.remoteId, baseRemoteUpdatedAt: category.remoteId ? category.updatedAt : undefined, snapshot: category });
  });
  void syncNow();
};

const moveCategory = async (id: string, parentId: string | null, index: number) => {
  if (id === uncategorizedCategoryId) throw new Error('The uncategorized board cannot be moved.');
  await db.transaction('rw', db.categories, db.outbox, async () => {
    const categories = (await db.categories.toArray()).filter((category) => category.id !== uncategorizedCategoryId);
    const now = new Date().toISOString();
    for (const move of planCategoryMove(categories, id, parentId, index)) {
      const category = categories.find((item) => item.id === move.id);
      if (!category) throw new Error(`Cannot move category because ${move.id} does not exist locally.`);
      const updated = { ...category, ...move, updatedAt: now };
      await db.categories.put(updated);
      await enqueue({ collection: 'categories', operation: category.remoteId ? 'update' : 'create', entityId: category.id, remoteId: category.remoteId, baseRemoteUpdatedAt: category.remoteId ? category.updatedAt : undefined, snapshot: updated });
    }
  });
  void syncNow();
};

const createUncategorizedCategory = async () => {
  const now = new Date().toISOString();
  const positions: Record<string, number> = {};
  for (const bookmark of await db.bookmarks.toArray()) {
    if (bookmark.categoryId === null) positions[bookmark.id] = bookmark.order;
  }
  const category: LocalCategory = { id: uncategorizedCategoryId, name: uncategorizedCategoryName, parentId: null, order: 0, createdAt: now, updatedAt: now, positions };
  await db.transaction('rw', db.categories, db.outbox, async () => {
    await db.categories.add(category);
    await enqueue({ collection: 'categories', operation: 'create', entityId: category.id, snapshot: category });
  });
  void syncNow();
  return category.id;
};

let ensuringUncategorized: Promise<string> | undefined;
const ensureUncategorizedCategory = () => {
  ensuringUncategorized ??= (async () => {
    const existing = await db.categories.get(uncategorizedCategoryId);
    return existing ? existing.id : await createUncategorizedCategory();
  })().finally(() => { ensuringUncategorized = undefined; });
  return ensuringUncategorized;
};

const moveCategoryBookmark = async (categoryId: string, bookmarkId: string, slot: number, layout: Record<string, number>) => {
  if (!Number.isInteger(slot) || slot < 1) throw new Error('Bookmark slot must be a positive integer.');
  await db.transaction('rw', db.categories, db.bookmarks, db.outbox, async () => {
    const category = await db.categories.get(categoryId);
    if (!category) throw new Error('Cannot move bookmark because its category does not exist locally.');
    const entries = Object.entries(category.positions ?? {});
    const onBoard = (bookmark: LocalBookmark) => categoryId === uncategorizedCategoryId
      ? bookmark.categoryId === null
      : bookmark.categoryId === categoryId;
    const live = (await db.bookmarks.bulkGet(entries.map(([id]) => id))).flatMap((bookmark) => bookmark && onBoard(bookmark) ? [bookmark.id] : []);
    const positions = Object.fromEntries(entries.filter(([id]) => live.includes(id)));
    // Persist the layout that is on screen so untouched bookmarks keep their slot.
    const merged = { ...positions, ...layout, [bookmarkId]: slot };
    if (Object.entries(merged).some(([id, value]) => value === slot && id !== bookmarkId)) throw new Error('Cannot move bookmark because the target slot is occupied.');
    const updated = { ...category, positions: merged, updatedAt: new Date().toISOString() };
    await db.categories.put(updated);
    await enqueue({ collection: 'categories', operation: category.remoteId ? 'update' : 'create', entityId: categoryId, remoteId: category.remoteId, baseRemoteUpdatedAt: category.remoteId ? category.updatedAt : undefined, snapshot: updated });
  });
  void syncNow();
};

const saveBookmarkIcon = async (bookmark: LocalBookmark, favicon: string, iconSource: IconSource) => {
  const updated = { ...bookmark, favicon, iconSource, updatedAt: new Date().toISOString() };
  await db.transaction('rw', db.bookmarks, db.outbox, async () => {
    await db.bookmarks.put(updated);
    await enqueue({ collection: 'bookmarks', operation: bookmark.remoteId ? 'update' : 'create', entityId: bookmark.id, remoteId: bookmark.remoteId, baseRemoteUpdatedAt: bookmark.remoteId ? bookmark.updatedAt : undefined, snapshot: updated });
  });
};

const createBookmark = async (input: { title: string; link: string; categoryId: string | null }) => {
  const title = input.title.trim();
  const link = input.link.trim();
  if (!title || !link) throw new Error('Bookmark title and URL cannot be empty.');
  const favicon = navigator.onLine === false ? undefined : await resolveFavicon(link);
  const id = createId();
  await db.transaction('rw', db.bookmarks, db.outbox, async () => {
    const last = await db.bookmarks.orderBy('order').last();
    const bookmark: LocalBookmark = { id, title, link, favicon, iconSource: 'auto', categoryId: input.categoryId, order: (last?.order ?? 0) + 1, updatedAt: new Date().toISOString() };
    await db.bookmarks.add(bookmark);
    await enqueue({ collection: 'bookmarks', operation: 'create', entityId: bookmark.id, snapshot: bookmark });
  });
  void syncNow();
  return id;
};

const refreshBookmarkIcon = async (id: string) => {
  const bookmark = await db.bookmarks.get(id);
  if (!bookmark) throw new Error('Cannot refresh the bookmark icon because the bookmark does not exist locally.');
  if (navigator.onLine === false) throw new Error('Connect to the internet before refreshing the bookmark icon.');
  const favicon = await resolveFavicon(bookmark.link);
  if (!favicon) throw new Error('This site exposes no readable icon. Upload one instead.');
  if (favicon !== bookmark.favicon) await saveBookmarkIcon(bookmark, favicon, 'auto');
  void syncNow();
  return favicon;
};

const setBookmarkIcon = async (id: string, dataUrl: string) => {
  const bookmark = await db.bookmarks.get(id);
  if (!bookmark) throw new Error('Cannot set the bookmark icon because the bookmark does not exist locally.');
  await saveBookmarkIcon(bookmark, dataUrl, 'custom');
  void syncNow();
};

const reloadFavicons = async () => {
  if (navigator.onLine === false) throw new Error('Connect to the internet before loading bookmark icons.');
  await syncNow();
  const bookmarks = await db.bookmarks.toArray();
  let reloaded = 0;
  let skipped = 0;
  for (const bookmark of bookmarks) {
    if (bookmark.iconSource === 'custom') {
      skipped += 1;
      continue;
    }
    const favicon = await resolveFavicon(bookmark.link);
    if (!favicon || favicon === bookmark.favicon) continue;
    await saveBookmarkIcon(bookmark, favicon, 'auto');
    reloaded += 1;
  }
  if (reloaded > 0) await syncNow();
  return { reloaded, skipped };
};

const updateBookmark = async (id: string, input: { title: string; link: string; categoryId: string | null }) => {
  const title = input.title.trim();
  const link = input.link.trim();
  if (!title || !link) throw new Error('Bookmark title and URL cannot be empty.');
  await db.transaction('rw', db.bookmarks, db.outbox, async () => {
    const bookmark = await db.bookmarks.get(id);
    if (!bookmark) throw new Error('Cannot update bookmark because it does not exist locally.');
    const updated = { ...bookmark, title, link, categoryId: input.categoryId, updatedAt: new Date().toISOString() };
    await db.bookmarks.put(updated);
    await enqueue({ collection: 'bookmarks', operation: bookmark.remoteId ? 'update' : 'create', entityId: id, remoteId: bookmark.remoteId, baseRemoteUpdatedAt: bookmark.remoteId ? bookmark.updatedAt : undefined, snapshot: updated });
  });
  void syncNow();
};

const deleteBookmark = async (id: string) => {
  await db.transaction('rw', db.bookmarks, db.outbox, async () => {
    const bookmark = await db.bookmarks.get(id);
    if (!bookmark) throw new Error('Cannot delete bookmark because it does not exist locally.');
    await db.bookmarks.delete(id);
    await enqueue({ collection: 'bookmarks', operation: 'delete', entityId: id, remoteId: bookmark.remoteId, baseRemoteUpdatedAt: bookmark.remoteId ? bookmark.updatedAt : undefined, snapshot: bookmark });
  });
  void syncNow();
};

const createRemote = async (mutation: OutboxMutation, snapshot: LocalBookmark | LocalCategory) => {
  if (mutation.collection === 'categories') {
    const category = snapshot as LocalCategory;
    const identity = category.id === uncategorizedCategoryId ? { id: category.id } : {};
    return collectionFor(mutation.collection).create({ ...await categoryFormData(category), ...identity, user: userId() });
  }
  const bookmark = snapshot as LocalBookmark;
  return collectionFor(mutation.collection).create(await bookmarkFormData(bookmark, userId()));
};

const conflictCopy = async (mutation: OutboxMutation, remote: RemoteBookmark | RemoteCategory | undefined, notice: (notice: Notice) => void) => {
  const snapshot = mutation.snapshot;
  const copy = { ...snapshot, id: createId(), remoteId: undefined, ...(mutation.collection === 'bookmarks' ? { title: `${(snapshot as LocalBookmark).title} (conflict copy)` } : { name: `${(snapshot as LocalCategory).name} (conflict copy)` }), updatedAt: new Date().toISOString() } as LocalBookmark | LocalCategory;
  const created = await createRemote({ ...mutation, operation: 'create' }, copy);
  const linked = { ...copy, remoteId: created.id, updatedAt: created.updated } as LocalBookmark | LocalCategory;
  await db.transaction('rw', db.bookmarks, db.categories, db.outbox, async () => {
    if (mutation.collection === 'bookmarks') await db.bookmarks.add(linked as LocalBookmark);
    else await db.categories.add(linked as LocalCategory);
    await db.outbox.delete(mutation.id);
  });
  notice({ kind: 'conflict', message: `${mutation.collection === 'bookmarks' ? 'Bookmark' : 'Category'} conflict preserved as a copy.` });
  return remote;
};

const processMutation = async (mutation: OutboxMutation, notice: (notice: Notice) => void) => {
  if (mutation.operation === 'create') {
    let remote: RemoteBookmark | RemoteCategory;
    try {
      remote = await createRemote(mutation, mutation.snapshot);
    } catch (error) {
      // Another device already created the fixed-id uncategorized board.
      if (mutation.entityId !== uncategorizedCategoryId) throw error;
      remote = await collectionFor('categories').getOne(uncategorizedCategoryId);
    }
    const remoteFavicon = mutation.collection === 'bookmarks' ? faviconUrl(remote as RemoteBookmark) : undefined;
    if (mutation.collection === 'bookmarks' && (mutation.snapshot as LocalBookmark).favicon?.startsWith('data:') && (!remoteFavicon || remoteFavicon.startsWith('data:'))) {
      throw new Error('PocketBase did not store the bookmark icon as a file.');
    }
    await db.transaction('rw', db.bookmarks, db.categories, db.outbox, async () => {
      if (mutation.collection === 'bookmarks') await db.bookmarks.update(mutation.entityId, { remoteId: remote.id, favicon: remoteFavicon ?? (mutation.snapshot as LocalBookmark).favicon, updatedAt: remote.updated });
      else await db.categories.update(mutation.entityId, { remoteId: remote.id, updatedAt: remote.updated });
      await db.outbox.delete(mutation.id);
    });
    return;
  }
  let remote: RemoteBookmark | RemoteCategory;
  try {
    remote = await collectionFor(mutation.collection).getOne(mutation.remoteId!);
  } catch (error) {
    if (mutation.operation === 'delete' && isNotFound(error)) { await db.outbox.delete(mutation.id); return; }
    if (isNotFound(error)) { await conflictCopy(mutation, undefined, notice); return; }
    throw error;
  }
  if (remote.updated !== mutation.baseRemoteUpdatedAt) { await conflictCopy(mutation, remote, notice); return; }
  if (mutation.operation === 'delete') await collectionFor(mutation.collection).delete(mutation.remoteId!);
  const updatedRemote = mutation.operation === 'delete' ? undefined : await collectionFor(mutation.collection).update(mutation.remoteId!, mutation.collection === 'bookmarks'
    ? await bookmarkFormData(mutation.snapshot as LocalBookmark)
    : await categoryFormData(mutation.snapshot as LocalCategory));
  const remoteFavicon = mutation.collection === 'bookmarks' && updatedRemote ? faviconUrl(updatedRemote as RemoteBookmark) : undefined;
  if (mutation.collection === 'bookmarks' && (mutation.snapshot as LocalBookmark).favicon?.startsWith('data:') && (!remoteFavicon || remoteFavicon.startsWith('data:'))) {
    throw new Error('PocketBase did not store the bookmark icon as a file.');
  }
  await db.transaction('rw', db.bookmarks, db.categories, db.outbox, async () => {
    if (mutation.collection === 'bookmarks') {
      if (mutation.operation === 'delete') await db.bookmarks.delete(mutation.entityId);
      else await db.bookmarks.update(mutation.entityId, { favicon: remoteFavicon ?? (mutation.snapshot as LocalBookmark).favicon, updatedAt: updatedRemote?.updated ?? remote.updated });
    } else {
      if (mutation.operation === 'delete') await db.categories.delete(mutation.entityId);
      else await db.categories.update(mutation.entityId, { updatedAt: updatedRemote?.updated ?? remote.updated });
    }
    await db.outbox.delete(mutation.id);
  });
};

const pull = async () => {
  const uid = userId();
  const [remoteBookmarks, remoteCategories, pending] = await Promise.all([
    pb.collection<RemoteBookmark>('bookmarks').getFullList({ filter: `user = "${uid}"` }),
    pb.collection<RemoteCategory>('categories').getFullList({ filter: `user = "${uid}"` }),
    db.outbox.toArray(),
  ]);
  const pendingRemoteIds = new Set(pending.map((item) => item.remoteId).filter((id): id is string => Boolean(id)));
  const remotePositionMaps: { categoryId: string; positions: Record<string, number> }[] = [];
  const remoteParents: { categoryId: string; parentRemoteId: string }[] = [];
  for (const remote of remoteCategories) {
    if (pendingRemoteIds.has(remote.id)) continue;
    const local = await localByRemote('categories', remote.id);
    const categoryId = local?.id ?? remote.id;
    if (local) await db.categories.update(local.id, { name: remote.name, order: remote.order, updatedAt: remote.updated });
    else await db.categories.put({ id: remote.id, remoteId: remote.id, name: remote.name, parentId: null, order: remote.order, createdAt: remote.created, updatedAt: remote.updated });
    if (remote.parent) remoteParents.push({ categoryId, parentRemoteId: remote.parent });
    remotePositionMaps.push({ categoryId, positions: remote.positions ?? {} });
  }
  // Parents are shared as remote ids, and a parent can arrive after its child.
  const localCategories = await db.categories.toArray();
  for (const { categoryId, parentRemoteId } of remoteParents) {
    const parent = await localByRemote('categories', parentRemoteId);
    // Two devices can each nest the other's category; keeping the second would lock both in place.
    if (parent && descendantsOf(localCategories, categoryId).has(parent.id)) continue;
    await db.categories.update(categoryId, { parentId: parent?.id ?? null });
    const local = localCategories.find((category) => category.id === categoryId);
    if (local) local.parentId = parent?.id ?? null;
  }
  for (const remote of remoteBookmarks) {
    if (pendingRemoteIds.has(remote.id)) continue;
    const category = remote.category ? await localByRemote('categories', remote.category) : undefined;
    const local = await localByRemote('bookmarks', remote.id);
    const existingFavicon = local && 'favicon' in local ? local.favicon : undefined;
    const favicon = faviconUrl(remote);
    const iconSource: IconSource = remote.iconSource === 'custom' ? 'custom' : 'auto';
    const value = { title: remote.title, link: remote.link, favicon: favicon ?? existingFavicon, iconSource, order: remote.order, categoryId: category?.id ?? null, updatedAt: remote.updated };
    if (local) await db.bookmarks.update(local.id, value);
    else await db.bookmarks.put({ id: remote.id, remoteId: remote.id, ...value });
  }
  const remoteCategoryIds = new Set(remoteCategories.map((category) => category.id));
  for (const local of await db.categories.toArray()) {
    if (!local.remoteId || pendingRemoteIds.has(local.remoteId) || remoteCategoryIds.has(local.remoteId)) continue;
    await db.transaction('rw', db.categories, db.bookmarks, async () => {
      await db.bookmarks.where('categoryId').equals(local.id).modify((bookmark) => {
        bookmark.categoryId = null;
      });
      await db.categories.delete(local.id);
    });
  }
  // Slots arrive keyed by remote bookmark ids; local ids differ only for bookmarks this device created.
  const localBookmarks = await db.bookmarks.toArray();
  const bookmarkByKey = new Map<string, LocalBookmark>();
  for (const bookmark of localBookmarks) {
    bookmarkByKey.set(bookmark.id, bookmark);
    if (bookmark.remoteId) bookmarkByKey.set(bookmark.remoteId, bookmark);
  }
  for (const entry of remotePositionMaps) {
    const onBoard = (bookmark: LocalBookmark) => entry.categoryId === uncategorizedCategoryId
      ? bookmark.categoryId === null
      : bookmark.categoryId === entry.categoryId;
    const local = await db.categories.get(entry.categoryId);
    // Keep local slots the remote map cannot express (a bookmark that had no remote id when the map was pushed).
    const kept = Object.entries(local?.positions ?? {}).flatMap(([id, slot]) => {
      const bookmark = bookmarkByKey.get(id);
      return bookmark && onBoard(bookmark) ? [[id, slot] as [string, number]] : [];
    });
    const translated = Object.entries(entry.positions).flatMap(([key, slot]) => {
      const bookmark = bookmarkByKey.get(key);
      return bookmark && onBoard(bookmark) ? [[bookmark.id, slot] as [string, number]] : [];
    });
    await db.categories.update(entry.categoryId, { positions: { ...Object.fromEntries(kept), ...Object.fromEntries(translated) } });
  }
  const remoteBookmarkIds = new Set(remoteBookmarks.map((bookmark) => bookmark.id));
  for (const local of localBookmarks) {
    if (local.remoteId && !pendingRemoteIds.has(local.remoteId) && !remoteBookmarkIds.has(local.remoteId)) await db.bookmarks.delete(local.id);
  }
  return;
};

let activeSync: Promise<void> | undefined;
const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number) => {
  let timeoutId: number | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => reject(new Error('Sync request timed out.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
};
const runWorker = async () => {
  if (!pb.authStore.isValid) {
    if (pb.authStore.record) pb.authStore.clear();
    return;
  }
  const notices: Notice[] = [];
  const mutations = await db.outbox.orderBy('createdAt').toArray();
  // A category that names a parent must reach the server after that parent exists there.
  const ranks = new Map(categoryRows(await db.categories.toArray()).map(({ category }, index) => [category.id, index]));
  const rankOf = (mutation: OutboxMutation) => ranks.get(mutation.entityId) ?? ranks.size;
  const orderedMutations = [
    ...mutations.filter((mutation) => mutation.collection === 'categories').sort((left, right) => rankOf(left) - rankOf(right)),
    ...mutations.filter((mutation) => mutation.collection === 'bookmarks'),
  ];
  for (const mutation of orderedMutations) await processMutation(mutation, (notice) => notices.push(notice));
  await pull();
  for (const notice of notices) window.dispatchEvent(new CustomEvent('sync-notice', { detail: notice }));
};
const syncNow = () => {
  activeSync ??= withTimeout(runWorker(), 15_000).finally(() => { activeSync = undefined; });
  return activeSync;
};

export { createBookmark, createCategory, deleteBookmark, deleteCategory, ensureUncategorizedCategory, moveCategory, moveCategoryBookmark, refreshBookmarkIcon, reloadFavicons, setBookmarkIcon, syncNow, updateBookmark, updateCategory };
