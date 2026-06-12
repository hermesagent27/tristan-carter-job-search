<script setup lang="ts">
import type { Job } from '~/types'

const route = useRoute()
const jobId = route.params.id as string

const loading = ref(true)
const error = ref<string | null>(null)
const job = ref<Job | null>(null)
const isEditing = ref(false)
const saving = ref(false)
const downloadingCoverLetter = ref(false)

// Application data structure
const application = ref({
  cover_letter: '',
  questions: [] as { question: string; answer: string; category?: 'technical' | 'behavioral' | 'other' }[],
  notes: ''
})

// Load job data
const fetchJob = async () => {
  loading.value = true
  error.value = null
  
  try {
    const data = await $fetch(`/api/jobs`)
    const found = data.jobs?.find((j: any) => j.id === jobId)
    
    if (found) {
      job.value = found
      
      if (found.application_data) {
        application.value = { 
          ...application.value, 
          ...found.application_data,
          questions: found.application_data.questions || []
        }
      } else {
        await generateCoverLetterForJob()
      }
    } else {
      error.value = 'Job not found'
    }
  } catch (e) {
    error.value = 'Failed to load job'
    console.error(e)
  } finally {
    loading.value = false
  }
}

// Auto-generate cover letter
const generateCoverLetterForJob = async () => {
  if (!job.value) return
  
  try {
    const { cover_letter } = await $fetch(`/api/cover-letter?id=${job.value.id}`)
    application.value.cover_letter = cover_letter
  } catch (e) {
    console.error('Failed to generate cover letter:', e)
    application.value.cover_letter = `Dear Hiring Manager,

I am writing to express my interest in the ${job.value.title} position at ${job.value.company}. With my background in web development and management experience, I bring both technical skills and leadership perspective to this role.

I am particularly excited about the opportunity to contribute to your team and grow my skills in a collaborative environment. My experience has taught me to take initiative, communicate clearly, and deliver results.

Thank you for considering my application.

Sincerely,
Tristan Carter`
  }
}

// Save application data
const saveApplication = async () => {
  if (!job.value) return
  
  saving.value = true
  try {
    await $fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      body: {
        application_data: application.value
      }
    })
    
    job.value.application_data = { ...application.value }
    isEditing.value = false
  } catch (e) {
    console.error('Failed to save:', e)
    alert('Failed to save. Please try again.')
  } finally {
    saving.value = false
  }
}

// Update job status
const updateStatus = async (newStatus: string) => {
  if (!job.value) return
  
  try {
    await $fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
    job.value.status = newStatus as any
  } catch (e) {
    console.error('Failed to update status:', e)
  }
}

 // Add/remove questions
const addQuestion = () => {
  application.value.questions.push({ question: '', answer: '', category: 'technical' })
}

const removeQuestion = (index: number) => {
  application.value.questions.splice(index, 1)
}

// Download cover letter as Word doc
const downloadCoverLetter = () => {
  if (!job.value) return
  
  downloadingCoverLetter.value = true
  
  // Direct browser download - works on mobile Safari
  const url = `/api/cover-letter/download?id=${job.value.id}`
  window.location.href = url
  
  // Reset button after short delay
  setTimeout(() => {
    downloadingCoverLetter.value = false
  }, 2000)
}

// Helpers
const formatSalary = (val?: number) => {
  if (!val) return '?'
  return val >= 1000 ? `${val/1000}k` : val
}

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString()
}

const statusClass = computed(() => {
  const map: Record<string, string> = {
    new: 'badge-ghost',
    applied: 'badge-primary',
    interview: 'badge-warning',
    offer: 'badge-success'
  }
  return map[job.value?.status || 'new'] || 'badge-ghost'
})

// Delete job and redirect to home
const deleteJob = async () => {
  if (!job.value) return
  if (!confirm('Are you sure you want to delete this job? It cannot be undone.')) return
  
  try {
    await $fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
    await navigateTo('/')
  } catch (e) {
    console.error('Failed to delete job:', e)
    alert('Failed to delete job. Please try again.')
  }
}

