import {
  createBrowserRouter,
} from 'react-router-dom'

import {
  ProtectedRoute,
} from '@/auth/ProtectedRoute'
import {
  AppShell,
} from '@/components/layout/AppShell'
import {
  CalendarPage,
} from '@/pages/CalendarPage'
import {
  DashboardPage,
} from '@/pages/DashboardPage'
import {
  DocumentsPage,
} from '@/pages/DocumentsPage'
import {
  EmailIntelligencePage,
} from '@/pages/EmailIntelligencePage'
import {
  IntegrationsPage,
} from '@/pages/IntegrationsPage'
import {
  LandingPage,
} from '@/pages/LandingPage'
import {
  NotFoundPage,
} from '@/pages/NotFoundPage'
import {
  ProfilePage,
} from '@/pages/ProfilePage'
import {
  RagChatPage,
} from '@/pages/RagChatPage'


export const router =
  createBrowserRouter([
    {
      path: '/',
      element: (
        <LandingPage />
      ),
    },

    {
      element: (
        <ProtectedRoute />
      ),

      children: [
        {
          path: '/app',

          element: (
            <AppShell />
          ),

          children: [
            {
              index: true,

              element: (
                <DashboardPage />
              ),
            },

            {
              path: 'documents',

              element: (
                <DocumentsPage />
              ),
            },

            {
              path: 'chat',

              element: (
                <RagChatPage />
              ),
            },

            {
              path: 'calendar',

              element: (
                <CalendarPage />
              ),
            },

            {
              path: 'email',

              element: (
                <EmailIntelligencePage />
              ),
            },

            {
              path: 'integrations',

              element: (
                <IntegrationsPage />
              ),
            },

            {
              path: 'profile',

              element: (
                <ProfilePage />
              ),
            },
          ],
        },
      ],
    },

    {
      path: '*',

      element: (
        <NotFoundPage />
      ),
    },
  ])