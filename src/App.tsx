import { useEffect, useState } from 'react';
import { Navbar } from './components/Navbar';
import { AuthForm } from './components/AuthForm';
import { BookmarkList } from './components/BookmarkList';
import { SchemaOverview } from './components/SchemaOverview';
import { checkPocketBaseHealth } from './lib/pocketbase';

export function App() {
  const [pbConnected, setPbConnected] = useState<boolean>(false);

  useEffect(() => {
    checkPocketBaseHealth().then((isHealthy) => {
      setPbConnected(isHealthy);
    });
  }, []);

  return (
    <div className="app-container">
      <Navbar pbConnected={pbConnected} />

      <main className="grid-layout">
        <AuthForm />
        <BookmarkList />
      </main>

      <SchemaOverview />
    </div>
  );
}

export default App;
