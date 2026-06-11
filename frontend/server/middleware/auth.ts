// Server-side auth middleware - checks for valid session
import { getCookie, createError } from 'h3'

export default defineEventHandler((event) => {
  // Skip auth check for login endpoints
  const path = event.node.req.url
  if (path?.startsWith('/api/auth/') || path === '/login') {
    return
  }

  // Check for auth cookie
  const authCookie = getCookie(event, 'job-tracker-auth')
  const config = useRuntimeConfig()
  
  // Validate cookie matches password hash (simple check)
  const expectedHash = Buffer.from(config.authPassword).toString('base64')
  
  if (authCookie !== expectedHash) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
})
