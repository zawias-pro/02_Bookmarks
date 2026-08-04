import { useState } from 'react';
import { AuthForm } from '../auth/AuthForm.tsx';
import { BookmarkList } from '../bookmarks/BookmarkList.tsx';
import { Sidebar } from '../components/Sidebar.tsx';
import { pb } from '../persistence/pocketbase.ts';
import { useAppStore } from '../store/appStore.ts';
import styles from './App.module.css'

const App = () => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [authKey, setAuthKey] = useState(0);
  const [syncEnabled, setSyncEnabled] = useState(() => pb.authStore.isValid);
  const isAuthFormOpen = useAppStore((state) => state.isAuthFormOpen);
  const setAuthFormOpen = useAppStore((state) => state.setAuthFormOpen);

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
          <Sidebar
            selectedCategoryId={categoryId}
            onSelect={setCategoryId}
            syncEnabled={syncEnabled}
          />
      </div>
      <main className={styles.main}>
        <BookmarkList categoryId={categoryId}/>
      </main>
      {isAuthFormOpen && (
        <AuthForm
          key={authKey}
          onClose={() => setAuthFormOpen(false)}
          onAuthChange={() => {
            setAuthKey((key) => key + 1)
            setSyncEnabled(pb.authStore.isValid)
          }}
        />
      )}
    </div>
  );
}

export { App };
