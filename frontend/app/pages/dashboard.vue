<script setup lang="ts">
const loading = ref(true)
const stats = ref({
  totalJobs: 0,
  applied: 0,
  interview: 0,
  offer: 0
})

const roleDistribution = ref<[string, number][]>([])

const formatRole = (role: string) => {
  const map: Record<string, string> = {
    frontend: 'Frontend',
    backend: 'Backend',
    fullstack: 'Full Stack',
    support: 'Support',
    other: 'Other'
  }
  return map[role] || role
}

onMounted(async () => {
  try {
    const { jobs } = await $fetch('/api/jobs')
    stats.value.totalJobs = jobs.length
    
    const visibleJobs = jobs.filter((j: any) => !j.is_hidden)
    const roles: Record<string, number> = {}
    for (const job of visibleJobs) {
      const r = job.role_type || 'other'
      roles[r] = (roles[r] || 0) + 1
    }
    roleDistribution.value = Object.entries(roles).sort((a, b) => b[1] - a[1])
    
    for (const job of visibleJobs) {
      if (job.status === 'applied') stats.value.applied++
      else if (job.status === 'interview') stats.value.interview++
      else if (job.status === 'offer') stats.value.offer++
    }
    
  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header -->
    <header class="bg-base-200 border-b border-base-300">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <NuxtLink to="/" class="btn btn-ghost text-xl">🎯 Job Tracker</NuxtLink>
          <h1 class="text-2xl font-bold">Dashboard</h1>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-6">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        
        <!-- Total Jobs -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title">Total Jobs</div>
          <div class="stat-value text-primary">{{ stats.totalJobs }}</div>
          <div class="stat-desc">Scraped to date</div>
        </div>

        <!-- Applied -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title">Applied</div>
          <div class="stat-value text-secondary">{{ stats.applied }}</div>
          <div class="stat-desc">Applications sent</div>
        </div>

        <!-- Interview -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title">Interviews</div>
          <div class="stat-value text-accent">{{ stats.interview }}</div>
          <div class="stat-desc">In progress</div>
        </div>

        <!-- Offers -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title">Offers</div>
          <div class="stat-value text-success">{{ stats.offer }}</div>
          <div class="stat-desc">🎉 Received</div>
        </div>
      </div>

      <!-- Role Distribution -->
      <div class="card bg-base-200 mb-6">
        <div class="card-body">
          <div class="card-title">Jobs by Role</div>
          <div v-if="loading" class="flex justify-center py-8">
            <span class="loading loading-spinner loading-md"></span>
          </div>
          <div v-else class="flex flex-wrap gap-2">
            <div
              v-for="[role, count] in roleDistribution"
              :key="role"
              class="badge badge-lg gap-2"
            >
              {{ formatRole(role) }}: {{ count }}
            </div>
          </div>
        </div>
      </div>

      <!-- Coming Soon -->
      <div class="alert alert-info">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6 shrink-0 stroke-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
         />
        </svg>
        <span>Full dashboard with charts coming in Phase 3!</span>
      </div>
    </main>
  </div>
</template>
