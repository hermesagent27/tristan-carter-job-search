import { getAllJobs, updateJobViaGitHub, getFile } from '../../utils/github'
import { generateCoverLetter } from '../../utils/cover-letter'

interface JobImportRequest {
  url: string
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<JobImportRequest>(event)
    const { url } = body
    
    if (!url || !url.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: 'URL is required'
      })
    }
    
    // Validate URL
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url.trim())
    } catch {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid URL format'
      })
    }
    
    // Check if job already exists
    const existingJobs = await getAllJobs()
    const exists = existingJobs.find(j => j.url === url.trim())
    if (exists) {
      return {
        success: false,
        error: 'Job already exists in tracker',
        job: exists
      }
    }
    
    // Generate job ID from URL
    const urlStr = url.trim()
    let jobId: string
    let source: string
    
    if (urlStr.includes('linkedin.com')) {
      const match = urlStr.match(/\/jobs\/view\/(\d+)/)
      const id = match ? match[1] : Date.now().toString()
      jobId = `linkedin-${id.slice(-8)}`
      source = 'linkedin'
    } else if (urlStr.includes('indeed.com')) {
      const match = urlStr.match(/[?&]jk=([a-f0-9]+)/)
      const id = match ? match[1].slice(0, 16) : Date.now().toString()
      jobId = `indeed-${id}`
      source = 'indeed'
    } else {
      // Generic ID for other sources
      const hash = urlStr.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0).toString(36).slice(-8)
      jobId = `manual-${hash}`
      source = parsedUrl.hostname.replace(/^www\./, '').split('.')[0]
    }
    
    // Create new job entry
    const today = new Date().toISOString().split('T')[0]
    const newJob = {
      id: jobId,
      title: 'New Job',
      company: 'Unknown',
      location: 'Unknown',
      is_remote: false,
      url: urlStr,
      source: source,
      date_posted: today,
      date_scraped: new Date().toISOString(),
      tags: [],
      is_favorite: false,
      status: 'new' as const,
      role_type: 'unknown' as const,
      description: '',
      description_short: ''
    }
    
    // Try to fetch job details (best effort)
    try {
      const response = await $fetch(urlStr, { 
        headers: { 'User-Agent': 'Mozilla/5.0' },
        parseResponse: (txt) => txt // Get raw text
      }).catch(() => null)
      
      if (typeof response === 'string') {
        // Extract title from HTML
        const titleMatch = response.match(/<title>([^<]*)<\/title>/i)
        if (titleMatch) {
          const title = titleMatch[1].trim()
          // Parse LinkedIn format: "Title - Company | LinkedIn"
          if (title.includes(' | LinkedIn')) {
            const clean = title.replace(' | LinkedIn', '')
            const parts = clean.split(' - ')
            if (parts.length >= 2) {
              newJob.title = parts[0].trim()
              newJob.company = parts[1].trim()
            } else {
              newJob.title = clean
            }
          } else if (title.includes(' | Indeed')) {
            const clean = title.replace(' | Indeed', '')
            newJob.title = clean
          } else {
            newJob.title = title.slice(0, 100)
          }
        }
        
        // Check for remote
        if (response.toLowerCase().includes('remote')) {
          newJob.is_remote = true
        }
        
        // Detect role type
        const content = response.toLowerCase()
        if (content.includes('frontend') || content.includes('front-end') || content.includes('vue') || content.includes('react')) {
          newJob.role_type = 'frontend'
        } else if (content.includes('fullstack') || content.includes('full-stack')) {
          newJob.role_type = 'fullstack'
        } else if (content.includes('backend') || content.includes('node') || content.includes('python')) {
          newJob.role_type = 'backend'
        } else if (content.includes('support') || content.includes('help desk')) {
          newJob.role_type = 'support'
        }
      }
    } catch (fetchError) {
      console.log('Could not fetch job details, using defaults')
    }
    
    // Find today's file to add to
    const filePath = `data/jobs/${today.slice(0, 7)}/${today}.json`
    
    // Try to get existing file
    let jobs: any[] = []
    try {
      const existing = await getFile(filePath)
      if (Array.isArray(existing)) {
        jobs = existing
      }
    } catch {
      // File doesn't exist yet, start fresh
    }
    
    // Add new job
    jobs.push(newJob)
    
    // Write back to GitHub
    const { writeFile } = await import('../../utils/github-writer')
    const success = await writeFile(
      filePath,
      jobs,
      `Add job ${jobId} from ${source}`
    )
    
    if (!success) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to save job to GitHub'
      })
    }
    
    return {
      success: true,
      job: newJob
    }
    
  } catch (error: any) {
    console.error('Error importing job:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Failed to import job'
    })
  }
})
