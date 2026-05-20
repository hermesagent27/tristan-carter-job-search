<script setup lang="ts">
import type { Job } from '~/types'
import { truncateText } from '~/utils/text'

interface Props {
  job: Job
}

const props = defineProps<Props>()
const emit = defineEmits(['update-status', 'delete-job'])

const { toggleHidden } = useJobs()

// Modal state
const deleteModalRef = ref<HTMLDialogElement | null>(null)

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: 'Rejected' }
]

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

const updateStatus = (status: string) => {
  emit('update-status', status)
}

const openDeleteModal = () => {
  deleteModalRef.value?.showModal()
}

const confirmDelete = () => {
  emit('delete-job', props.job.id)
  deleteModalRef.value?.close()
}
</script>

<template>
  <!-- Daisy Card -->
  <div class="card bg-base-100 shadow-sm hover:shadow-md transition-shadow h-full">
    <div class="card-body p-4 flex flex-col">
      <!-- Header -->
      <div class="flex justify-between items-start gap-2">
        <div class="flex-1 min-w-0">
          <h2 class="card-title text-lg truncate">{{ job.title }}</h2>
          <p class="text-sm opacity-70">{{ job.company }} • {{ job.location }}</p>
        </div>
        
        <div class="flex gap-1">
          <!-- Favorite -->
          <button 
            @click="useJobs().toggleFavorite(job.id)"
            class="btn btn-ghost btn-sm btn-circle"
            :class="{ 'text-warning': job.is_favorite }"
          >
            {{ job.is_favorite ? '★' : '☆' }}
          </button>
          
          <!-- Daisy Dropdown -->
          <div class="dropdown dropdown-end">
            <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">⚙️</label>
            <ul tabindex="0" class="dropdown-content menu menu-sm z-[1] bg-base-100 rounded-box shadow w-48 border border-base-300 p-0">
              <li class="menu-title pl-4 pr-2 py-2">Update Status</li>
              <li v-for="option in statusOptions" :key="option.value">
                <button @click="updateStatus(option.value)" class="flex justify-between w-full text-left">
                  {{ option.label }}
                  <span v-if="job.status === option.value">✓</span>
                </button>
              </li>
              <div class="divider my-0"></div>
              <li>
                <button @click="openDeleteModal" class="text-error w-full text-left">Delete Job</button>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Daisy Modal -->
      <dialog ref="deleteModalRef" class="modal modal-middle">
        <div class="modal-box">
          <h3 class="text-lg font-bold">Are you sure?</h3>
          <p class="py-4 text-sm opacity-70">
            This job will be deleted and its URL added to the blocklist. 
            <strong>This cannot be undone.</strong>
          </p>
          <div class="modal-action">
            <form method="dialog">
              <button class="btn btn-ghost btn-sm">Cancel</button>
            </form>
            <button @click="confirmDelete" class="btn btn-error btn-sm">Delete</button>
          </div>
        </div>
        <form method="dialog" class="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
      
      <!-- Description -->
      <p class="text-sm opacity-70 line-clamp-2 mt-2 flex-1">
        {{ getDescriptionPreview }}
      </p>
      
      <!-- Tags -->
      <div class="flex flex-wrap gap-1.5 mt-3">
        <span 
          v-for="tag in uniqueTags" 
          :key="tag"
          class="badge badge-sm badge-outline"
          :class="getTagColor(tag)"
        >
          {{ tag }}
        </span>
        <span v-if="job.is_remote" class="badge badge-sm badge-success badge-outline">Remote</span>
      </div>
      
      <!-- Footer -->
      <div class="card-actions justify-between items-center mt-4 pt-3 border-t border-base-200">
        <span v-if="job.salary_min || job.salary_max" class="text-sm font-medium">
          ${{ formatSalary(job.salary_min) }} - ${{ formatSalary(job.salary_max) }}
        </span>
        <span v-else class="text-sm opacity-60">Salary not listed</span>
        
        <div class="flex gap-2">
          <NuxtLink :to="`/applications/${job.id}`" class="btn btn-primary btn-sm">View</NuxtLink>
          <a :href="job.url" target="_blank" class="btn btn-ghost btn-sm">↗</a>
          <button @click="toggleHidden(job.id)" class="btn btn-ghost btn-sm text-error">✕</button>
        </div>
      </div>
    </div>
  </div>
</template>
