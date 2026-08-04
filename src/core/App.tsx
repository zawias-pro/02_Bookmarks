import { AuthForm } from '../auth/AuthForm.tsx';
import { BookmarkList } from '../bookmarks/BookmarkList.tsx';
import { Sidebar } from './Sidebar.tsx';
import { useAppStore } from '../store/appStore.ts';
import styles from './App.module.css'

const App = () => {
  const isAuthFormOpen = useAppStore((state) => state.isAuthFormOpen);

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
          <Sidebar />
      </div>
      <main className={styles.main}>
        <BookmarkList />
      </main>
      {isAuthFormOpen && <AuthForm />}
    </div>
  );
}

export { App };
