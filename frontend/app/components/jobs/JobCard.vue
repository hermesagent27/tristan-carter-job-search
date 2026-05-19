<template>
  <div class="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-200 border border-base-300/50 h-full flex flex-col">
    <div class="card-body p-4 flex flex-col flex-1">
      <!-- Header -->
      <div class="flex justify-between items-start gap-2">
        <div class="flex-1 min-w-0">
          <h3 class="card-title text-lg font-semibold truncate">{{ job.title }}</h3>
          <p class="text-muted text-sm">{{ job.company }} • {{ job.location }}</p>
        </div>
        <button 
          @click="toggleFavorite(job.id)"
          class="btn btn-ghost btn-sm btn-circle shrink-0"
          :class="{ 'text-yellow-500': job.is_favorite }"
          :title="job.is_favorite ? 'Remove favorite' : 'Add favorite'"
        >
          {{ job.is_favorite ? '★' : '☆' }}
        </button>
      </div>
      
      <!-- Description -->
      <p class="text-sm text-base-content/70 line-clamp-2 mt-2 mb-2 flex-1">
        {{ getDescriptionPreview }}
      </p>
      
      <!-- Tags -->
      <div class="flex flex-wrap gap-1 mt-3">
        <span 
          v-for="tag in job.tags.slice(0, 5)" 
          :key="tag"
          class="badge badge-sm"
          :class="getTagColor(tag)"
        >
          {{ tag }}
        </span>
        <span v-if="job.is_remote" class="badge badge-sm badge-success">Remote</span>
      </div>
      
      <!-- Footer -->
      <div class="card-actions justify-between items-center mt-4 pt-3 border-t border-base-200">
        <span v-if="job.salary_min || job.salary_max" class="text-sm font-medium">
          ${{ formatSalary(job.salary_min) }} - ${{ formatSalary(job.salary_max) }}
        </span>
        <span v-else class="text-sm text-muted">Salary not listed</span>
        
        <div class="flex gap-2">
          <button 
            @click="showDetails = true"
            class="btn btn-primary btn-sm"
          >
            View
          </button>
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
    
    <!-- Job Details Modal -->
    <dialog v-if="showDetails" class="modal modal-open">
      <div class="modal-box max-w-2xl">
        <form method="dialog">
          <button @click="showDetails = false" class="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">✕</button>
        </form>
        
        <h3 class="font-bold text-lg pr-8">{{ job.title }}</h3>
        <p class="py-1 text-muted">{{ job.company }} • {{ job.location }}</p>
        
        <div class="flex flex-wrap gap-2 py-2">
          <span 
            v-for="tag in job.tags" 
            :key="tag"
            class="badge badge-sm"
            :class="getTagColor(tag)"
          >
            {{ tag }}
          </span>
          <span v-if="job.is_remote" class="badge badge-sm badge-success">Remote</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="prose max-w-none">
          <h4 class="font-semibold mb-2">Description</h4>
          <pre class="whitespace-pre-wrap text-sm bg-base-200 p-4 rounded-lg">{{ job.description }}</pre>
        </div>
        
        <div class="modal-action">
          <a 
            :href="job.url" 
            target="_blank"
            class="btn btn-primary"
          >
            Apply
          </a>
          <button @click="showDetails = false" class="btn">Close</button>
        </div>
      </div>
      
      <!-- Click outside to close -->
      <form method="dialog" class="modal-backdrop">
        <button @click="showDetails = false">Close</button>
      </form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import type { Job } from '~/types'
import { truncateText } from '~/utils/text'

interface Props {
  job: Job
}

const props = defineProps<Props>()

const { toggleFavorite, toggleHidden } = useJobs()

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

// Strip HTML and get clean preview text
const getDescriptionPreview = computed(() => {
  return truncateText(props.job.description_short || props.job.description, 150)
})

// Show job details modal
const showDetails = ref(false)
</script>
