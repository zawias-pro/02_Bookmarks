import type { RecordModel } from 'pocketbase';
import { db, createId } from '../persistence/database.ts';
import { pb } from '../persistence/pocketbase.ts';
import type { LocalBookmark, LocalTag, OutboxMutation } from '../model/model.ts';

type RemoteTag = RecordModel & Pick<LocalTag, 'name'>;
type RemoteBookmark = RecordModel & Pick<LocalBookmark, 'title' | 'link' | 'favicon' | 'order'> & { tags?: string[] };
type Collection = OutboxMutation['collection'];
type Notice = { kind: 'info' | 'conflict'; message: string };
type SyncCounts = { bookmarks: number; tags: number; pulled: number; pushed: number };

const collectionFor = (collection: Collection) => pb.collection<RemoteBookmark | RemoteTag>(collection);
const isNotFound = (error: unknown) => typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
const userId = () => {
  if (!pb.authStore.isValid || !pb.authStore.record) throw new Error('Sign in to PocketBase before syncing.');
  return pb.authStore.record.id;
};
const localByRemote = async (collection: Collection, remoteId: string) =>
  collection === 'bookmarks'
    ? (await db.bookmarks.where('remoteId').equals(remoteId).first())
    : (await db.tags.where('remoteId').equals(remoteId).first());

const fetchFavicon = async (link: string) => {
  const hostname = new URL(link).hostname;
  const response = await fetch(`https://favicon.vemetric.com/${hostname}?size=64`);
  if (!response.ok) throw new Error(`Could not fetch bookmark icon (${response.status}).`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read bookmark icon.'));
        return;
      }
      resolve(reader.result);
    });
    reader.addEventListener('error', () => reject(new Error('Could not read bookmark icon.')));
    reader.readAsDataURL(blob);
  });
};

const tryFetchFavicon = async (link: string) => {
  try {
    return await fetchFavicon(link);
  } catch {
    return undefined;
  }
};

const dataUrlToFile = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = blob.type.split('/')[1]?.replace('svg+xml', 'svg') || 'png';
  return new File([blob], `favicon.${extension}`, { type: blob.type });
};

const faviconUrl = (bookmark: RemoteBookmark) => {
  if (!bookmark.favicon) return undefined;
  if (bookmark.favicon.startsWith('data:')) return bookmark.favicon;
  return pb.files.getURL(bookmark, bookmark.favicon);
};

const remoteTagIds = async (tagIds: string[]) => {
  const tags = await db.tags.bulkGet(tagIds);
  return tags.map((tag, index) => {
    if (!tag) throw new Error(`Cannot sync bookmark because tag ${tagIds[index]} does not exist locally.`);
    if (!tag.remoteId) throw new Error(`Cannot sync bookmark because tag "${tag.name}" has not synced yet.`);
    return tag.remoteId;
  });
};

const bookmarkFormData = async (snapshot: LocalBookmark, tagIds: string[], user?: string) => {
  const data = new FormData();
  data.set('title', snapshot.title);
  data.set('link', snapshot.link);
  data.set('order', String(snapshot.order));
  if (tagIds.length === 0) data.set('tags', '');
  else for (const tagId of tagIds) data.append('tags', tagId);
  if (user) data.set('user', user);
  if (snapshot.favicon?.startsWith('data:')) data.set('favicon', await dataUrlToFile(snapshot.favicon));
  return data;
};

const enqueue = async (mutation: Omit<OutboxMutation, 'id' | 'createdAt'>) => {
  const previous = await db.outbox.where('entityId').equals(mutation.entityId).toArray();
  const createMutation = previous.find((item) => item.operation === 'create');
  await db.outbox.bulkDelete(previous.map((item) => item.id));
  await db.outbox.add({
    ...mutation,
    operation: createMutation ? 'create' : mutation.operation,
    remoteId: createMutation ? undefined : mutation.remoteId,
    baseRemoteUpdatedAt: createMutation ? undefined : mutation.baseRemoteUpdatedAt,
    id: createId(),
    createdAt: createMutation?.createdAt ?? new Date().toISOString(),
  });
};

