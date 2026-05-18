import { $fetch } from 'ofetch'

const REPO = process.env.GITHUB_REPO || 'hermesagent27/tristan-carter-job-search'
const TOKEN = process.env.GITHUB_TOKEN
const API_URL = `https://api.github.com/repos/${REPO}`
const RAW_URL = `https://raw.githubusercontent.com/${REPO}/main`

interface Job {
  id: string
  title: string
  company: string
  location: string
  is_remote: boolean
  salary_min?: number
  salary_max?: number
  description_short?: string
  description?: string
  url: string
  source: string
  date_posted: string
  date_scraped: string
  tags: string[]
  role_type?: string
  is_favorite: boolean
  is_hidden: boolean
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

interface GitHubContent {
  name: string
  path: string
  sha: string
  size: number
  download_url: string | null
  type: string
}

// List files in a directory via GitHub API
async function listFiles(path: string): Promise<GitHubContent[]> {
  if (!TOKEN) {
    console.error('[GitHub] GITHUB_TOKEN not set')
    return []
  }

  const url = `${API_URL}/contents/${path}`
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const data = await $fetch(url, {
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JobTracker/1.0'
      }
    })
    cache.set(url, { data, timestamp: Date.now() })
    return data as GitHubContent[]
  } catch (e: any) {
    console.error(`[GitHub] Failed to list ${path}: ${e.message}`)
    return []
  }
}

// Get file content via GitHub API (handles large files)
async function getFile(path: string): Promise<any | null> {
  if (!TOKEN) {
    console.error('[GitHub] GITHUB_TOKEN not set')
    return null
  }

  const url = `${API_URL}/contents/${path}`
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const response = await $fetch(url, {
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'JobTracker/1.0'
      }
    }) as any

    // Decode base64 content
    if (response.content && response.encoding === 'base64') {
      const decoded = Buffer.from(response.content, 'base64').toString('utf-8')
      const data = JSON.parse(decoded)
      cache.set(url, { data, timestamp: Date.now() })
      return data
    }
    return null
  } catch (e: any) {
    console.error(`[GitHub] Failed to get ${path}: ${e.message}`)
    return null
  }
}

// Fetch all jobs from GitHub
export async function getAllJobs(): Promise<Job[]> {
  try {
    if (!TOKEN) {
      console.error('[Jobs] GITHUB_TOKEN not configured')
      // Fallback to raw URLs if no token
      return fetchJobsFromRawUrls()
    }

    const allJobs: Job[] = []
    
    // List monthly directories
    const months = await listFiles('data/jobs')
    console.log(`[Jobs] Found ${months.length} month directories`)
    
    for (const month of months) {
      if (month.type !== 'dir') continue
      
      // List daily files in each month
      const days = await listFiles(month.path)
      console.log(`[Jobs] Found ${days.length} day files in ${month.name}`)
      
      for (const dayFile of days) {
        if (!dayFile.name.endsWith('.json')) continue
        
        try {
          const jobs = await getFile(dayFile.path)
          if (Array.isArray(jobs)) {
            const normalized = jobs.map((j: any) => ({
              ...j,
              is_favorite: j.is_favorite ?? false,
              is_hidden: j.is_hidden ?? false,
              role_type: j.role_type || detectRoleType(j)
            }))
            allJobs.push(...normalized)
            console.log(`[Jobs] Loaded ${jobs.length} jobs from ${dayFile.name}`)
          }
        } catch (e: any) {
          console.error(`[Jobs] Failed to parse ${dayFile.name}: ${e.message}`)
        }
      }
    }
    
    console.log(`[Jobs] Total loaded: ${allJobs.length} jobs`)
    return allJobs
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
}

// Fallback: use raw URLs (may be blocked, but worth trying)
async function fetchJobsFromRawUrls(): Promise<Job[]> {
  console.log('[Jobs] Falling back to raw URLs')
  const months = ['2026-05']
  const allJobs: Job[] = []
  
  for (const month of months) {
    const days = ['2026-05-15', '2026-05-16', '2026-05-17']
    for (const day of days) {
      try {
        const url = `${RAW_URL}/data/jobs/${month}/${day}.json`
        const response = await $fetch(url, {
          headers: {
            'User-Agent': 'JobTracker/1.0',
            'Accept': 'application/json'
          }
        })
        if (Array.isArray(response)) {
          const normalized = response.map((j: any) => ({
            ...j,
            is_favorite: j.is_favorite ?? false,
            is_hidden: j.is_hidden ?? false,
            role_type: j.role_type || detectRoleType(j)
          }))
          allJobs.push(...normalized)
        }
      } catch (e: any) {
        console.error(`[Jobs] Raw URL failed for ${day}: ${e.message}`)
      }
    }
  }
  
  return allJobs
}

// Detect role type from tags/title if missing
function detectRoleType(job: any): string {
  const t = (job.title + ' ' + (job.tags?.join(' ') || '')).toLowerCase()
  if (t.includes('vue') || t.includes('nuxt') || t.includes('frontend') || t.includes('react')) return 'frontend'
  if (t.includes('fullstack') || t.includes('full-stack')) return 'fullstack'
  if (t.includes('backend') || t.includes('node') || t.includes('python')) return 'backend'
  if (t.includes('support') || t.includes('help desk') || t.includes('it support')) return 'support'
  return 'other'
}

// Get a single job by ID
export async function getJobById(id: string): Promise<Job | null> {
  const jobs = await getAllJobs()
  return jobs.find(j => j.id === id) || null
}

// For now, return empty applications array
export async function getApplications(): Promise<any[]> {
  return []
}
