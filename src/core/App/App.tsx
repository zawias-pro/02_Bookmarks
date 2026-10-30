import { useEffect } from 'react';
import { AuthForm } from '../../auth/AuthForm.tsx';
import { useAuthValidation } from '../../auth/useAuthValidation.ts';
import { BookmarkList } from '../../bookmarks/BookmarkList/BookmarkList.tsx';
import { isMobileLayout } from '../layout.ts';
import { Sidebar } from '../Sidebar/Sidebar.tsx';
import { applyTheme } from '../../theming/theme.ts';
import { useAppStore } from '../../store/appStore.ts';
import { Toaster } from 'sonner';
import { CategoryHeader } from '../../categories/CategoryHeader/CategoryHeader.tsx';
import { useRealtimeSync } from '../../sync/useRealtimeSync.ts';
import { ensureUncategorizedCategory } from '../../sync/sync.ts';
import styles from './App.module.css'

const App = () => {
  const isAuthFormOpen = useAppStore((state) => state.isAuthFormOpen);
  const theme = useAppStore((state) => state.theme);
  const isSidebarOpen = useAppStore((state) => state.isSidebarOpen);
  const selectedCategoryId = useAppStore((state) => state.selectedCategoryId);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  useAuthValidation();
  useRealtimeSync();

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    void ensureUncategorizedCategory();
  }, []);

  // The mobile drawer covers the board, so picking a category dismisses it.
  useEffect(() => {
    if (isMobileLayout() && useAppStore.getState().isSidebarOpen) setSidebarOpen(false);
  }, [selectedCategoryId, setSidebarOpen]);

  return (
    <div className={styles.app} data-sidebar-open={String(isSidebarOpen)}>
      <div className={styles.sidebar}>
          <Sidebar />
      </div>
      {isSidebarOpen && <div className={styles.backdrop} onClick={() => setSidebarOpen(false)} />}
      <main className={styles.main}>
        <CategoryHeader />
        <BookmarkList />
      </main>
      {isAuthFormOpen && <AuthForm />}
      <Toaster position="bottom-right" theme={theme} />
    </div>
  );
}

export { App };
