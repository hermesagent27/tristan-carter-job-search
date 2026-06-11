import { getCookie } from 'h3'

export default defineEventHandler((event) => {
  const authCookie = getCookie(event, 'job-tracker-auth')
  const config = useRuntimeConfig()
  
  if (!authCookie || authCookie !== config.authPassword) {
    return { authenticated: false }
  }
  
  return { authenticated: true }
})
