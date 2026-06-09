<script setup lang="ts">
import type { Question, QuestionCategory } from '~/types/questions'

const { data: questionsData, pending, refresh } = await useFetch('/api/questions')
const questions = computed(() => questionsData.value?.questions || [])

// Search and filters
const searchQuery = ref('')
const categoryFilter = ref<QuestionCategory>('all')
const answerFilter = ref<'all' | 'answered' | 'unanswered'>('all')

// Add new question modal
const showModal = ref(false)
const newQuestion = ref({
  question: '',
  answer: '',
  category: 'technical' as const
})

// Edit mode
const editingId = ref<string | null>(null)
const editAnswer = ref('')
const editQuestion = ref('')
const editCategory = ref<QuestionCategory>('technical')

// Custom delete confirmation dialog
const showDeleteConfirm = ref(false)
const deleteTargetId = ref<string | null>(null)
const deleteTargetQuestion = ref('')

const filteredQuestions = computed(() => {
  let result = questions.value
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(item => 
      item.question.toLowerCase().includes(q) ||
      item.answer.toLowerCase().includes(q) ||
      (item.job_company?.toLowerCase() || '').includes(q)
    )
  }
  
  if (categoryFilter.value !== 'all') {
    result = result.filter(item => item.category === categoryFilter.value)
  }
  
  if (answerFilter.value === 'answered') {
    result = result.filter(item => item.answer.trim().length > 0)
  } else if (answerFilter.value === 'unanswered') {
    result = result.filter(item => item.answer.trim().length === 0)
  }
  
  return result
})

const categoryCounts = computed(() => ({
  all: questions.value.length,
  technical: questions.value.filter(q => q.category === 'technical').length,
  behavioral: questions.value.filter(q => q.category === 'behavioral').length,
  other: questions.value.filter(q => q.category === 'other').length
}))

const addQuestion = async () => {
  if (!newQuestion.value.question.trim()) return
  
  await $fetch('/api/questions', {
    method: 'POST',
    body: {
      question: newQuestion.value.question,
      answer: newQuestion.value.answer,
      category: newQuestion.value.category
    }
  })
  
  newQuestion.value = { question: '', answer: '', category: 'technical' }
  showModal.value = false
  refresh()
}

const startEdit = (q: Question) => {
  editingId.value = q.id
  editQuestion.value = q.question
  editAnswer.value = q.answer
  editCategory.value = q.category
}

const saveEdit = async () => {
  if (!editingId.value) return
  
  await $fetch(`/api/questions/${editingId.value}`, {
    method: 'PATCH',
    body: {
      question: editQuestion.value,
      answer: editAnswer.value,
      category: editCategory.value
    }
  })
  
  editingId.value = null
  refresh()
}

const cancelEdit = () => {
  editingId.value = null
}

// Show delete confirmation dialog
const confirmDelete = (q: Question) => {
  deleteTargetId.value = q.id
  deleteTargetQuestion.value = q.question.slice(0, 100) + (q.question.length > 100 ? '...' : '')
  showDeleteConfirm.value = true
}

// Cancel delete
const cancelDelete = () => {
  deleteTargetId.value = null
  deleteTargetQuestion.value = ''
  showDeleteConfirm.value = false
}

// Execute delete
const executeDelete = async () => {
  if (!deleteTargetId.value) return
  
  try {
    const response = await $fetch(`/api/questions/${deleteTargetId.value}`, { 
      method: 'DELETE'
    })
    
    console.log('[Delete] Response:', response)
    
    if (response.success) {
      // Close dialog
      showDeleteConfirm.value = false
      deleteTargetId.value = null
      deleteTargetQuestion.value = ''
      // Refresh list
      await refresh()
    } else {
      alert('Failed to delete question')
    }
  } catch (e: any) {
    console.error('Failed to delete question:', e)
    alert(`Failed to delete: ${e.message || 'Unknown error'}`)
  }
}

