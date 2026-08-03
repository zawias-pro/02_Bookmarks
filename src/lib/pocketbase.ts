import PocketBase from 'pocketbase';
import type { BookmarkRecord, UserRecord } from '../types/pocketbase';

export const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Singleton instance of PocketBase SDK
export const pb = new PocketBase(POCKETBASE_URL);

// Helper collection shortcuts with TypeScript typing
export const collections = {
  bookmarks: () => pb.collection<BookmarkRecord>('bookmarks'),
  users: () => pb.collection<UserRecord>('users'),
};

/**
 * Check PocketBase health / connectivity status
 */
export async function checkPocketBaseHealth(): Promise<boolean> {
  try {
    const health = await pb.health.check();
    return health.code === 200;
  } catch {
    return false;
  }
}
