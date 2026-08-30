import {
  useEffect,
  useState,
  type FormEvent,
} from 'react'
import {
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Bell,
  Check,
  Clock3,
  Globe2,
  Mail,
  Save,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from 'motion/react'

import { updateCurrentUser, updateUserPreferences } from '@/api/users'
import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { ErrorState } from '@/components/ui/ErrorState'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useCurrentUser } from '@/hooks/useCurrentUser'

const easeOut = [0.22, 1, 0.36, 1] as const

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.04,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOut,
    },
  },
}

const inputClassName =
  'mt-2.5 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] '
  + 'px-3.5 py-3 text-sm text-slate-100 outline-none transition duration-200 '
  + 'placeholder:text-slate-600 hover:border-white/[0.13] '
  + 'focus:border-cyan-300/30 focus:bg-white/[0.055] focus:ring-4 focus:ring-cyan-300/[0.06] '
  + 'disabled:cursor-not-allowed disabled:bg-white/[0.025] disabled:text-slate-500'

export function ProfilePage() {
  const currentUser = useCurrentUser()
  const { getAccessToken } = useAuth()
  const queryClient = useQueryClient()
  const shouldReduceMotion = useReducedMotion()

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

  if (currentUser.isLoading) {
    return <LoadingScreen label="Loading profile…" />
  }

  if (currentUser.isError) {
    return (
      <ErrorState
        message={currentUser.error.message}
        onRetry={() => void currentUser.refetch()}
      />
    )
  }

  if (!currentUser.data) {
    return null
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved(false)
    saveMutation.mutate()
  }

  const accountLabel =
    fullName.trim()
    || currentUser.data.full_name
    || currentUser.data.email

  const accountInitial =
    accountLabel.charAt(0).toUpperCase()

  return (
    <motion.div
      variants={containerVariants}
      initial={shouldReduceMotion ? false : 'hidden'}
      animate="visible"
      className="relative mx-auto w-full max-w-[1180px] overflow-hidden rounded-[30px] border border-white/[0.07] bg-[#05070b] px-4 py-5 text-white shadow-[0_34px_120px_-48px_rgba(2,6,23,0.95)] sm:px-6 sm:py-7 lg:px-8 lg:py-9"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_92%_10%,rgba(139,92,246,0.15),transparent_30%),linear-gradient(to_bottom,#05070b_0%,#070a11_58%,#05070b_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[460px] opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:58px_58px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-xl sm:p-7"
      >
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
        />

        <div className="relative grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-semibold text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Account settings
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl lg:text-[2.65rem]">
              Profile &
              <span className="ml-2 bg-gradient-to-r from-cyan-200 via-sky-300 to-violet-300 bg-clip-text text-transparent">
                preferences.
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px]">
              Manage the identity and workspace preferences LifeOps uses across your personal AI environment.
            </p>
          </div>

          <motion.div
            whileHover={shouldReduceMotion ? undefined : { y: -3 }}
            className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-3.5 backdrop-blur"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/15 to-violet-300/10 text-sm font-semibold text-cyan-100">
              {accountInitial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-100">
                {accountLabel}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500">
                {currentUser.data.email}
              </p>
            </div>
            <ShieldCheck className="ml-auto h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
          </motion.div>
        </div>
      </motion.section>

      <form className="relative mt-6 space-y-5" onSubmit={handleSubmit}>
        <motion.section
          variants={itemVariants}
          className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a0d13]/88 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.95)] backdrop-blur-xl"
        >
          <div className="border-b border-white/[0.07] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07] text-cyan-200">
                <UserRound className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Identity
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-white">
                  Profile
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-300">
                Full name
                <div className="relative">
                  <UserRound
                    className="pointer-events-none absolute left-3.5 top-[1.43rem] h-4 w-4 text-slate-600"
                    aria-hidden="true"
                  />
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    maxLength={200}
                    placeholder="Your name"
                    className={`${inputClassName} pl-10`}
                  />
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Email
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-3.5 top-[1.43rem] h-4 w-4 text-slate-600"
                    aria-hidden="true"
                  />
                  <input
                    value={currentUser.data.email}
                    disabled
                    className={`${inputClassName} pl-10`}
                  />
                </div>
              </label>
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" aria-hidden="true" />
              <p className="text-xs leading-5 text-slate-500">
                Your email comes from your authenticated account and is displayed here as read-only identity information.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={itemVariants}
          className="overflow-hidden rounded-[24px] border border-white/[0.08] bg-[#0a0d13]/88 shadow-[0_20px_60px_-44px_rgba(0,0,0,0.95)] backdrop-blur-xl"
        >
          <div className="border-b border-white/[0.07] p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-300/[0.07] text-violet-200">
                <Bell className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                  Workspace behavior
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-white">
                  Preferences
                </h2>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-300">
                Timezone
                <div className="relative">
                  <Clock3
                    className="pointer-events-none absolute left-3.5 top-[1.43rem] h-4 w-4 text-slate-600"
                    aria-hidden="true"
                  />
                  <input
                    value={timezone}
                    onChange={(event) => setTimezone(event.target.value)}
                    placeholder="Asia/Karachi"
                    required
                    maxLength={64}
                    className={`${inputClassName} pl-10`}
                  />
                </div>
                <span className="mt-2 block text-xs leading-5 text-slate-600">
                  Used when LifeOps interprets calendar times and date context.
                </span>
              </label>

              <label className="block text-sm font-medium text-slate-300">
                Locale
                <div className="relative">
                  <Globe2
                    className="pointer-events-none absolute left-3.5 top-[1.43rem] h-4 w-4 text-slate-600"
                    aria-hidden="true"
                  />
                  <input
                    value={locale}
                    onChange={(event) => setLocale(event.target.value)}
                    placeholder="en"
                    required
                    maxLength={16}
                    className={`${inputClassName} pl-10`}
                  />
                </div>
                <span className="mt-2 block text-xs leading-5 text-slate-600">
                  Stores your preferred locale for current and future LifeOps modules.
                </span>
              </label>
            </div>

            <motion.label
              whileHover={shouldReduceMotion ? undefined : { y: -2 }}
              className="mt-6 flex cursor-pointer items-center justify-between gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 transition hover:border-white/[0.12] hover:bg-white/[0.045] sm:p-5"
            >
              <div className="flex min-w-0 gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-300/10 bg-violet-300/[0.06] text-violet-200">
                  <Bell className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    Email notifications
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Stores your preference now; delivery is a later phase.
                  </p>
                </div>
              </div>

              <span className="relative inline-flex shrink-0 items-center">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="h-7 w-12 rounded-full border border-white/[0.10] bg-white/[0.07] transition peer-checked:border-cyan-300/25 peer-checked:bg-cyan-300/20 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[#0a0d13]" />
                <span className="absolute left-1 h-5 w-5 rounded-full bg-slate-400 shadow-sm transition-transform duration-200 peer-checked:translate-x-5 peer-checked:bg-cyan-100" />
              </span>
            </motion.label>
          </div>
        </motion.section>

        {saveMutation.isError ? (
          <motion.div
            variants={itemVariants}
          >
            <ErrorState message={saveMutation.error.message} />
          </motion.div>
        ) : null}

        <motion.div
          variants={itemVariants}
          className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-h-6">
            <AnimatePresence mode="wait" initial={false}>
              {saved ? (
                <motion.span
                  key="saved"
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 6 }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-emerald-200"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-300/10">
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  Saved successfully.
                </motion.span>
              ) : (
                <motion.span
                  key="hint"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-xs text-slate-500"
                >
                  Changes apply after you save this form.
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="min-h-11 bg-white px-5 text-slate-950 shadow-[0_10px_30px_rgba(255,255,255,0.08)] hover:bg-cyan-50 focus:ring-cyan-300"
          >
            <Save className="mr-2 h-4 w-4" aria-hidden="true" />
            {saveMutation.isPending ? 'Saving…' : 'Save changes'}
          </Button>
        </motion.div>
      </form>
    </motion.div>
  )
}
