import { useState } from 'react';
import { BookmarkList } from '../bookmarks/BookmarkList.tsx';
import { Sidebar } from '../components/Sidebar.tsx';
import styles from './App.module.css'

const App = () => {
  const [categoryId, setCategoryId] = useState<string | null>(null);

  return (
    <div className={styles.app}>
      <div className={styles.sidebar}>
        <Sidebar
          selectedCategoryId={categoryId}
          onSelect={setCategoryId}
        />
      </div>
      <main className={styles.main}>
        <BookmarkList categoryId={categoryId}/>
      </main>
    </div>
  );
}

export { App };
