export interface LocalBookmark {
  id: string;
  remoteId?: string;
  title: string;
  link: string;
  favicon?: string;
  order: number;
  updatedAt: string;
}

export interface LocalProfile {
  id: string;
  email?: string;
  name?: string;
}

export type SyncStatus = 'local' | 'synced' | 'changed';
