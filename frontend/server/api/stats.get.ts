export default defineEventHandler(async (event) => {
  try {
    const jobs = await getAllJobs()
    
    // Calculate counts
    const totalJobs = jobs.length
    const totalNew = jobs.filter(j => j.status === 'new').length
    const totalApplied = jobs.filter(j => j.status === 'applied').length
    const totalInterview = jobs.filter(j => j.status === 'interview').length
    const totalOffer = jobs.filter(j => j.status === 'offer').length
    const totalDeleted = jobs.filter(j => j.status === 'deleted').length
    const totalFavorites = jobs.filter(j => j.is_favorite).length
    
    // Role distribution
    const roleDistribution: Record<string, number> = {}
    for (const job of jobs) {
      const role = job.role_type || 'other'
      roleDistribution[role] = (roleDistribution[role] || 0) + 1
    }
    
    // Jobs by source
    const sourceDistribution: Record<string, number> = {}
    for (const job of jobs) {
      const source = job.source || 'Unknown'
      sourceDistribution[source] = (sourceDistribution[source] || 0) + 1
    }
    
    // Salary stats (for jobs with salary data)
    const jobsWithSalary = jobs.filter(j => j.salary_min || j.salary_max)
    const salaryData = jobsWithSalary.map(j => ({
      min: j.salary_min || 0,
      max: j.salary_max || 0,
      avg: j.salary_min && j.salary_max ? (j.salary_min + j.salary_max) / 2 : (j.salary_max || j.salary_min || 0)
    }))
    
    const avgSalary = salaryData.length > 0 
      ? Math.round(salaryData.reduce((sum, s) => sum + s.avg, 0) / salaryData.length)
      : 0
    
    const minSalary = salaryData.length > 0
      ? Math.min(...salaryData.map(s => s.min || s.avg))
      : 0
      
    const maxSalary = salaryData.length > 0
      ? Math.max(...salaryData.map(s => s.max || s.avg))
      : 0
    
    // Time-based data (last 30 days)
    const today = new Date()
    const timeSeriesData: { date: string; new: number; applied: number; interview: number; offer: number }[] = []
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().split('T')[0]
      
      const counts = { date: dateStr, new: 0, applied: 0, interview: 0, offer: 0 }
      
      for (const job of jobs) {
        const jobDate = job.date_scraped || job.date_posted
        if (jobDate && jobDate.startsWith(dateStr)) {
          if (job.status === 'new') counts.new++
          else if (job.status === 'applied') counts.applied++
          else if (job.status === 'interview') counts.interview++
          else if (job.status === 'offer') counts.offer++
        }
      }
      
      timeSeriesData.push(counts)
    }
    
    // Weekly summary (last 4 weeks)
    const weeklyData: { week: string; applied: number; interview: number; offer: number }[] = []
    const weeks = ['This Week', 'Last Week', '2 Weeks Ago', '3 Weeks Ago']
    
    for (let i = 0; i < 4; i++) {
      const weekEnd = new Date(today)
      weekEnd.setDate(weekEnd.getDate() - (i * 7))
      const weekStart = new Date(weekEnd)
      weekStart.setDate(weekStart.getDate() - 7)
      
      const weekCounts = { week: weeks[i], applied: 0, interview: 0, offer: 0 }
      
      for (const job of jobs) {
        const jobDateStr = job.date_scraped || job.date_posted
        if (jobDateStr) {
          const jobDate = new Date(jobDateStr)
          if (jobDate >= weekStart && jobDate <= weekEnd) {
            if (job.status === 'applied') weekCounts.applied++
            else if (job.status === 'interview') weekCounts.interview++
            else if (job.status === 'offer') weekCounts.offer++
          }
        }
      }
      
      weeklyData.push(weekCounts)
    }
    
    // Response rate (applied -> interview)
    const responseRate = totalApplied > 0 
      ? Math.round((totalInterview / totalApplied) * 100) 
      : 0
    
    // Conversion rate (interview -> offer)
    const conversionRate = totalInterview > 0
      ? Math.round((totalOffer / totalInterview) * 100)
      : 0
    
    return {
      success: true,
      stats: {
        totalJobs,
        totalNew,
        totalApplied,
        totalInterview,
        totalOffer,
        totalDeleted,
        totalFavorites,
        responseRate,
        conversionRate
      },
      distributions: {
        roles: roleDistribution,
        sources: sourceDistribution
      },
      salary: {
        avg: avgSalary,
        min: minSalary,
        max: maxSalary,
        count: jobsWithSalary.length
      },
      timeSeries: timeSeriesData,
      weekly: weeklyData,
      lastUpdated: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('Error in /api/stats:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch statistics'
    })
  }
})
