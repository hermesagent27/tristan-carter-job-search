// Server-side auth middleware - checks for valid session
export default defineEventHandler((event) => {
  const url = event.path || event.node.req.url || ''
  
  // Skip auth check for auth API and login page
  if (url.startsWith('/api/auth/') || url === '/login' || url.startsWith('/login?')) {
    return
  }

  // Check for auth cookie
  const authCookie = getCookie(event, 'job-tracker-auth')
  const config = useRuntimeConfig()
  const password = config.authPassword
  
  // Skip if no password configured
  if (!password) return
  
  // Validate cookie matches password
  if (authCookie !== password) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
})
