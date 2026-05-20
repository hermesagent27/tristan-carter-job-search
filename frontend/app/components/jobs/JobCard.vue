<script setup lang="ts">
import type { Job } from '~/types'
import { truncateText } from '~/utils/text'

interface Props {
  job: Job
}

const props = defineProps<Props>()
const emit = defineEmits(['update-status', 'delete-job'])

const { toggleHidden } = useJobs()

// UI state
const showSettings = ref(false)
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

// Settings dropdown position
const settingsRef = ref<HTMLDivElement | null>(null)

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' }
]

// Get unique tags excluding 'remote' since we show that separately
const uniqueTags = computed(() => {
  if (!props.job.tags) return []
  return props.job.tags
    .filter(tag => tag.toLowerCase() !== 'remote')
    .slice(0, 4)
})

const formatSalary = (val?: number) => {
  if (!val) return '?'
  return val >= 1000 ? `${val/1000}k` : val
}

const getTagColor = (tag: string) => {
  const t = tag.toLowerCase()
  if (t === 'vue' || t === 'nuxt') return 'badge-primary'
  if (t === 'react') return 'badge-info'
  if (t === 'remote') return 'badge-success'
  if (t === 'typescript') return 'badge-secondary'
  return 'badge-ghost'
}

const getDescriptionPreview = computed(() => {
  return truncateText(props.job.description_short || props.job.description, 150)
})

const toggleSettings = () => {
  showSettings.value = !showSettings.value
}

const closeSettings = () => {
  showSettings.value = false
}

const updateStatus = (status: string) => {
  emit('update-status', status)
  closeSettings()
}

const initDelete = () => {
  showSettings.value = false
  showDeleteConfirm.value = true
}

const confirmDelete = async () => {
  isDeleting.value = true
  emit('delete-job', props.job.id)
  showDeleteConfirm.value = false
  isDeleting.value = false
}

// Click outside to close dropdown
onClickOutside(settingsRef, closeSettings)
</script>

<template>
  <div class="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 border border-base-300/50 h-full flex flex-col">
    <div class="card-body p-4 flex flex-col flex-1">
      <!-- Header -->
      <div class="flex justify-between items-start gap-2">
        <div class="flex-1 min-w-0">
          <h3 class="card-title text-lg font-semibold truncate">{{ job.title }}</h3>
          <p class="text-muted text-sm">{{ job.company }} • {{ job.location }}</p>
        </div>
        <div class="flex items-center gap-1 shrink-0">
          <!-- Favorite button -->
          <button 
            @click="useJobs().toggleFavorite(job.id)"
            class="btn btn-ghost btn-sm btn-circle"
            :class="{ 'text-yellow-500': job.is_favorite }"
            :title="job.is_favorite ? 'Remove favorite' : 'Add favorite'"
          >
            {{ job.is_favorite ? '★' : '☆' }}
          </button>
          
          <!-- Settings button -->
          <div ref="settingsRef" class="relative">
            <button 
              @click="toggleSettings"
              class="btn btn-ghost btn-sm btn-circle"
              title="Settings"
            >
              ⚙️
            </button>
            
            <!-- Settings Dropdown -->
            <div 
              v-if="showSettings"
              class="absolute right-0 top-full mt-1 z-20 bg-base-100 border border-base-300 rounded-box shadow-lg min-w-[180px] py-1"
            >
              <div class="px-3 py-2 text-sm font-semibold border-b border-base-300">Update Status</div>
              <button
                v-for="option in statusOptions"
                :key="option.value"
                @click="updateStatus(option.value)"
                class="w-full text-left px-3 py-2 text-sm hover:bg-base-200 flex items-center gap-2"
                :class="{ 'text-primary font-medium': job.status === option.value }"
              >
                <span v-if="job.status === option.value">✓</span>
                <span v-else class="pl-5"></span>
                {{ option.label }}
              </button>
              
              <div class="border-t border-base-300 my-1"></div>
              
              <button
                @click="initDelete"
                class="w-full text-left px-3 py-2 text-sm text-error hover:bg-error/10 flex items-center gap-2"
              >
                <span class="pl-5"></span>
                Delete Job
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirm" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div class="bg-base-100 rounded-lg p-6 max-w-sm mx-4 shadow-2xl">
          <h3 class="text-lg font-bold mb-2">Are you sure?</h3>
          <p class="text-sm text-muted mb-4">
            This job will be deleted and its URL added to the blocklist. <strong>This cannot be undone.</strong>
          </p>
          <div class="flex gap-3 justify-end">
            <button 
              @click="showDeleteConfirm = false"
              class="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button 
              @click="confirmDelete"
              class="btn btn-error btn-sm"
              :disabled="isDeleting"
            >
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
      
      <!-- Description -->
      <p class="text-sm text-base-content/70 line-clamp-2 mt-2 mb-2 flex-1">
        {{ getDescriptionPreview }}
      </p>
      
      <!-- Tags -->
      <div class="flex flex-wrap gap-1.5 mt-3">
        <span 
          v-for="tag in uniqueTags" 
          :key="tag"
          class="badge badge-sm border border-current bg-base-200/80"
          :class="getTagColor(tag)"
        >
          {{ tag }}
        </span>
        <span v-if="job.is_remote" class="badge badge-sm badge-success border border-success bg-success/80">Remote</span>
      </div>
      
      <!-- Footer -->
      <div class="card-actions justify-between items-center mt-4 pt-3 border-t border-base-200">
        <span v-if="job.salary_min || job.salary_max" class="text-sm font-medium">
          ${{ formatSalary(job.salary_min) }} - ${{ formatSalary(job.salary_max) }}
        </span>
        <span v-else class="text-sm text-muted">Salary not listed</span>
        
        <div class="flex gap-2">
          <NuxtLink 
            :to="`/applications/${job.id}`"
            class="btn btn-primary btn-sm"
          >
            View
          </NuxtLink>
          <a 
            :href="job.url" 
            target="_blank"
            class="btn btn-ghost btn-sm"
            title="Open original posting"
          >
            ↗
          </a>
          <button 
            @click="toggleHidden(job.id)"
            class="btn btn-ghost btn-sm text-error"
            title="Hide job"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