const createTag = async (name: string) => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Tag name cannot be empty.');
  const now = new Date().toISOString();
  const tag: LocalTag = { id: createId(), name: trimmed, createdAt: now, updatedAt: now };
  await db.transaction('rw', db.tags, db.outbox, async () => {
    await db.tags.add(tag);
    await enqueue({ collection: 'tags', operation: 'create', entityId: tag.id, snapshot: tag });
  });
  void syncNow();
  return tag.id;
};

const updateTag = async (id: string, name: string) => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Tag name cannot be empty.');
  await db.transaction('rw', db.tags, db.outbox, async () => {
    const tag = await db.tags.get(id);
    if (!tag) throw new Error('Cannot update tag because it does not exist locally.');
    const updated = { ...tag, name: trimmed, updatedAt: new Date().toISOString() };
    await db.tags.put(updated);
    await enqueue({ collection: 'tags', operation: tag.remoteId ? 'update' : 'create', entityId: id, remoteId: tag.remoteId, baseRemoteUpdatedAt: tag.remoteId ? tag.updatedAt : undefined, snapshot: updated });
  });
  void syncNow();
};

const deleteTag = async (id: string) => {
  await db.transaction('rw', db.tags, db.bookmarks, db.outbox, async () => {
    const tag = await db.tags.get(id);
    if (!tag) throw new Error('Cannot delete tag because it does not exist locally.');
    await db.bookmarks.where('tagIds').equals(id).modify((bookmark) => {
      bookmark.tagIds = bookmark.tagIds.filter((tagId) => tagId !== id);
    });
    await db.outbox.where('collection').equals('bookmarks').modify((mutation) => {
      const snapshot = mutation.snapshot as LocalBookmark;
      snapshot.tagIds = snapshot.tagIds.filter((tagId) => tagId !== id);
    });
    await db.tags.delete(id);
    if (tag.remoteId) await enqueue({ collection: 'tags', operation: 'delete', entityId: id, remoteId: tag.remoteId, baseRemoteUpdatedAt: tag.updatedAt, snapshot: tag });
  });
  void syncNow();
};

const createBookmark = async (input: { title: string; link: string; tagIds: string[] }) => {
  const title = input.title.trim();
  const link = input.link.trim();
  if (!title || !link) throw new Error('Bookmark title and URL cannot be empty.');
  const favicon = navigator.onLine === false ? undefined : await tryFetchFavicon(link);
  const bookmark: LocalBookmark = { id: createId(), title, link, favicon, tagIds: [...new Set(input.tagIds)], order: (await db.bookmarks.count()) + 1, updatedAt: new Date().toISOString() };
  await db.transaction('rw', db.bookmarks, db.outbox, async () => {
    await db.bookmarks.add(bookmark);
    await enqueue({ collection: 'bookmarks', operation: 'create', entityId: bookmark.id, snapshot: bookmark });
  });
  void syncNow();
  return bookmark.id;
};

const reloadFavicons = async () => {
  userId();
  if (navigator.onLine === false) throw new Error('Connect to the internet before loading bookmark icons.');
  await syncNow();
  const bookmarks = await db.bookmarks.toArray();
  let reloaded = 0;
  for (const bookmark of bookmarks) {
    const favicon = await tryFetchFavicon(bookmark.link);
    if (!favicon) continue;
    const updated = { ...bookmark, favicon, updatedAt: new Date().toISOString() };
    await db.transaction('rw', db.bookmarks, db.outbox, async () => {
      await db.bookmarks.put(updated);
      await enqueue({ collection: 'bookmarks', operation: bookmark.remoteId ? 'update' : 'create', entityId: bookmark.id, remoteId: bookmark.remoteId, baseRemoteUpdatedAt: bookmark.remoteId ? bookmark.updatedAt : undefined, snapshot: updated });
    });
    reloaded += 1;
  }
  if (reloaded > 0) await syncNow();
  return reloaded;
};

const updateBookmark = async (id: string, input: { title: string; link: string; tagIds: string[] }) => {
  const title = input.title.trim();
  const link = input.link.trim();
  if (!title || !link) throw new Error('Bookmark title and URL cannot be empty.');
  await db.transaction('rw', db.bookmarks, db.outbox, async () => {
    const bookmark = await db.bookmarks.get(id);
    if (!bookmark) throw new Error('Cannot update bookmark because it does not exist locally.');
    const updated = { ...bookmark, title, link, tagIds: [...new Set(input.tagIds)], updatedAt: new Date().toISOString() };
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
    if (bookmark.remoteId) await enqueue({ collection: 'bookmarks', operation: 'delete', entityId: id, remoteId: bookmark.remoteId, baseRemoteUpdatedAt: bookmark.updatedAt, snapshot: bookmark });
  });
  void syncNow();
};

