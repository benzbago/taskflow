# TaskFlow Design

TaskFlow is a personal, single-user productivity application for planning daily work, organizing tasks, and understanding completion habits without the overhead of accounts or cloud services.

It will use React and Vite with Tailwind CSS, Lucide icons, Recharts, Motion, and browser LocalStorage. The reducer/context boundary owns all state changes, a versioned storage adapter owns persistence and safe migration, and pure selector modules derive dashboard, calendar, and analytics data.

The visual language is based on the supplied reference: bright restrained surfaces, indigo primary actions, thin cool-gray borders, rounded cards, compact metadata, and selective orange/purple/pink semantic accents. Dark mode uses slate surfaces while retaining accessible indigo emphasis. Desktop uses a persistent sidebar and content canvas; compact screens use a top bar and bottom navigation. Task editing appears as a desktop slide-over and compact modal.

The application includes Dashboard, All Tasks, Today, Upcoming, Completed, Calendar, Categories, Analytics, Appearance, and Data Management. Tasks support priority, due date/time, notes, category, pinning, subtasks, daily/weekly recurrence, completion, duplication, search, sorting, and filtering. Analytics are always derived from stored task history. JSON import is validated before replacement, export is versioned, and clearing data requires confirmation.

There is no backend, authentication, cross-device synchronization, collaboration, notifications, or drag-and-drop scheduling in this version. The priority is a dependable, attractive daily tool rather than a complex project-management system.

The selected approach is a focused SPA with a centralized reducer. Alternatives considered were a component-local-state application, which would make cross-page state and persistence brittle, and a heavier state/data framework, which would add unnecessary complexity for a single-user LocalStorage product.
