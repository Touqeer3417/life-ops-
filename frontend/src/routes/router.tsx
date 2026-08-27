import {
  createBrowserRouter,
} from 'react-router-dom'

import { ProtectedRoute } from '@/auth/ProtectedRoute'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/pages/DashboardPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RagChatPage } from '@/pages/RagChatPage'


export const router =
  createBrowserRouter([
    {
      path: '/',
      element: <LandingPage />,
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          path: '/app',
          element: <AppShell />,
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
      element: <NotFoundPage />,
    },
  ])