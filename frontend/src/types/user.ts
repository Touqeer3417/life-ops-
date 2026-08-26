export interface UserPreferences {
  timezone: string
  locale: string
  email_notifications: boolean
}

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  is_email_verified: boolean
  created_at: string
  updated_at: string
  preferences: UserPreferences
}

export interface UserUpdateInput {
  full_name: string | null
}

export interface UserPreferencesUpdateInput {
  timezone?: string
  locale?: string
  email_notifications?: boolean
}
