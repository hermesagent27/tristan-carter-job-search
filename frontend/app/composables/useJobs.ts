import type { Job } from '~/types'

export const useJobs = () => {
  const jobs = useState<Job[]>('jobs', () => [])
  const loading = useState<boolean>('jobs-loading', () => false)
  const error = useState<string | null>('jobs-error', () => null)
  
  // Filters
  const activeTab = useState<'post' | 'applied' | 'interview' | 'offer'>('active-tab', () => 'post')
  const searchQuery = useState<string>('search-query', () => '')
  const roleFilter = useState<string>('role-filter', () => '')
  const remoteOnly = useState<boolean>('remote-only', () => false)
  
  // Fetch jobs from API
  const fetchJobs = async () => {
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch('/api/jobs')
      if (data.success) {
        jobs.value = data.jobs
      }
    } catch (e) {
      error.value = 'Failed to load jobs'
      console.error(e)
    } finally {
      loading.value = false
    }
  }
  
  // Filtered jobs based on active tab and filters
  const filteredJobs = computed(() => {
    return jobs.value.filter((job: Job) => {
      // Exclude hidden
      if (job.is_hidden) return false
      
      // Search filter
      if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        const text = `${job.title} ${job.company} ${job.description || ''}`.toLowerCase()
        if (!text.includes(q)) return false
      }
      
      // Role filter
      if (roleFilter.value && job.role_type !== roleFilter.value) {
        return false
      }
      
      // Remote filter
      if (remoteOnly.value && !job.is_remote) {
        return false
      }
      
      // Tab filter - filter by job status
      const statusMap: Record<string, string> = {
        'post': 'new',
        'applied': 'applied',
        'interview': 'interview',
        'offer': 'offer'
      }
      const expectedStatus = statusMap[activeTab.value]
      if (expectedStatus && job.status !== expectedStatus) {
        return false
      }
      
      return true
    })
  })
  
  // Counts for tabs
  const counts = computed(() => ({
    post: jobs.value.filter((j: Job) => !j.is_hidden && j.status === 'new').length,
    applied: jobs.value.filter((j: Job) => !j.is_hidden && j.status === 'applied').length,
    interview: jobs.value.filter((j: Job) => !j.is_hidden && j.status === 'interview').length,
    offer: jobs.value.filter((j: Job) => !j.is_hidden && j.status === 'offer').length
  }))
  
  // Persist favorite toggle
  const toggleFavorite = async (jobId: string) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (!job) return

    // Optimistic update
    const newVal = !job.is_favorite
    job.is_favorite = newVal

    // Persist to server
    try {
      await $fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        body: { is_favorite: newVal }
      })
    } catch (e) {
      // Revert on failure
      job.is_favorite = !newVal
      console.error('Failed to update favorite:', e)
    }
  }

  // Persist hide toggle
  const toggleHidden = async (jobId: string) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (!job) return

    const newVal = !job.is_hidden
    job.is_hidden = newVal

    try {
      await $fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        body: { is_hidden: newVal }
      })
    } catch (e) {
      job.is_hidden = !newVal
      console.error('Failed to update hidden:', e)
    }
  }

  // Update job status
  const updateStatus = async (jobId: string, status: string) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (!job) return

    const oldStatus = job.status
    job.status = status as any

    try {
      await $fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        body: { status }
      })
    } catch (e) {
      job.status = oldStatus
      console.error('Failed to update status:', e)
    }
  }

  // Delete job and block its URL
  const deleteJob = async (jobId: string) => {
    const job = jobs.value.find(j => j.id === jobId)
    if (!job) return

    const jobUrl = job.url
    const index = jobs.value.findIndex(j => j.id === jobId)

    if (index > -1) {
      jobs.value.splice(index, 1)
    }

    try {
      // Call delete API that blocks the URL
      await $fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE'
      })
    } catch (e) {
      console.error('Failed to delete job:', e)
      // Re-add job on failure
      if (index > -1) {
        jobs.value.splice(index, 0, job)
      }
      throw e
    }
  }

  return {
    jobs,
    loading,
    error,
    fetchJobs,
    filteredJobs,
    counts,
    activeTab,
    searchQuery,
    roleFilter,
    remoteOnly,
    toggleFavorite,
    toggleHidden,
    updateStatus,
    deleteJob
  }
}
