// A custom icon is never replaced by an automatic reload.
export type IconSource = 'auto' | 'custom';

export interface LocalBookmark {
  id: string;
  remoteId?: string;
  title: string;
  link: string;
  favicon?: string;
  iconSource?: IconSource;
  order: number;
  categoryId: string | null;
  updatedAt: string;
}

// A local cache of the synced icon library; its id is the remote record id.
export interface LocalIcon {
  id: string;
  name: string;
  dataUrl: string;
  updatedAt: string;
}

export interface LocalCategory {
  id: string;
  remoteId?: string;
  name: string;
  parentId: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  positions?: Record<string, number>;
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

// The uncategorized board is a real, hidden category record so it syncs like any other board.
// Its id is kept from the former untagged tag so existing remote rows need no rewrite.
const uncategorizedCategoryId = 'untaggedtag0000';
const uncategorizedCategoryName = '_uncategorized';

export { uncategorizedCategoryId, uncategorizedCategoryName };
