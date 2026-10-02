import { setCookie, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  const config = useRuntimeConfig()

  // Validate password server-side
  if (password !== config.authPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid password'
    })
  }

  // Set shared marketplace cookie (works across subdomains)
  setCookie(event, 'app-auth', password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    domain: process.env.COOKIE_DOMAIN || undefined,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })

  // Also set app-specific cookie for backward compatibility
  setCookie(event, 'job-tracker-auth', password, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return { success: true }
})
