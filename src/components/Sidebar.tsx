import { useEffect, useState, type FormEvent } from 'react';
import { createId, db } from '../lib/database';
import type { LocalCategory } from '../types/bookmark';

const Sidebar = ({ selectedCategoryId, refreshKey, onSelect, onChange }: { selectedCategoryId: string | null; refreshKey: number; onSelect: (categoryId: string | null) => void; onChange: () => void }) => {
  const [categories, setCategories] = useState<LocalCategory[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    db.categories.orderBy('name').toArray().then(setCategories);
  }, [refreshKey]);

  const addCategory = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || categories.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase())) return;

    await db.categories.add({ id: createId(), name: trimmedName, createdAt: new Date().toISOString() });
    setName('');
    onChange();
  };

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Categories</h2>
      <nav aria-label="Bookmark categories" className="category-list">
        <button className={selectedCategoryId === null ? 'category-option selected' : 'category-option'} type="button" onClick={() => onSelect(null)}>
          Any category
        </button>
        {categories.map((category) => (
          <button className={selectedCategoryId === category.id ? 'category-option selected' : 'category-option'} type="button" key={category.id} onClick={() => onSelect(category.id)}>
            {category.name}
          </button>
        ))}
      </nav>
      <form className="category-form" onSubmit={addCategory}>
        <label htmlFor="category-name">Add category</label>
        <input id="category-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" />
        <button type="submit">Add</button>
      </form>
    </aside>
  );
};

export { Sidebar };
