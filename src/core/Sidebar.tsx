import { AddCategoryForm } from '../categories/AddCategoryForm.tsx'
import { CategoriesList } from '../categories/CategoriesList.tsx'
import { SyncControls } from '../sync/SyncControls.tsx'
import { useAppStore } from '../store/appStore.ts'

const Sidebar = () => {
  const setCategoryFormOpen = useAppStore((state) => state.setCategoryFormOpen)

  return (
    <aside className="sidebar">
      <header className="navbar">
        <div className="brand">
          <h1 className="brand-title">02_Bookmarks</h1>
        </div>
        <SyncControls />
      </header>
      <h2 className="sidebar-title">Categories</h2>
      <CategoriesList />
      <button type="button" onClick={() => setCategoryFormOpen(true)}>Add category</button>
      <AddCategoryForm />
    </aside>
  )
}

export { Sidebar }
