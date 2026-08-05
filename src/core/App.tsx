import { AuthForm } from '../auth/AuthForm.tsx';
import { BookmarkList } from '../bookmarks/BookmarkList/BookmarkList.tsx';
import { Sidebar } from './Sidebar.tsx';
import { useAppStore } from '../store/appStore.ts';
import { Toaster } from 'sonner';
import { CategoryHeader } from '../categories/CategoryHeader.tsx';
import styles from './App.module.css'

const App = () => {
  const isAuthFormOpen = useAppStore((state) => state.isAuthFormOpen);

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
          <Sidebar />
      </div>
      <main className={styles.main}>
        <CategoryHeader />
        <BookmarkList />
      </main>
      {isAuthFormOpen && <AuthForm />}
      <Toaster position="bottom-right" />
    </div>
  );
}

export { App };
