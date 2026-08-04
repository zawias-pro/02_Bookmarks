import type { RecordModel } from 'pocketbase';

export interface UserRecord extends RecordModel {
  username: string;
  email: string;
  emailVisibility: boolean;
  verified: boolean;
  name?: string;
  avatar?: string;
}

export interface BookmarkRecord extends RecordModel {
  link: string;
  title: string;
  favicon?: string;
  order: number;
  user: string;
}
