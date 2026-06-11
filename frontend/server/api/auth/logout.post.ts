import { deleteCookie } from 'h3'

export default defineEventHandler((event) => {
  deleteCookie(event, 'job-tracker-auth')
  return { success: true }
})
