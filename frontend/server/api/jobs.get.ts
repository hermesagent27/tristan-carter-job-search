export default defineEventHandler(async (event) => {
  try {
    // Get query parameters for filtering
    const query = getQuery(event)
    
    // Fetch all jobs from GitHub
    let jobs = await getAllJobs()
    
    // Apply filters from query params
    if (query.role) {
      const roles = String(query.role).split(',')
      jobs = jobs.filter(j => j.role_type && roles.includes(j.role_type))
    }
    
    // Filter: Only Remote or Oklahoma jobs (user preference - no relocation)
    jobs = jobs.filter(j => {
      const isRemote = j.is_remote || /\b(remote|anywhere|wfh|work from home)\b/i.test(j.location || '')
      const isOklahoma = /\boklahoma\b|\bok\b/i.test(j.location || '')
      return isRemote || isOklahoma
    })
    
    // Filter: Age limit - hide "new" jobs older than 90 days unless favorited (user still considering) or status changed
    const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000
    const now = Date.now()
    jobs = jobs.filter(j => {
      // Always show if:
      // - Not a "new" status (user interacted with it)
      // - Is favorited (user explicitly keeping it)
      if (j.status !== 'new') return true
      if (j.is_favorite) return true
      
      // For "new" jobs, check if within 90 days
      const postedDate = j.date_posted ? new Date(j.date_posted).getTime() : now
      const age = now - postedDate
      return age <= NINETY_DAYS_MS
    })
    
    if (query.favorites === 'true') {
      jobs = jobs.filter(j => j.is_favorite)
    }
    
    // Search filter
    if (query.search) {
      const q = String(query.search).toLowerCase()
      jobs = jobs.filter(j => 
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.tags?.some((tag: string) => tag.toLowerCase().includes(q))
      )
    }
    
    // Sort
    if (query.sort === 'date') {
      jobs.sort((a, b) => new Date(b.date_posted).getTime() - new Date(a.date_posted).getTime())
    } else if (query.sort === 'salary') {
      jobs.sort((a, b) => (b.salary_max || 0) - (a.salary_max || 0))
    }
    
    return {
      success: true,
      jobs,
      total: jobs.length,
      filters_applied: query
    }
    
  } catch (error) {
    console.error('Error in /api/jobs:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch jobs'
    })
  }
})
