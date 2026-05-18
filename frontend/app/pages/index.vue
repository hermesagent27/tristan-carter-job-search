<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header -->
    <header class="bg-base-200 border-b border-base-300">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold">🎯 Job Tracker</h1>
          <NuxtLink to="/dashboard" class="btn btn-ghost btn-sm">
            Dashboard
          </NuxtLink>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="container mx-auto px-4 py-6">
      
      <!-- Filters -->
      <JobFilters
        v-model:searchQuery="searchQuery"
        v-model:roleFilter="roleFilter"
        v-model:remoteOnly="remoteOnly"
        class="mb-6"
      />
      
      <!-- Tabs -->
      <JobTabs
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
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{{ error }}</span>
      </div>
      
      <!-- Jobs Grid -->
      <div v-else-if="filteredJobs.length" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <JobCard
          v-for="job in filteredJobs"
          :key="job.id"
          :job="job"
        />
      </div>
      
      <!-- Empty State -->
      <div v-else class="text-center py-12">
        <div class="text-6xl mb-4">🔍</div>
        <h3 class="text-xl font-semibold mb-2">No jobs found</h3>
        <p class="text-muted">Try adjusting your filters or check back later.</p>
      </div>
      
    </main>
  </div>
</template>

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
  remoteOnly
} = useJobs()

// Load jobs on mount
onMounted(() => {
  fetchJobs()
})
</script>
