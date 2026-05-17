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
    
    if (query.remote === 'true') {
      jobs = jobs.filter(j => j.is_remote)
    }
    
    if (query.favorites === 'true') {
      jobs = jobs.filter(j => j.is_favorite)
    }
    
    if (query.hidden === 'false') {
      jobs = jobs.filter(j => !j.is_hidden)
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