const categoryBadgeClass = (cat: string) => {
  const map: Record<string, string> = {
    technical: 'badge-primary',
    behavioral: 'badge-secondary',
    other: 'badge-ghost'
  }
  return map[cat] || 'badge-ghost'
}
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <!-- Header -->
    <header class="bg-base-200 border-b border-base-300">
      <div class="w-full max-w-7xl mx-auto px-4 py-4" style="max-width: 1200px;">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex items-center gap-4 w-full sm:w-auto">
            <NuxtLink to="/" class="btn btn-ghost btn-sm">← Back</NuxtLink>
            <h1 class="text-2xl font-bold">All Questions</h1>
            
            <!-- Desktop Nav -->
            <NuxtLink to="/dashboard" class="hidden sm:inline-flex btn btn-ghost btn-sm">Dashboard</NuxtLink>
          </div>
          
          <div class="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
            <!-- Mobile Hamburger -->
            <div class="sm:hidden dropdown dropdown-end">
              <label tabindex="0" class="btn btn-ghost btn-circle">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </label>
              <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-4 z-50">
                <li><NuxtLink to="/dashboard">Dashboard</NuxtLink></li>
              </ul>
            </div>
            
            <button @click="showModal = true" class="btn btn-primary btn-sm">+ Add Question</button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="w-full max-w-7xl mx-auto px-4 py-6" style="max-width: 1200px;">
      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <!-- Search -->
        <div class="join w-full">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search questions..."
            class="input input-bordered w-full"
          />
          <button v-if="searchQuery" @click="searchQuery = ''" class="btn btn-ghost join-item">×</button>
        </div>
        
        <!-- Category filter -->
        <select v-model="categoryFilter" class="select select-bordered w-full">
          <option value="all">All Categories ({{ categoryCounts.all }})</option>
          <option value="technical">Technical ({{ categoryCounts.technical }})</option>
          <option value="behavioral">Behavioral ({{ categoryCounts.behavioral }})</option>
          <option value="other">Other ({{ categoryCounts.other }})</option>
        </select>
        
        <!-- Answer filter -->
        <select v-model="answerFilter" class="select select-bordered w-full">
          <option value="all">All</option>
          <option value="answered">Answered</option>
          <option value="unanswered">Unanswered</option>
        </select>
      </div>

      <!-- Results count -->
      <p class="text-sm text-muted mb-4">
        Showing {{ filteredQuestions.length }} of {{ questions.length }} questions
      </p>

      <!-- Loading -->
      <div v-if="pending" class="flex justify-center py-12">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Questions list -->
      <div v-else-if="filteredQuestions.length === 0" class="text-center py-12 text-muted">
        <p>No questions found.</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="q in filteredQuestions"
          :key="q.id"
          class="card bg-base-100 shadow-sm border border-base-300"
        >
          <div class="card-body p-4">
            <!-- View mode -->
            <template v-if="editingId !== q.id">
              <div class="flex justify-between items-start gap-4">
                <div class="flex-1">
                  <!-- Question line -->
                  <div class="flex items-center gap-2 mb-2 flex-wrap">
                    <span :class="`badge badge-sm ${categoryBadgeClass(q.category)}`">
                      {{ q.category }}
                    </span>
                    <p class="font-medium">{{ q.question }}</p>
                  </div>
                  
                  <!-- Answer -->
                  <div v-if="q.answer" class="bg-base-200 p-3 rounded-lg text-sm">
                    <p class="whitespace-pre-wrap">{{ q.answer }}</p>
                  </div>
                  <p v-else class="text-muted text-sm italic">No answer recorded</p>
                  
                  <!-- Job reference -->
                  <div v-if="q.job_company" class="mt-2 text-xs text-muted">
                    From: {{ q.job_company }} — {{ q.job_title }}
                  </div>
                </div>
                
                <!-- Actions -->
                <div class="flex flex-col gap-2">
                  <button @click="startEdit(q)" class="btn btn-ghost btn-xs">Edit</button>
                  <button @click="confirmDelete(q)" class="btn btn-ghost btn-xs text-error">Delete</button>
                </div>
              </div>
            </template>
            
            <!-- Edit mode -->
            <template v-else>
              <div class="space-y-3">
                <div>
                  <label class="label text-sm">Question</label>
                  <textarea v-model="editQuestion" class="textarea textarea-bordered w-full" rows="2"></textarea>
                </div>
                <div>
                  <label class="label text-sm">Answer</label>
                  <textarea v-model="editAnswer" class="textarea textarea-bordered w-full" rows="3"></textarea>
                </div>
                <div>
                  <label class="label text-sm">Category</label>
                  <select v-model="editCategory" class="select select-bordered w-full">
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="flex gap-2 justify-end">
                  <button @click="cancelEdit" class="btn btn-ghost btn-sm">Cancel</button>
                  <button @click="saveEdit" class="btn btn-primary btn-sm">Save</button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>

    <!-- Add Question Modal -->
    <dialog :open="showModal" class="modal modal-open" v-if="showModal">
      <div class="modal-box">
        <h3 class="text-lg font-bold mb-4">Add New Question</h3>
        <div class="space-y-3">
          <div>
            <label class="label text-sm">Category</label>
            <select v-model="newQuestion.category" class="select select-bordered w-full">
              <option value="technical">Technical</option>
              <option value="behavioral">Behavioral</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="label text-sm">Question</label>
            <textarea v-model="newQuestion.question" class="textarea textarea-bordered w-full" rows="3" placeholder="Enter the question..."></textarea>
          </div>
          <div>
            <label class="label text-sm">Answer (optional)</label>
            <textarea v-model="newQuestion.answer" class="textarea textarea-bordered w-full" rows="3" placeholder="Your answer..."></textarea>
          </div>
        </div>
        <div class="modal-action">
          <button @click="showModal = false" class="btn btn-ghost">Cancel</button>
          <button @click="addQuestion" class="btn btn-primary" :disabled="!newQuestion.question.trim()">Add</button>
        </div>
      </div>
      <div class="modal-backdrop" @click="showModal = false"></div>
    </dialog>

    <!-- Delete Confirmation Modal -->
    <dialog :open="showDeleteConfirm" class="modal modal-open" v-if="showDeleteConfirm">
      <div class="modal-box">
        <h3 class="text-lg font-bold mb-2 text-error">Delete Question?</h3>
        <div class="bg-error/10 p-4 rounded-lg mb-4">
          <p class="text-sm">This action cannot be undone. The question will be permanently removed from your archive.</p>
        </div>
        <div class="mb-4">
          <label class="label text-sm mb-1">Question to delete:</label>
          <p class="text-sm font-medium">"{{ deleteTargetQuestion }}"</p>
        </div>
        <div class="modal-action gap-4">
          <button @click="cancelDelete" class="btn btn-ghost btn-md min-w-[100px]">Cancel</button>
          <button @click="executeDelete" class="btn btn-error btn-md min-w-[140px]">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Forever
          </button>
        </div>
      </div>
      <div class="modal-backdrop" @click="cancelDelete"></div>
    </dialog>
  </div>
</template>
