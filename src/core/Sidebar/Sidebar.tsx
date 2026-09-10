import { AddCategoryForm } from '../../categories/AddCategoryForm.tsx'
import { CategoriesList } from '../../categories/CategoriesList/CategoriesList.tsx'
import { Button } from '../../components/Button/Button.tsx'
import { ThemeToggle } from '../../theming/ThemeToggle/ThemeToggle.tsx'
import { SyncButton } from '../../sync/SyncButton/SyncButton.tsx'
import { SyncModal } from '../../sync/SyncModal/SyncModal.tsx'
import { useAppStore } from '../../store/appStore.ts'
import styles from './Sidebar.module.css'

const Sidebar = () => {
  const setCategoryFormOpen = useAppStore((state) => state.setCategoryFormOpen)

  return (
    <aside className={styles.sidebar}>
      <header className={styles.navbar}>
        <h1 className={styles.brandTitle}>02_Bookmarks</h1>
        <div className={styles.actions}>
          <SyncButton />
          <ThemeToggle />
        </div>
      </header>
      <h2 className={styles.sidebarTitle}>Categories</h2>
      <CategoriesList />
      <Button onClick={() => setCategoryFormOpen(true)}>Add category</Button>
      <AddCategoryForm />
      <SyncModal />
    </aside>
  )
}

export { Sidebar }
