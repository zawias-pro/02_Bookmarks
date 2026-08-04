import React from 'react';
import type { BookmarkRecord } from '../types/pocketbase';

interface BookmarkListProps {
  readOnly: boolean;
}

const SAMPLE_BOOKMARKS: BookmarkRecord[] = [
  {
    id: 'rec_sample_01',
    created: '2026-08-03T12:00:00Z',
    updated: '2026-08-03T12:00:00Z',
    collectionId: 'bookmarks_coll_01',
    collectionName: 'bookmarks',
    title: 'PocketBase Documentation',
    link: 'https://pocketbase.io/docs',
    favicon: '⚡',
    order: 1,
    user: 'user_rec_01',
  },
  {
    id: 'rec_sample_02',
    created: '2026-08-03T12:05:00Z',
    updated: '2026-08-03T12:05:00Z',
    collectionId: 'bookmarks_coll_01',
    collectionName: 'bookmarks',
    title: 'React Documentation',
    link: 'https://react.dev',
    favicon: '⚛️',
    order: 2,
    user: 'user_rec_01',
  },
  {
    id: 'rec_sample_03',
    created: '2026-08-03T12:10:00Z',
    updated: '2026-08-03T12:10:00Z',
    collectionId: 'bookmarks_coll_01',
    collectionName: 'bookmarks',
    title: 'Vite Guide',
    link: 'https://vitejs.dev',
    favicon: '⚡',
    order: 3,
    user: 'user_rec_01',
  },
];

export const BookmarkList: React.FC<BookmarkListProps> = ({ readOnly }) => {
  return (
    <div className="card">
      <h2 className="card-title">🔖 Bookmarks Collection Scaffold</h2>
      {readOnly && (
        <div className="offline-banner">
          Offline &mdash; bookmarks are read-only
        </div>
      )}
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
        Sample rendering of records conforming to the PocketBase schema.
      </p>

      <div className="bookmark-list">
        {SAMPLE_BOOKMARKS.map((bookmark) => (
          <div className="bookmark-item" key={bookmark.id}>
            <div className="bookmark-info">
              <div className="favicon-icon">
                {bookmark.favicon || '🌐'}
              </div>
              <div className="bookmark-details">
                <span className="bookmark-title">{bookmark.title}</span>
                <a
                  href={bookmark.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bookmark-link"
                >
                  {bookmark.link}
                </a>
              </div>
            </div>
            <span className="order-tag">Order: #{bookmark.order}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
