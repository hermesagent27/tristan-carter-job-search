<script setup lang="ts">
const { 
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
  sortBy,
  updateStatus,
  deleteJob
} = useJobs()

// Handle status update from job card
const handleUpdateStatus = async (jobId: string, status: string) => {
  await updateStatus(jobId, status)
}

// Handle delete from job card
const handleDeleteJob = async (jobId: string) => {
  try {
    await deleteJob(jobId)
  } catch (e) {
    console.error('Delete failed:', e)
    alert('Failed to delete job. Please try again.')
  }
}

// Load jobs immediately (for SSR) and on client
await callOnce(async () => {
  await fetchJobs()
})

// Also fetch on client in case of hydration mismatch
onMounted(() => {
  if (jobs.value.length === 0 && !loading.value) {
    fetchJobs()
  }
})
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header -->
    <header class="bg-base-200 border-b border-base-300">
      <div class="w-full max-w-7xl mx-auto px-4 py-4" style="max-width: 1200px;">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">🎯 Job Tracker</h1>
          <NuxtLink to="/dashboard" class="btn btn-ghost btn-sm">
            Dashboard
          </NuxtLink>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="w-full max-w-7xl mx-auto px-4 py-6" style="max-width: 1200px;">
      
      <!-- Filters -->
      <JobsJobFilters
        v-model:searchQuery="searchQuery"
        v-model:roleFilter="roleFilter"
        v-model:remoteOnly="remoteOnly"
        v-model:sortBy="sortBy"
        class="mb-6"
      />
      
      <!-- Tabs -->
      <JobsJobTabs
        v-model="activeTab"
        :counts="counts"
        class="mb-6"
      />
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{{ error }}</span>
      </div>
      
      <!-- Jobs Grid -->
      <div v-else-if="filteredJobs.length" class="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
        <JobsJobCard
          v-for="job in filteredJobs"
          :key="job.id"
          :job="job"
          @update-status="handleUpdateStatus"
          @delete-job="handleDeleteJob"
        />
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="text-6xl mb-4">{{ activeTab === 'post' ? '🔍' : activeTab === 'applied' ? '📝' : activeTab === 'interview' ? '📅' : '🎉' }}</div>
        <!-- Tab-specific messages -->
        <template v-if="activeTab === 'post'">
          <h3 class="text-xl font-semibold mb-2">No jobs found</h3>
          <p class="text-muted mb-2">Try adjusting your filters or check back later.</p>
        </template>
        <template v-else-if="activeTab === 'applied'">
          <h3 class="text-xl font-semibold mb-2">No applications put in</h3>
          <p class="text-muted mb-2">Browse jobs and mark them as applied to see them here.</p>
        </template>
        <template v-else-if="activeTab === 'interview'">
          <h3 class="text-xl font-semibold mb-2">No interviews scheduled</h3>
          <p class="text-muted mb-2">Update your applications to interview stage to see them here.</p>
        </template>
        <template v-else-if="activeTab === 'offer'">
          <h3 class="text-xl font-semibold mb-2">No offers yet</h3>
          <p class="text-muted mb-2">Keep applying and interviewing!</p>
        </template>
        <p class="text-xs text-base-content/50">
          Total loaded: {{ jobs.length }} | Filtered: {{ filteredJobs.length }}
        </p>
      </div>
      
    </main>
  </div>
</template>
