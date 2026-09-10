import { useEffect } from 'react';
import { AuthForm } from '../../auth/AuthForm.tsx';
import { useAuthValidation } from '../../auth/useAuthValidation.ts';
import { BookmarkList } from '../../bookmarks/BookmarkList/BookmarkList.tsx';
import { Sidebar } from '../Sidebar/Sidebar.tsx';
import { applyTheme } from '../../theming/theme.ts';
import { useAppStore } from '../../store/appStore.ts';
import { Toaster } from 'sonner';
import { CategoryHeader } from '../../categories/CategoryHeader/CategoryHeader.tsx';
import { SyncControls } from '../../sync/SyncControls/SyncControls.tsx';
import styles from './App.module.css'

const App = () => {
  const isAuthFormOpen = useAppStore((state) => state.isAuthFormOpen);
  const theme = useAppStore((state) => state.theme);
  useAuthValidation();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
          <Sidebar />
      </div>
      <main className={styles.main}>
        <div className={styles.sync}>
          <SyncControls />
        </div>
        <CategoryHeader />
        <BookmarkList />
      </main>
      {isAuthFormOpen && <AuthForm />}
      <Toaster position="bottom-right" theme={theme} />
    </div>
  );
}

export { App };
