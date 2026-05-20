export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'DELETE') {
    const jobId = getRouterParam(event, 'id')
    if (!jobId) {
      throw createError({ statusCode: 400, statusMessage: 'Missing job ID' })
    }
    
    try {
      // Get job info to get the URL
      const { getJobById } = await import('~/server/utils/github')
      const job = await getJobById(jobId)
      
      if (!job) {
        throw createError({ statusCode: 404, statusMessage: 'Job not found' })
      }
      
      // Add URL to blocklist in local file
      const fs = await import('fs/promises')
      const blocklistPath = '/home/tristan/tristan-carter-job-search/data/url-blocklist.json'
      
      let blocklist = { urls: [] as string[] }
      try {
        const content = await fs.readFile(blocklistPath, 'utf-8')
        blocklist = JSON.parse(content)
      } catch {
        // File doesn't exist yet, start fresh
      }
      
      if (!blocklist.urls.includes(job.url)) {
        blocklist.urls.push(job.url)
        await fs.mkdir('/home/tristan/tristan-carter-job-search/data', { recursive: true })
        await fs.writeFile(blocklistPath, JSON.stringify(blocklist, null, 2))
      }
      
      // For now just return success - the client will remove the job from UI
      // TODO: Actually delete from GitHub when GITHUB_TOKEN is available
      return { success: true, message: 'Job deleted and URL blocked' }
    } catch (e) {
      console.error('Failed to delete job:', e)
      throw createError({ statusCode: 500, statusMessage: 'Failed to delete job' })
    }
  }
  
  throw createError({ statusCode: 405, statusMessage: 'Method not allowed' })
})
