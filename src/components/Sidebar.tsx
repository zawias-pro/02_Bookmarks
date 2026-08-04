import { useEffect, useState, type FormEvent } from 'react';
import { createId, db, seedBookmarks } from '../lib/database';
import type { LocalCategory } from '../types/bookmark';
import { useNetworkStatus } from "../hooks/useNetworkStatus.ts";
import { pullBookmarks, pushBookmarks } from "../lib/sync.ts";
import { pb } from "../lib/pocketbase.ts";
import { AuthForm } from "./AuthForm.tsx";

const Sidebar = ({
  selectedCategoryId,
  onSelect,
}: {
  selectedCategoryId: string | null;
  onSelect: (categoryId: string | null) => void;
}) => {
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [name, setName] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [authKey, setAuthKey] = useState(0);
  const [authVisible, setAuthVisible] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(() => pb.authStore.isValid);
  const [syncMessage, setSyncMessage] = useState('');
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    void seedBookmarks().then(() => setRefreshKey((key) => key + 1));
  }, []);

  const sync = async (action: () => Promise<{ bookmarks: number; categories: number }>, verb: string) => {
    try {
      const counts = await action();
      setSyncMessage(`${verb} ${counts.bookmarks} bookmarks, ${counts.categories} categories`);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : 'Sync failed.');
    }
  };
  useEffect(() => {
    db.categories.orderBy('name').toArray().then(setCategories);
  }, [refreshKey]);

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || categories.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase())) return;

    await db.categories.add({ id: createId(), name: trimmedName, createdAt: new Date().toISOString() });
    setName('');
  };

  return (
    <>
      <aside className="sidebar">
        <header className="navbar">
          <div className="brand">
            <div>
              <h1 className="brand-title">Start Five</h1>
            </div>
          </div>
          <div className="badge-container">
            <button type="button" onClick={() => setAuthVisible(true)}>
              {syncEnabled ? 'Sync enabled' : 'Enable sync'}
            </button>
            {!isOnline && (
              <span className="badge badge-danger">
            Offline
          </span>
            )}
            <button type="button" onClick={() => void sync(pullBookmarks, 'Pulled')}
                    disabled={!isOnline || !syncEnabled}>Force pull
            </button>
            <button type="button" onClick={() => void sync(pushBookmarks, 'Pushed')}
                    disabled={!isOnline || !syncEnabled}>Force push
            </button>
            {syncMessage && <span className="badge">{syncMessage}</span>}
          </div>
        </header>
        <h2 className="sidebar-title">Categories</h2>
        <nav aria-label="Bookmark categories" className="category-list">
          <button className={selectedCategoryId === null ? 'category-option selected' : 'category-option'} type="button"
                  onClick={() => onSelect(null)}>
            Any category
          </button>
          {categories.map((category) => (
            <button className={selectedCategoryId === category.id ? 'category-option selected' : 'category-option'}
                    type="button" key={category.id} onClick={() => onSelect(category.id)}>
              {category.name}
            </button>
          ))}
        </nav>
        <form className="category-form" onSubmit={addCategory}>
          <label htmlFor="category-name">Add category</label>
          <input id="category-name" value={name} onChange={(event) => setName(event.target.value)}
                 placeholder="Category name"/>
          <button type="submit">Add</button>
        </form>
      </aside>
      {authVisible && (
        <AuthForm
          key={authKey}
          onClose={() => setAuthVisible(false)}
          onAuthChange={() => {
            setAuthKey((key) => key + 1);
            setSyncEnabled(pb.authStore.isValid);
            setSyncMessage('');
          }}
        />
      )}
    </>
  );
};

export { Sidebar };
