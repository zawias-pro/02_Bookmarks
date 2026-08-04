import { AddCategoryForm } from './AddCategoryForm.tsx'
import { CategoriesList } from './CategoriesList.tsx'
import { SyncControls } from './SyncControls.tsx'

const Sidebar = ({ syncEnabled }: { syncEnabled: boolean }) => {
  return (
    <aside className="sidebar">
      <header className="navbar">
        <div className="brand">
          <h1 className="brand-title">Start Five</h1>
        </div>
        <SyncControls syncEnabled={syncEnabled} />
      </header>
      <h2 className="sidebar-title">Categories</h2>
      <CategoriesList />
      <AddCategoryForm />
    </aside>
  )
}

export { Sidebar }