const createRemote = async (mutation: OutboxMutation, snapshot: LocalBookmark | LocalTag) => {
  if (mutation.collection === 'tags') {
    return collectionFor(mutation.collection).create({ name: (snapshot as LocalTag).name, user: userId() });
  }
  const bookmark = snapshot as LocalBookmark;
  const data = await bookmarkFormData(bookmark, await remoteTagIds(bookmark.tagIds), userId());
  return collectionFor(mutation.collection).create(data);
};

const conflictCopy = async (mutation: OutboxMutation, remote: RemoteBookmark | RemoteTag | undefined, notice: (notice: Notice) => void) => {
  const snapshot = mutation.snapshot;
  const copy = { ...snapshot, id: createId(), remoteId: undefined, ...(mutation.collection === 'bookmarks' ? { title: `${(snapshot as LocalBookmark).title} (conflict copy)` } : { name: `${(snapshot as LocalTag).name} (conflict copy)` }), updatedAt: new Date().toISOString() } as LocalBookmark | LocalTag;
  const created = await createRemote({ ...mutation, operation: 'create' }, copy);
  const linked = { ...copy, remoteId: created.id, updatedAt: created.updated } as LocalBookmark | LocalTag;
  await db.transaction('rw', db.bookmarks, db.tags, db.outbox, async () => {
    if (mutation.collection === 'bookmarks') await db.bookmarks.add(linked as LocalBookmark);
    else await db.tags.add(linked as LocalTag);
    await db.outbox.delete(mutation.id);
  });
  notice({ kind: 'conflict', message: `${mutation.collection === 'bookmarks' ? 'Bookmark' : 'Tag'} conflict preserved as a copy.` });
  return remote;
};

const processMutation = async (mutation: OutboxMutation, notice: (notice: Notice) => void) => {
  if (mutation.operation === 'create') {
    const remote = await createRemote(mutation, mutation.snapshot);
    const remoteFavicon = mutation.collection === 'bookmarks' ? faviconUrl(remote as RemoteBookmark) : undefined;
    if (mutation.collection === 'bookmarks' && (mutation.snapshot as LocalBookmark).favicon?.startsWith('data:') && (!remoteFavicon || remoteFavicon.startsWith('data:'))) {
      throw new Error('PocketBase did not store the bookmark icon as a file.');
    }
    await db.transaction('rw', db.bookmarks, db.tags, db.outbox, async () => {
      if (mutation.collection === 'bookmarks') await db.bookmarks.update(mutation.entityId, { remoteId: remote.id, favicon: remoteFavicon ?? (mutation.snapshot as LocalBookmark).favicon, updatedAt: remote.updated });
      else await db.tags.update(mutation.entityId, { remoteId: remote.id, updatedAt: remote.updated });
      await db.outbox.delete(mutation.id);
    });
    return;
  }
  let remote: RemoteBookmark | RemoteTag;
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
    ? await bookmarkFormData(mutation.snapshot as LocalBookmark, await remoteTagIds((mutation.snapshot as LocalBookmark).tagIds))
    : { name: (mutation.snapshot as LocalTag).name });
  const remoteFavicon = mutation.collection === 'bookmarks' && updatedRemote ? faviconUrl(updatedRemote as RemoteBookmark) : undefined;
  if (mutation.collection === 'bookmarks' && (mutation.snapshot as LocalBookmark).favicon?.startsWith('data:') && (!remoteFavicon || remoteFavicon.startsWith('data:'))) {
    throw new Error('PocketBase did not store the bookmark icon as a file.');
  }
  await db.transaction('rw', db.bookmarks, db.tags, db.outbox, async () => {
    if (mutation.collection === 'bookmarks') {
      if (mutation.operation === 'delete') await db.bookmarks.delete(mutation.entityId);
      else await db.bookmarks.update(mutation.entityId, { favicon: remoteFavicon ?? (mutation.snapshot as LocalBookmark).favicon, updatedAt: updatedRemote?.updated ?? remote.updated });
    } else {
      if (mutation.operation === 'delete') await db.tags.delete(mutation.entityId);
      else await db.tags.update(mutation.entityId, { updatedAt: updatedRemote?.updated ?? remote.updated });
    }
    await db.outbox.delete(mutation.id);
  });
};

