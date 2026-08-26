import {
  Auth0Provider,
  useAuth0,
  type User as Auth0User,
} from '@auth0/auth0-react'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type PropsWithChildren,
} from 'react'

import { env } from '@/utils/env'

interface AuthContextValue {
  isAuthenticated: boolean
  isLoading: boolean
  identity: Auth0User | undefined
  login: () => Promise<void>
  signup: () => Promise<void>
  logout: () => Promise<void>
  getAccessToken: () => Promise<string>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function AuthBridge({ children }: PropsWithChildren) {
  const {
    isAuthenticated,
    isLoading,
    user,
    error,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0()

  useEffect(() => {
    if (error) {
      console.error('AUTH0 ERROR:', error)
    }
  }, [error])

  const login = useCallback(async () => {
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: env.auth0Audience,
        scope: 'openid profile email',
      },
    })
  }, [loginWithRedirect])

  const signup = useCallback(async () => {
    await loginWithRedirect({
      authorizationParams: {
        redirect_uri: window.location.origin,
        audience: env.auth0Audience,
        scope: 'openid profile email',
        screen_hint: 'signup',
      },
    })
  }, [loginWithRedirect])

  const logout = useCallback(async () => {
    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    })
  }, [auth0Logout])

  const getAccessToken = useCallback(async () => {
    return getAccessTokenSilently({
      authorizationParams: {
        audience: env.auth0Audience,
      },
    })
  }, [getAccessTokenSilently])

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated,
      isLoading,
      identity: user,
      login,
      signup,
      logout,
      getAccessToken,
    }),
    [
      isAuthenticated,
      isLoading,
      user,
      login,
      signup,
      logout,
      getAccessToken,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function LifeOpsAuthProvider({
  children,
}: PropsWithChildren) {
  return (
    <Auth0Provider
      domain={env.auth0Domain}
      clientId={env.auth0ClientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: env.auth0Audience,
        scope: 'openid profile email',
      }}
      cacheLocation="memory"
    >
      <AuthBridge>{children}</AuthBridge>
    </Auth0Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside LifeOpsAuthProvider',
    )
  }

  return context
}