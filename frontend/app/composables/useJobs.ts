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
      
      // Tab filter (simplified - all jobs show in 'post' for now)
      // In full version, this would check applications table
      if (activeTab.value !== 'post') {
        // For MVP, only show jobs in 'post' tab
        // Applications tracking coming later
        return false
      }
      
      return true
    })
  })
  
  // Counts for tabs
  const counts = computed(() => ({
    post: jobs.value.filter((j: Job) => !j.is_hidden).length,
    applied: 0, // TODO: fetch applications
    interview: 0,
    offer: 0
  }))
  
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
    remoteOnly
  }
}
