import { getCookie } from 'h3'

export default defineEventHandler((event) => {
  const authCookie = getCookie(event, 'job-tracker-auth')
  const config = useRuntimeConfig()
  
  if (!authCookie || authCookie !== Buffer.from(config.authPassword).toString('base64')) {
    return { authenticated: false }
  }
  
  return { authenticated: true }
})
