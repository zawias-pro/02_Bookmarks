export interface LocalBookmark {
  id: string;
  remoteId?: string;
  title: string;
  link: string;
  favicon?: string;
  order: number;
  tagIds: string[];
  updatedAt: string;
}

export interface LocalTag {
  id: string;
  remoteId?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface OutboxMutation {
  id: string;
  collection: 'bookmarks' | 'tags';
  operation: 'create' | 'update' | 'delete';
  entityId: string;
  remoteId?: string;
  baseRemoteUpdatedAt?: string;
  snapshot: LocalBookmark | LocalTag;
  createdAt: string;
}
