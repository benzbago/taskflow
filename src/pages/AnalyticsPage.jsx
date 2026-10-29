import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useTaskFlow } from '../context/TaskFlowContext'
import { analyticsData } from '../utils/tasks'
import EmptyState from '../components/common/EmptyState'
import SectionHeader from '../components/common/SectionHeader'

export default function AnalyticsPage() {
  const { tasks, categories } = useTaskFlow()
  const series = analyticsData(tasks)
  const completed = tasks.filter((task) => task.completed).length
  const completion = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0
  const categoryData = categories
    .map((category) => ({
      name: category.name,
      value: tasks.filter(
        (task) => task.categoryId === category.id && task.completed,
      ).length,
      color: category.color,
    }))
    .filter((item) => item.value)
  return (
    <>
      <div className="metric-grid analytics-metrics">
        <article className="metric-card">
          <div>
            <p>Overall completion</p>
            <strong>{completion}%</strong>
          </div>
        </article>
        <article className="metric-card">
          <div>
            <p>Completed</p>
            <strong>{completed}</strong>
          </div>
        </article>
        <article className="metric-card">
          <div>
            <p>Still in motion</p>
            <strong>{tasks.length - completed}</strong>
          </div>
        </article>
      </div>
      <div className="chart-grid">
        <article className="chart-card">
          <SectionHeader
            title="Daily activity"
            subtitle="Tasks completed over the last 7 days"
          />
          {tasks.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={series}>
                <defs>
                  <linearGradient id="indigoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#6366f1"
                  fill="url(#indigoFill)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="Your insights will grow here"
              message="Complete a few tasks to see your weekly rhythm."
            />
          )}
        </article>
        <article className="chart-card">
          <SectionHeader
            title="By category"
            subtitle="Where your completed work lives"
          />
          {categoryData.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={62}
                  outerRadius={96}
                  paddingAngle={4}
                >
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              title="No category data yet"
              message="Completed tasks will reveal your focus areas."
            />
          )}
        </article>
      </div>
    </>
  )
}
