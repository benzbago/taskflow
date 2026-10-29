import { useState } from 'react'
import { Plus, Tags, Trash2 } from 'lucide-react'
import { useTaskFlow } from '../context/TaskFlowContext'
import { CATEGORY_ICONS } from '../data/defaults'

export default function CategoriesPage() {
  const { categories, tasks, addCategory, updateCategory, deleteCategory } =
    useTaskFlow()
  const [name, setName] = useState('')
  const colors = [
    '#4938d7',
    '#e02676',
    '#0ea5e9',
    '#22c55e',
    '#f59e0b',
    '#7c3aed',
  ]
  return (
    <>
      <div className="inline-create">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category name"
          aria-label="New category name"
        />
        <button
          className="primary-button"
          onClick={() => {
            if (name.trim()) {
              addCategory({
                name: name.trim(),
                color: colors[categories.length % colors.length],
                icon: 'other',
              })
              setName('')
            }
          }}
        >
          <Plus /> Add category
        </button>
      </div>
      <div className="category-grid">
        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.icon] || Tags
          return (
            <article className="category-card" key={category.id}>
              <span
                className="category-icon"
                style={{
                  background: `${category.color}18`,
                  color: category.color,
                }}
              >
                <Icon />
              </span>
              <div>
                <input
                  aria-label={`Category name ${category.name}`}
                  value={category.name}
                  onChange={(e) =>
                    updateCategory({ ...category, name: e.target.value })
                  }
                />
                <p>
                  {
                    tasks.filter((task) => task.categoryId === category.id)
                      .length
                  }{' '}
                  tasks
                </p>
              </div>
              {!category.locked && (
                <button
                  className="icon-button danger"
                  onClick={() =>
                    confirm(
                      `Delete ${category.name}? Its tasks will move to Other.`,
                    ) && deleteCategory(category.id)
                  }
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 />
                </button>
              )}
            </article>
          )
        })}
      </div>
    </>
  )
}
