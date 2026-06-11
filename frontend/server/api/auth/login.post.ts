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

  // Set HTTP-only cookie with plain password (simpler matching)
  setCookie(event, 'job-tracker-auth', password, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  return { success: true }
})
