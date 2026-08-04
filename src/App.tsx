import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { BookmarkList } from './components/BookmarkList';
import { Sidebar } from './components/Sidebar';
import { useNetworkStatus } from './hooks/useNetworkStatus';
import { pullBookmarks, pushBookmarks } from './lib/sync';
import { seedBookmarks } from './lib/database';
import { pb } from './lib/pocketbase';

const App = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [authKey, setAuthKey] = useState(0);
  const [authVisible, setAuthVisible] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(() => pb.authStore.isValid);
  const [syncMessage, setSyncMessage] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categoryRefreshKey, setCategoryRefreshKey] = useState(0);
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

  return (
    <div className="app-container">
      <Navbar
        isOnline={isOnline}
        syncEnabled={syncEnabled}
        onSyncAccountClick={() => setAuthVisible(true)}
        onPull={() => void sync(pullBookmarks, 'Pulled')}
        onPush={() => void sync(pushBookmarks, 'Pushed')}
        syncMessage={syncMessage}
      />

      <main className="app-layout">
        <Sidebar
          selectedCategoryId={categoryId}
          refreshKey={categoryRefreshKey}
          onSelect={setCategoryId}
          onChange={() => setCategoryRefreshKey((key) => key + 1)}
        />
        <section className="content-area">
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
          <BookmarkList refreshKey={refreshKey} categoryId={categoryId} />
        </section>
      </main>

    </div>
  );
}

export { App };
