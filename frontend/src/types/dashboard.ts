import type { User } from './user'

export interface FoundationStatus {
  api: 'online'
  database: 'connected'
  authentication: 'active'
}

export interface ModuleStatus {
  name: string
  phase: number
  status: 'planned'
}

export interface DashboardSummary {
  user: User
  foundation: FoundationStatus
  generated_at: string
  upcoming_modules: ModuleStatus[]
}
