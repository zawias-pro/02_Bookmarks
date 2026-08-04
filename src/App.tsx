import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { BookmarkList } from './components/BookmarkList';
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
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    void seedBookmarks().then(() => setRefreshKey((key) => key + 1));
  }, []);

  const sync = async (action: () => Promise<number>, verb: string) => {
    try {
      const count = await action();
      setSyncMessage(`${verb} ${count} bookmarks`);
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

      <main className="grid-layout">
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
        <BookmarkList refreshKey={refreshKey} />
      </main>

    </div>
  );
}

export { App };
