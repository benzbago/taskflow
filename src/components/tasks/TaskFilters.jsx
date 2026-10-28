import { Search } from 'lucide-react'

export default function TaskFilters({
  filters,
  setFilters,
  sort,
  setSort,
  categories,
}) {
  return (
    <div className="filter-bar">
      <label className="search-field">
        <Search />
        <input
          type="search"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search tasks"
          aria-label="Search tasks"
        />
      </label>
      <select
        aria-label="Filter by status"
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
      >
        <option value="all">All statuses</option>
        <option value="pending">Pending</option>
        <option value="completed">Completed</option>
      </select>
      <select
        aria-label="Filter by priority"
        value={filters.priority}
        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
      >
        <option value="all">All priorities</option>
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <select
        aria-label="Filter by category"
        value={filters.category}
        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
      >
        <option value="all">All categories</option>
        {categories.map((category) => (
          <option value={category.id} key={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort tasks"
        value={sort}
        onChange={(e) => setSort(e.target.value)}
      >
        <option value="dueDate">Due date</option>
        <option value="priority">Priority</option>
        <option value="createdAt">Newest</option>
        <option value="status">Status</option>
      </select>
    </div>
  )
}
