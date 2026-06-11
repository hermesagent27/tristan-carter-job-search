// Client-side auth middleware - redirects to login if not authenticated
export default defineNuxtRouteMiddleware(async (to) => {
  // Skip auth check for login page
  if (to.path === '/login') {
    return
  }
  
  try {
    const { authenticated } = await $fetch('/api/auth/check')
    if (!authenticated) {
      return navigateTo('/login')
    }
  } catch {
    return navigateTo('/login')
  }
})
