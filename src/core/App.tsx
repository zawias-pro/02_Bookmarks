import { useState } from 'react';
import { AuthForm } from '../auth/AuthForm.tsx';
import { BookmarkList } from '../bookmarks/BookmarkList.tsx';
import { Sidebar } from '../components/Sidebar.tsx';
import { pb } from '../persistence/pocketbase.ts';
import { useAppStore } from '../store/appStore.ts';
import styles from './App.module.css'

const App = () => {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const isAuthFormOpen = useAppStore((state) => state.isAuthFormOpen);

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <Sidebar
          selectedCategoryId={categoryId}
          onSelect={setCategoryId}
          syncEnabled={pb.authStore.isValid}
        />
      </div>
      <main className={styles.main}>
        <BookmarkList categoryId={categoryId}/>
      </main>
      {isAuthFormOpen && <AuthForm />}
    </div>
  );
}

export { App };
