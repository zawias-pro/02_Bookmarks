import { useEffect, useState } from 'react';
import { Navbar } from '../components/Navbar.tsx';
import { AuthForm } from '../components/AuthForm.tsx';
import { BookmarkList } from '../components/BookmarkList.tsx';
import { Sidebar } from '../components/Sidebar.tsx';
import { useNetworkStatus } from '../hooks/useNetworkStatus.ts';
import { pullBookmarks, pushBookmarks } from '../lib/sync.ts';
import { seedBookmarks } from '../lib/database.ts';
import { pb } from '../lib/pocketbase.ts';
import styles from './App.module.css'

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
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <Navbar
          isOnline={isOnline}
          syncEnabled={syncEnabled}
          onSyncAccountClick={() => setAuthVisible(true)}
          onPull={() => void sync(pullBookmarks, 'Pulled')}
          onPush={() => void sync(pushBookmarks, 'Pushed')}
          syncMessage={syncMessage}
        />
        <Sidebar
          selectedCategoryId={categoryId}
          refreshKey={categoryRefreshKey}
          onSelect={setCategoryId}
          onChange={() => setCategoryRefreshKey((key) => key + 1)}
        />
      </div>
      <main className={styles.main}>
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
        <BookmarkList refreshKey={refreshKey} categoryId={categoryId}/>
      </main>
    </div>
  );
}

export { App };
