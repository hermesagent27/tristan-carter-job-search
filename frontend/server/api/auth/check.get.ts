import { getCookie } from 'h3'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  // Check shared marketplace cookie first, then app-specific
  const sharedAuth = getCookie(event, 'app-auth')
  const appAuth = getCookie(event, 'job-tracker-auth')

  const authenticated = (sharedAuth && sharedAuth === config.authPassword) ||
                        (appAuth && appAuth === config.authPassword)

  return { authenticated: !!authenticated }
})
