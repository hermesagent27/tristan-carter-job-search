export interface GitHubFile {
  content: string
  sha?: string
  message: string
  path: string
}

const REPO = process.env.GITHUB_REPO || 'hermesagent27/tristan-carter-job-search'
const TOKEN = process.env.GITHUB_TOKEN

export async function getFileSha(path: string): Promise<string | null> {
  if (!TOKEN) {
    console.error('[GitHub] GITHUB_TOKEN not set')
    return null
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}`,
      {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'JobTracker/1.0'
        }
      }
    )

    if (response.status === 404) return null
    if (!response.ok) {
      const err = await response.text()
      throw new Error(`GitHub API error: ${err}`)
    }

    const data = await response.json()
    return data.sha
  } catch (e: any) {
    console.error(`[GitHub] Error getting SHA for ${path}:`, e.message)
    return null
  }
}

export async function writeFile(
  path: string,
  content: any,
  message: string
): Promise<boolean> {
  if (!TOKEN) {
    console.error('[GitHub] GITHUB_TOKEN not set - persistence disabled')
    return false
  }

  try {
    const sha = await getFileSha(path)
    const encoded = Buffer.from(JSON.stringify(content, null, 2)).toString('base64')

    const body: any = {
      message,
      content: encoded,
      branch: 'main'
    }

    if (sha) {
      body.sha = sha
    }

    const response = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'JobTracker/1.0'
        },
        body: JSON.stringify(body)
      }
    )

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`GitHub commit error: ${err}`)
    }

    console.log(`[GitHub] Successfully wrote ${path}`)
    return true
  } catch (e: any) {
    console.error(`[GitHub] Error writing ${path}:`, e.message)
    return false
  }
}

// Batch updates to minimize API calls
interface PendingUpdate {
  path: string
  content: any
  message: string
}

const pendingUpdates: PendingUpdate[] = []
let batchTimeout: ReturnType<typeof setTimeout> | null = null

export function queueFileWrite(
  path: string,
  content: any,
  message: string
): void {
  // Replace existing update for same path
  const existingIndex = pendingUpdates.findIndex(u => u.path === path)
  if (existingIndex >= 0) {
    pendingUpdates[existingIndex] = { path, content, message }
  } else {
    pendingUpdates.push({ path, content, message })
  }

  // Debounce writes
  if (batchTimeout) clearTimeout(batchTimeout)
  batchTimeout = setTimeout(flushPendingWrites, 3000)
}

async function flushPendingWrites(): Promise<void> {
  while (pendingUpdates.length > 0) {
    const update = pendingUpdates.shift()
    if (!update) continue
    await writeFile(update.path, update.content, update.message)
  }
}

export async function deleteFile(
  path: string,
  message: string
): Promise<boolean> {
  if (!TOKEN) {
    console.error('[GitHub] GITHUB_TOKEN not set - persistence disabled')
    return false
  }

  try {
    const sha = await getFileSha(path)
    if (!sha) {
      console.warn(`[GitHub] File not found, nothing to delete: ${path}`)
      return true
    }

    const response = await fetch(
      `https://api.github.com/repos/${REPO}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'JobTracker/1.0'
        },
        body: JSON.stringify({ message, sha, branch: 'main' })
      }
    )

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`GitHub delete error: ${err}`)
    }

    console.log(`[GitHub] Successfully deleted ${path}`)
    return true
  } catch (e: any) {
    console.error(`[GitHub] Error deleting ${path}:`, e.message)
    return false
  }
}

// For immediate writes
export async function writeJobUpdate(
  jobId: string,
  updates: Record<string, any>
): Promise<boolean> {
  // Find which file contains this job
  const months = ['2026-05']
  const days = ['2026-05-15', '2026-05-16', '2026-05-17']

  for (const month of months) {
    for (const day of days) {
      const path = `data/jobs/${month}/${day}.json`
      const url = `https://raw.githubusercontent.com/${REPO}/main/${path}`
      
      try {
        const { $fetch } = await import('ofetch')
        const jobs = await $fetch(url, {
          headers: {
            'User-Agent': 'JobTracker/1.0'
          }
        }) as any[]
        
        const jobIndex = jobs.findIndex(j => j.id === jobId)
        if (jobIndex >= 0) {
          // Update the job
          jobs[jobIndex] = { ...jobs[jobIndex], ...updates }
          
          // Write back
          return await writeFile(
            path,
            jobs,
            `Update job ${jobId}: ${Object.keys(updates).join(', ')}`
          )
        }
      } catch (e) {
        // Try next file
      }
    }
  }

  return false
}
