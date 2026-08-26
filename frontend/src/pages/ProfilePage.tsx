import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, Save, UserRound } from 'lucide-react'
import { useAuth } from '@/auth/AuthProvider'
import { updateCurrentUser, updateUserPreferences } from '@/api/users'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function ProfilePage() {
  const currentUser = useCurrentUser()
  const { getAccessToken } = useAuth()
  const queryClient = useQueryClient()
  const [fullName, setFullName] = useState('')
  const [timezone, setTimezone] = useState('UTC')
  const [locale, setLocale] = useState('en')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (currentUser.data) {
      setFullName(currentUser.data.full_name ?? '')
      setTimezone(currentUser.data.preferences.timezone)
      setLocale(currentUser.data.preferences.locale)
      setEmailNotifications(currentUser.data.preferences.email_notifications)
    }
  }, [currentUser.data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getAccessToken()
      await updateCurrentUser(token, { full_name: fullName.trim() || null })
      await updateUserPreferences(token, {
        timezone: timezone.trim(),
        locale: locale.trim(),
        email_notifications: emailNotifications,
      })
    },
    onSuccess: async () => {
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: ['current-user'] })
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      window.setTimeout(() => setSaved(false), 2500)
    },
  })

  if (currentUser.isLoading) return <LoadingScreen label="Loading profile…" />
  if (currentUser.isError) {
    return <ErrorState message={currentUser.error.message} onRetry={() => void currentUser.refetch()} />
  }
  if (!currentUser.data) return null

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    saveMutation.mutate()
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div>
        <p className="text-sm font-semibold text-sky-700">Account settings</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Profile & preferences</h1>
        <p className="mt-3 text-slate-600">Manage the user information stored by the Phase 1 backend.</p>
      </div>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5"><UserRound className="h-5 w-5" /></div>
            <div><h2 className="font-bold">Profile</h2><p className="text-sm text-slate-500">Basic account identity</p></div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Full name
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                maxLength={200}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                value={currentUser.data.email}
                disabled
                className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-slate-500"
              />
            </label>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5"><Bell className="h-5 w-5" /></div>
            <div><h2 className="font-bold">Preferences</h2><p className="text-sm text-slate-500">Foundation settings used by later modules</p></div>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Timezone
              <input
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                placeholder="Asia/Karachi"
                required
                maxLength={64}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Locale
              <input
                value={locale}
                onChange={(event) => setLocale(event.target.value)}
                placeholder="en"
                required
                maxLength={16}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
              />
            </label>
          </div>
          <label className="mt-5 flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-slate-200 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900">Email notifications</p>
              <p className="mt-1 text-xs text-slate-500">Stores your preference now; delivery is a later phase.</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(event) => setEmailNotifications(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
          </label>
        </Card>

        {saveMutation.isError ? <ErrorState message={saveMutation.error.message} /> : null}
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
          {saved ? <span className="text-sm font-medium text-emerald-700">Saved successfully.</span> : null}
        </div>
      </form>
    </div>
  )
}
