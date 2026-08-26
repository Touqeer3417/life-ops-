function required(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required frontend environment variable: ${name}`)
  }
  return value
}

export const env = {
  apiUrl: required('VITE_API_URL').replace(/\/$/, ''),
  auth0Domain: required('VITE_AUTH0_DOMAIN').replace(/^https?:\/\//, '').replace(/\/$/, ''),
  auth0ClientId: required('VITE_AUTH0_CLIENT_ID'),
  auth0Audience: required('VITE_AUTH0_AUDIENCE'),
}
