<script setup lang="ts">
// Stats data interface
interface StatsData {
  totalJobs: number
  totalNew: number
  totalApplied: number
  totalInterview: number
  totalOffer: number
  totalDeleted: number
  totalFavorites: number
  responseRate: number
  conversionRate: number
}

interface Distributions {
  roles: Record<string, number>
  sources: Record<string, number>
}

interface Salary {
  avg: number
  min: number
  max: number
  count: number
}

interface TimeSlot {
  date: string
  new: number
  applied: number
  interview: number
  offer: number
}

interface WeeklyData {
  week: string
  applied: number
  interview: number
  offer: number
}

interface StatsResponse {
  success: boolean
  stats: StatsData
  distributions: Distributions
  salary: Salary
  timeSeries: TimeSlot[]
  weekly: WeeklyData[]
  lastUpdated: string
}

const loading = ref(true)
const stats = ref<StatsData | null>(null)
const distributions = ref<Distributions | null>(null)
const salary = ref<Salary | null>(null)
const timeSeries = ref<TimeSlot[]>([])
const weekly = ref<WeeklyData[]>([])
const lastUpdated = ref('')

const formatCurrency = (n: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(n)
}

const fetchStats = async () => {
  try {
    const data = await $fetch<StatsResponse>('/api/stats')
    if (data.success) {
      stats.value = data.stats
      distributions.value = data.distributions
      salary.value = data.salary
      timeSeries.value = data.timeSeries
      weekly.value = data.weekly
      lastUpdated.value = new Date(data.lastUpdated).toLocaleString()
    }
  } catch (e) {
    console.error('Failed to load stats:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header -->
    <header class="bg-base-200 border-b border-base-300">
      <div class="container mx-auto px-4 py-4">
        <div class="flex justify-between items-center">
          <NuxtLink to="/" class="btn btn-ghost text-xl">🎯 Job Tracker</NuxtLink>
          
          <!-- Desktop Nav -->
          <div class="hidden sm:flex items-center gap-4">
            <h1 class="text-2xl font-bold">Dashboard</h1>
            <NuxtLink to="/questions" class="btn btn-ghost btn-sm">Questions</NuxtLink>
          </div>
          
          <!-- Mobile Hamburger -->
          <div class="sm:hidden dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </label>
            <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-4">
              <li><NuxtLink to="/questions">Questions</NuxtLink></li>
            </ul>
          </div>
        </div>
      </div>
    </header>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center py-20">
      <span class="loading loading-spinner loading-lg"></span>
    </div>

    <!-- Main Content -->
    <main v-else class="container mx-auto px-4 py-6">
      <!-- Last Updated -->
      <p class="text-sm text-base-content/60 text-right mb-4">
        Last updated: {{ lastUpdated }}
      </p>

      <!-- Summary Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <!-- Total Jobs -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title text-sm">Total Jobs</div>
          <div class="stat-value text-3xl text-primary">{{ stats?.totalJobs || 0 }}</div>
          <div class="stat-desc text-xs">Scraped</div>
        </div>

        <!-- New -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title text-sm">New</div>
          <div class="stat-value text-3xl text-gray-500">{{ stats?.totalNew || 0 }}</div>
          <div class="stat-desc text-xs">To review</div>
        </div>

        <!-- Applied -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title text-sm">Applied</div>
          <div class="stat-value text-3xl text-secondary">{{ stats?.totalApplied || 0 }}</div>
          <div class="stat-desc text-xs">Waiting</div>
        </div>

        <!-- Interview -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title text-sm">Interviews</div>
          <div class="stat-value text-3xl text-accent">{{ stats?.totalInterview || 0 }}</div>
          <div class="stat-desc text-xs">In progress</div>
        </div>

        <!-- Offers -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title text-sm">Offers</div>
          <div class="stat-value text-3xl text-success">{{ stats?.totalOffer || 0 }}</div>
          <div class="stat-desc text-xs">🎉 Great!</div>
        </div>

        <!-- Favorites -->
        <div class="stat bg-base-200 rounded-box p-4">
          <div class="stat-title text-sm">Favorites</div>
          <div class="stat-value text-3xl text-warning">{{ stats?.totalFavorites || 0 }}</div>
          <div class="stat-desc text-xs">Saved</div>
        </div>
      </div>

      <!-- Conversion Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div class="card bg-base-200">
          <div class="card-body p-4">
            <h3 class="card-title text-sm">Response Rate</h3>
            <p class="text-3xl font-bold text-primary">{{ stats?.responseRate || 0 }}%</p>
            <p class="text-sm text-base-content/70">Applied → Interview</p>
          </div>
        </div>

        <div class="card bg-base-200">
          <div class="card-body p-4">
            <h3 class="card-title text-sm">Conversion Rate</h3>
            <p class="text-3xl font-bold text-success">{{ stats?.conversionRate || 0 }}%</p>
            <p class="text-sm text-base-content/70">Interview → Offer</p>
          </div>
        </div>

        <div v-if="salary?.count" class="card bg-base-200">
          <div class="card-body p-4">
            <h3 class="card-title text-sm">Avg Salary ({{ salary.count }} jobs)</h3>
            <p class="text-3xl font-bold text-info">{{ formatCurrency(salary.avg) }}</p>
            <p class="text-sm text-base-content/70">Range: {{ formatCurrency(salary.min) }} - {{ formatCurrency(salary.max) }}</p>
          </div>
        </div>

        <div v-else class="card bg-base-200">
          <div class="card-body p-4">
            <h3 class="card-title text-sm">Salary Data</h3>
            <p class="text-2xl font-bold">--</p>
            <p class="text-sm text-base-content/70">No salary info available</p>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Time Series Chart -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="card-title">30-Day Trends</h3>
            <DashboardTimeSeriesChart :data="timeSeries" />
          </div>
        </div>

        <!-- Weekly Summary -->
        <div class="card bg-base-200">
          <div class="card-body">
            <h3 class="card-title">Weekly Activity</h3>
            <DashboardWeeklyBarChart :data="weekly" />
          </div>
        </div>

        <!-- Role Distribution -->
        <div class="card bg-base-200">
          <div class="card-body">
            <DashboardDistributionChart
              :data="distributions?.roles || {}"
              title="Jobs by Role Type"
            />
          </div>
        </div>

        <!-- Source Distribution -->
        <div class="card bg-base-200">
          <div class="card-body">
            <DashboardDistributionChart
              :data="distributions?.sources || {}"
              title="Jobs by Source"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
