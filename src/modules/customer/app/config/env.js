const env = import.meta.env ?? {}

export const ENV = {
  API_BASE_URL: env.VITE_API_BASE_URL || 'http://66.116.246.58:8080',
  API_TIMEOUT: Number(env.VITE_API_TIMEOUT ?? 20000),
  APP_NAME: env.VITE_APP_NAME || 'MEDIQ',
  GOOGLE_CLIENT_ID: env.VITE_GOOGLE_CLIENT_ID || '',
  FACEBOOK_APP_ID: env.VITE_FACEBOOK_APP_ID || '',
  APPLE_CLIENT_ID: env.VITE_APPLE_CLIENT_ID || '',
  ENABLE_SOCIAL_LOGIN: String(env.VITE_ENABLE_SOCIAL_LOGIN ?? 'true') === 'true',
  IS_DEV: !!env.DEV,
}

export default ENV