onMounted(() => {
  fetchJob()
})
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <AppNavbar />

    <!-- Subheader with Back + Edit -->
    <div class="bg-base-200 border-b border-base-300">
      <div class="w-full max-w-7xl mx-auto px-4 py-3" style="max-width: 1200px;">
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <NuxtLink to="/" class="btn btn-ghost btn-sm">← Back</NuxtLink>
            <h1 class="text-xl font-bold">Job Application</h1>
          </div>
          <div class="flex items-center gap-2">
            <button 
              v-if="job && !isEditing"
              @click="isEditing = true"
              class="btn btn-ghost btn-sm"
            >Edit</button>
            <button 
              v-if="isEditing"
              @click="saveApplication"
              class="btn btn-primary btn-sm"
              :disabled="saving"
            >
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="w-full max-w-7xl mx-auto px-4 py-6" style="max-width: 1200px;">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="alert alert-error">
        <span>{{ error }}</span>
      </div>

      <div v-else-if="job" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Job Details -->
        <div class="lg:col-span-1">
          <div class="card bg-base-100 shadow-sm border border-base-300">
            <div class="card-body">
              <h2 class="card-title text-xl">{{ job.title }}</h2>
              <p class="text-muted">{{ job.company }}</p>
              <p class="text-sm">{{ job.location }}</p>
              
              <div class="flex flex-wrap gap-1 mt-3">
                <span v-for="tag in job.tags" :key="tag" class="badge badge-sm badge-ghost">{{ tag }}</span>
                <span v-if="job.is_remote" class="badge badge-sm badge-success">Remote</span>
              </div>

              <div class="divider"></div>

              <div class="space-y-2">
                <p v-if="job.salary_min || job.salary_max" class="text-sm">
                  <span class="font-medium">Salary:</span> 
                  ${{ formatSalary(job.salary_min) }} - ${{ formatSalary(job.salary_max) }}
                </p>
                <p class="text-sm">
                  <span class="font-medium">Status:</span>
                  <span class="badge badge-sm ml-2" :class="statusClass">{{ job.status }}</span>
                </p>
                <p class="text-sm text-muted">
                  Scraped: {{ formatDate(job.date_scraped) }}
                </p>
              </div>

              <div class="card-actions mt-4">
                <a :href="job.url" target="_blank" class="btn btn-outline btn-sm w-full">
                  View Original Posting ↗
                </a>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card bg-base-100 shadow-sm border border-base-300 mt-4">
            <div class="card-body">
              <h3 class="font-semibold mb-3">Quick Actions</h3>
              <div class="flex flex-wrap gap-2">
                <button 
                  @click="updateStatus('applied')"
                  class="btn btn-sm" 
                  :class="job.status === 'applied' ? 'btn-primary' : 'btn-outline'"
                >
                  Mark Applied
                </button>
                <button 
                  @click="updateStatus('interview')"
                  class="btn btn-sm"
                  :class="job.status === 'interview' ? 'btn-primary' : 'btn-outline'"
                >
                  Mark Interview
                </button>
                <button 
                  @click="updateStatus('offer')"
                  class="btn btn-sm"
                  :class="job.status === 'offer' ? 'btn-primary' : 'btn-outline'"
                >
                  Mark Offer
                </button>
                <button 
                  @click="deleteJob"
                  class="btn btn-error btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Column: Application Questions & Answers -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Cover Letter -->
          <div class="card bg-base-100 shadow-sm border border-base-300">
            <div class="card-body">
              <div class="flex justify-between items-center mb-4">
                <h3 class="card-title text-lg">Cover Letter</h3>
                <button
                  v-if="!isEditing && application.cover_letter"
                  @click="downloadCoverLetter"
                  :disabled="downloadingCoverLetter"
                  class="btn btn-outline btn-sm"
                >
                  {{ downloadingCoverLetter ? 'Generating...' : '⬇ Download Word' }}
                </button>
              </div>
              <textarea
                v-if="isEditing"
                v-model="application.cover_letter"
                class="textarea textarea-bordered w-full h-32"
                placeholder="Write your cover letter here..."
              ></textarea>
              <div v-else class="bg-base-200 p-4 rounded-lg min-h-[100px]">
                <p v-if="application.cover_letter" class="whitespace-pre-wrap">{{ application.cover_letter }}</p>
                <p v-else class="text-muted italic">No cover letter written yet.</p>
              </div>
            </div>
          </div>

          <!-- Application Questions -->
          <div class="card bg-base-100 shadow-sm border border-base-300">
            <div class="card-body">
              <div class="flex justify-between items-center mb-4">
                <h3 class="card-title text-lg">Application Questions</h3>
                <button v-if="isEditing" @click="addQuestion" class="btn btn-ghost btn-sm">+ Add Question</button>
              </div>

              <div v-if="application.questions.length === 0" class="text-center py-8 text-muted">
                <p>No questions added yet.</p>
                <p class="text-sm">Click "Edit" to add application questions.</p>
              </div>

              <div v-else class="space-y-4">
                <div 
                  v-for="(qa, index) in application.questions" 
                  :key="index"
                  class="border border-base-300 rounded-lg p-4"
                >
                 <!-- Question -->
                 <div class="mb-3">
                   <label class="label text-sm font-medium">Question {{ index + 1 }}</label>
                   <input
                     v-if="isEditing"
                     v-model="qa.question"
                     class="input input-bordered w-full"
                     placeholder="Enter the question..."
                   />
                   <p v-else class="font-medium">{{ qa.question }}</p>
                 </div>

                 <!-- Category -->
                 <div class="mb-3" v-if="isEditing">
                   <label class="label text-sm font-medium">Category</label>
                   <select v-model="qa.category" class="select select-bordered w-full select-sm">
                     <option value="technical">Technical</option>
                     <option value="behavioral">Behavioral</option>
                     <option value="other">Other</option>
                   </select>
                 </div>

                 <!-- Answer -->
                 <div>
                   <label class="label text-sm font-medium">Your Answer</label>
                   <textarea
                     v-if="isEditing"
                     v-model="qa.answer"
                     class="textarea textarea-bordered w-full"
                     rows="3"
                     placeholder="Write your answer..."
                   ></textarea>
                   <div v-else class="bg-base-200 p-3 rounded-lg">
                     <p v-if="qa.answer" class="whitespace-pre-wrap">{{ qa.answer }}</p>
                     <p v-else class="text-muted italic">No answer recorded.</p>
                   </div>
                 </div>

                 <!-- Remove button -->
                 <button 
                   v-if="isEditing"
                   @click="removeQuestion(index)"
                   class="btn btn-ghost btn-xs text-error mt-2"
                 >
                   Remove Question
                 </button>
               </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="card bg-base-100 shadow-sm border border-base-300">
            <div class="card-body">
              <h3 class="card-title text-lg">Notes</h3>
              <textarea
                v-if="isEditing"
                v-model="application.notes"
                class="textarea textarea-bordered w-full h-24"
                placeholder="Any additional notes..."
              ></textarea>
              <div v-else class="bg-base-200 p-4 rounded-lg min-h-[80px]">
                <p v-if="application.notes" class="whitespace-pre-wrap">{{ application.notes }}</p>
                <p v-else class="text-muted italic">No notes added.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
