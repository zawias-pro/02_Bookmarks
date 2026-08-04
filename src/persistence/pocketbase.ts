import PocketBase from 'pocketbase';
import type { BookmarkRecord, UserRecord } from '../model/pocketbase.ts';

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Singleton instance of PocketBase SDK
const pb = new PocketBase(POCKETBASE_URL);

// Helper collection shortcuts with TypeScript typing
const collections = {
  bookmarks: () => pb.collection<BookmarkRecord>('bookmarks'),
  users: () => pb.collection<UserRecord>('users'),
};

export { POCKETBASE_URL, pb, collections };
