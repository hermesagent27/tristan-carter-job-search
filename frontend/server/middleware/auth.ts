// Unified auth middleware - accepts shared app-auth cookie from marketplace
// or app-specific job-tracker-auth cookie from direct login
import { getCookie, createError } from 'h3'

export default defineEventHandler((event) => {
  const path = event.path || event.node.req.url || ''

  // Skip auth endpoints and login page
  if (path.startsWith('/api/auth/') || path === '/login') return

  const config = useRuntimeConfig()

  // Check shared marketplace cookie first, then app-specific cookie
  const sharedAuth = getCookie(event, 'app-auth')
  const appAuth = getCookie(event, 'job-tracker-auth')

  const validShared = sharedAuth && sharedAuth === config.authPassword
  const validApp = appAuth && appAuth === config.authPassword

  if (!validShared && !validApp) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
})
