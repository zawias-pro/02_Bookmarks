export interface LocalBookmark {
  id: string;
  remoteId?: string;
  title: string;
  link: string;
  favicon?: string;
  order: number;
  categoryId?: string;
  updatedAt: string;
}

export interface LocalCategory {
  id: string;
  remoteId?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboxMutation {
  id: string;
  collection: 'bookmarks' | 'categories';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  remoteId?: string;
  baseRemoteUpdatedAt?: string;
  snapshot: LocalBookmark | LocalCategory;
  createdAt: string;
}
