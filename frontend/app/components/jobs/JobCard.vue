<script setup lang="ts">
import type { Job } from '../../types/index'

interface Props {
  job: Job
}

const props = defineProps<Props>()
const emit = defineEmits(['update-status', 'delete-job'])

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview' },
  { value: 'offer', label: 'Offer' },
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
  if (t === 'react') return 'badge-error'
  if (t === 'frontend' || t === 'html' || t === 'css') return 'badge-success'
  if (t === 'backend' || t === 'fullstack') return 'badge-accent'
  if (t === 'typescript') return 'badge-info'
  return 'badge-outline'
}

const updateStatus = (status: string) => {
  emit('update-status', props.job.id, status)
  ;(document.activeElement as HTMLElement)?.blur()
}

const isModalOpen = ref(false)

function openModal() {
  isModalOpen.value = true
}
function closeModal() {
  isModalOpen.value = false
}

const confirmDelete = () => {
  emit('delete-job', props.job.id)
  closeModal()
}
</script>

<template>
  <div @click="navigateTo(`/applications/${job.id}`)" class="card bg-base-300 shadow-sm hover:shadow-md transition-shadow h-full cursor-pointer">
    <div class="card-body p-4 flex flex-col">
      
      <!-- Header -->
      <div class="flex justify-between items-start gap-2">
        <div class="flex-1 min-w-0">
          <h2 class="card-title text-lg truncate">{{ job.title }}</h2>
          <p class="text-sm opacity-70">{{ job.company }} • {{ job.location }}</p>
        </div>
        
        <div class="flex gap-1 items-center">
          <!-- Favorite -->
          <button 
            @click.stop="useJobs().toggleFavorite(job.id)"
            class="btn btn-ghost btn-sm btn-circle"
            :class="{ 'text-warning': job.is_favorite }"
          >
            {{ job.is_favorite ? '★' : '☆' }}
          </button>
          <!-- Job Status Dropdown -->

          <div class="dropdown dropdown-end" @click.stop>
            <div tabindex="0" role="button" class="btn btn-ghost btn-sm btn-circle m-1" @click.stop>⚙️</div>
            <ul tabindex="-1" class="dropdown-content menu bg-base-200 rounded-box z-1 w-52 p-2 pt-0 shadow-sm">
              <li class="menu-title">Update Status</li>
              <li v-for="option in statusOptions" :key="option.value">
                <p @click.stop="updateStatus(option.value)" class="btn btn-sm flex justify-between cursor-pointer hover:bg-gray-600">
                  <span>{{ option.label }}</span>
                  <span v-if="job.status === option.value">✓</span>
                </p>
              </li>
              <li><p @click.stop="openModal" class="bg-red-400 hover:bg-red-600 btn-sm">Delete</p></li>
            </ul>
          </div>


        </div>
      </div>
      
      <!-- Delete confirmation modal -->
      <div v-if="isModalOpen" class="modal modal-open" role="dialog" @click.stop>
        <div class="modal-box">
          <h3 class="font-bold text-lg">Are you sure?</h3>
          <p class="py-4 text-sm opacity-70">
            This job will be deleted and its URL added to the blocklist.
            <strong>This cannot be undone.</strong>
          </p>
          <div class="modal-action">
            <button class="btn btn-ghost btn-sm" @click="closeModal">Cancel</button>
            <button class="btn btn-error btn-sm" @click="confirmDelete">Delete</button>
          </div>
        </div>
        <div class="modal-backdrop" @click="closeModal"></div>
      </div>
      
      <!-- Description -->
      <p class="text-sm opacity-70 mt-2 flex-1 line-clamp-4">
        {{ job.description_short || job.description }}
      </p>
      
      <!-- Tags -->
      <div class="flex flex-wrap gap-1.5 mt-3">
        <span 
          v-for="tag in uniqueTags" 
          :key="tag"
          class="badge badge-sm"
          :class="getTagColor(tag)"
        >
          {{ tag }}
        </span>
      </div>
      
      <!-- Footer -->
      <div class="card-actions justify-between items-center mt-4 pt-3 border-t border-base-200">
        <span v-if="job.salary_min || job.salary_max" class="text-sm font-medium">
          ${{ formatSalary(job.salary_min) }} - ${{ formatSalary(job.salary_max) }}
        </span>
        <span v-else class="text-sm opacity-60">Salary not listed</span>
        
        <div class="flex gap-2">
          <a :href="job.url" target="_blank" class="btn btn-primary btn-sm" @click.stop>View Application ↗</a>
        </div>
      </div>
    </div>
  </div>
</template>