const pull = async () => {
  const uid = userId();
  const [remoteBookmarks, remoteTags, pending] = await Promise.all([
    pb.collection<RemoteBookmark>('bookmarks').getFullList({ filter: `user = "${uid}"` }),
    pb.collection<RemoteTag>('tags').getFullList({ filter: `user = "${uid}"` }),
    db.outbox.toArray(),
  ]);
  const pendingRemoteIds = new Set(pending.map((item) => item.remoteId).filter((id): id is string => Boolean(id)));
  for (const remote of remoteTags) {
    if (pendingRemoteIds.has(remote.id)) continue;
    const local = await localByRemote('tags', remote.id);
    if (local) await db.tags.update(local.id, { name: remote.name, updatedAt: remote.updated });
    else await db.tags.put({ id: remote.id, remoteId: remote.id, name: remote.name, createdAt: remote.created, updatedAt: remote.updated });
  }
  for (const remote of remoteBookmarks) {
    if (pendingRemoteIds.has(remote.id)) continue;
    const tagIds: string[] = [];
    for (const remoteTagId of remote.tags ?? []) {
      const tag = await localByRemote('tags', remoteTagId);
      if (tag) tagIds.push(tag.id);
    }
    const local = await localByRemote('bookmarks', remote.id);
    const existingFavicon = local && 'favicon' in local ? local.favicon : undefined;
    const favicon = faviconUrl(remote);
    const value = { title: remote.title, link: remote.link, favicon: favicon ?? existingFavicon, order: remote.order, tagIds, updatedAt: remote.updated };
    if (local) await db.bookmarks.update(local.id, value);
    else await db.bookmarks.put({ id: remote.id, remoteId: remote.id, ...value });
  }
  const remoteTagIdSet = new Set(remoteTags.map((tag) => tag.id));
  for (const local of await db.tags.toArray()) {
    if (!local.remoteId || pendingRemoteIds.has(local.remoteId) || remoteTagIdSet.has(local.remoteId)) continue;
    await db.transaction('rw', db.tags, db.bookmarks, async () => {
      await db.bookmarks.where('tagIds').equals(local.id).modify((bookmark) => {
        bookmark.tagIds = bookmark.tagIds.filter((tagId) => tagId !== local.id);
      });
      await db.tags.delete(local.id);
    });
  }
  const remoteBookmarkIds = new Set(remoteBookmarks.map((bookmark) => bookmark.id));
  for (const local of await db.bookmarks.toArray()) {
    if (local.remoteId && !pendingRemoteIds.has(local.remoteId) && !remoteBookmarkIds.has(local.remoteId)) await db.bookmarks.delete(local.id);
  }
  return { pulled: remoteBookmarks.length + remoteTags.length };
};

let activeSync: Promise<SyncCounts> | undefined;
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
const runWorker = async (): Promise<SyncCounts> => {
  if (!pb.authStore.isValid) {
    if (pb.authStore.record) pb.authStore.clear();
    return { bookmarks: await db.bookmarks.count(), tags: await db.tags.count(), pulled: 0, pushed: 0 };
  }
  let pushed = 0;
  const notices: Notice[] = [];
  const mutations = await db.outbox.orderBy('createdAt').toArray();
  const orderedMutations = [
    ...mutations.filter((mutation) => mutation.collection === 'tags'),
    ...mutations.filter((mutation) => mutation.collection === 'bookmarks'),
  ];
  for (const mutation of orderedMutations) { await processMutation(mutation, (notice) => notices.push(notice)); pushed += 1; }
  const pulled = await pull();
  for (const notice of notices) window.dispatchEvent(new CustomEvent('sync-notice', { detail: notice }));
  return { bookmarks: await db.bookmarks.count(), tags: await db.tags.count(), pulled: pulled.pulled, pushed };
};
const syncNow = () => {
  activeSync ??= withTimeout(runWorker(), 15_000).finally(() => { activeSync = undefined; });
  return activeSync;
};

export { createBookmark, createTag, deleteBookmark, deleteTag, reloadFavicons, syncNow, updateBookmark, updateTag };
