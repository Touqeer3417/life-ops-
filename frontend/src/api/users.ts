import { apiRequest } from './client'
import type {
  User,
  UserPreferences,
  UserPreferencesUpdateInput,
  UserUpdateInput,
} from '@/types/user'

export function getCurrentUser(accessToken: string): Promise<User> {
  return apiRequest<User>('/users/me', accessToken)
}

export function updateCurrentUser(accessToken: string, input: UserUpdateInput): Promise<User> {
  return apiRequest<User>('/users/me', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function updateUserPreferences(
  accessToken: string,
  input: UserPreferencesUpdateInput,
): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/users/preferences', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}
