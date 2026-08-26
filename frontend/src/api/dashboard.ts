import { apiRequest } from './client'
import type { DashboardSummary } from '@/types/dashboard'

export function getDashboardSummary(accessToken: string): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>('/dashboard/summary', accessToken)
}
