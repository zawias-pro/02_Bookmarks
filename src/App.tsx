import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { BookmarkList } from './components/BookmarkList';
import { checkPocketBaseHealth } from './lib/pocketbase';
import { useNetworkStatus } from './hooks/useNetworkStatus';

export function App() {
  const [pbConnected, setPbConnected] = useState<boolean>(false);
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    checkPocketBaseHealth().then((isHealthy) => {
      setPbConnected(isHealthy);
    });
  }, []);

  const readOnly = !isOnline;

  return (
    <div className="app-container">
      <Navbar pbConnected={pbConnected} isOnline={isOnline} />

      <main className="grid-layout">
        <AuthForm readOnly={readOnly} />
        <BookmarkList readOnly={readOnly} />
      </main>

    </div>
  );
}

export default App;
