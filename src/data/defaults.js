import {
  BriefcaseBusiness,
  Code2,
  Dumbbell,
  GraduationCap,
  Heart,
  Shapes,
} from 'lucide-react'

export const CATEGORY_ICONS = {
  heart: Heart,
  work: BriefcaseBusiness,
  code: Code2,
  learning: GraduationCap,
  health: Dumbbell,
  other: Shapes,
}

export const DEFAULT_CATEGORIES = [
  {
    id: 'personal',
    name: 'Personal',
    color: '#e02676',
    icon: 'heart',
    locked: true,
  },
  { id: 'work', name: 'Work', color: '#4938d7', icon: 'work', locked: true },
  {
    id: 'coding',
    name: 'Coding',
    color: '#7c3aed',
    icon: 'code',
    locked: true,
  },
  {
    id: 'learning',
    name: 'Learning',
    color: '#0ea5e9',
    icon: 'learning',
    locked: true,
  },
  {
    id: 'health',
    name: 'Health',
    color: '#22c55e',
    icon: 'health',
    locked: true,
  },
  { id: 'other', name: 'Other', color: '#6b7280', icon: 'other', locked: true },
]

export const EMPTY_FILTERS = {
  query: '',
  status: 'all',
  category: 'all',
  priority: 'all',
}
