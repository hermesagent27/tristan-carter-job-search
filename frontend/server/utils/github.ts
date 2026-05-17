import { $fetch } from 'ofetch'

const REPO = 'hermesagent27/tristan-carter-job-search'
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

async function fetchCachedJson(url: string): Promise<any> {
  const cached = cache.get(url)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }
  
  // Add headers to avoid GitHub bot detection
  const data = await $fetch(url, {
    headers: {
      'User-Agent': 'JobTracker/1.0',
      'Accept': 'application/json'
    }
  })
  cache.set(url, { data, timestamp: Date.now() })
  
  return data
}

// Fetch all jobs from GitHub raw URLs
export async function getAllJobs(): Promise<Job[]> {
  try {
    // For MVP: fetch known daily files
    // In production: list directory via GitHub API
    const months = ['2026-05']
    const allJobs: Job[] = []
    
    for (const month of months) {
      const days = ['2026-05-15', '2026-05-16', '2026-05-17']
      for (const day of days) {
        try {
          const url = `${RAW_URL}/data/jobs/${month}/${day}.json`
          console.log(`[Jobs] Fetching: ${url}`)
          const jobs = await fetchCachedJson(url)
          if (Array.isArray(jobs)) {
            const normalized = jobs.map((j: any) => ({
              ...j,
              is_favorite: j.is_favorite ?? false,
              is_hidden: j.is_hidden ?? false,
              role_type: j.role_type || detectRoleType(j)
            }))
            allJobs.push(...normalized)
            console.log(`[Jobs] Loaded ${jobs.length} jobs from ${day}`)
          }
        } catch (e: any) {
          console.error(`[Jobs] Failed to fetch ${day}: ${e.message}`)
        }
      }
    }
    
    return allJobs
  } catch (error) {
    console.error('Error fetching jobs:', error)
    return []
  }
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
