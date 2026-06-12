<script setup lang="ts">
const showAddModal = ref(false)
const jobUrl = ref('')
const adding = ref(false)
const addError = ref('')

async function addJob() {
  if (!jobUrl.value.trim()) return
  
  adding.value = true
  addError.value = ''
  
  try {
    const response = await $fetch('/api/jobs/import', {
      method: 'POST',
      body: { url: jobUrl.value.trim() }
    })
    
    if (response.success) {
      jobUrl.value = ''
      showAddModal.value = false
      // Refresh jobs list
      await refreshNuxtData('jobs')
    } else {
      addError.value = response.error || 'Failed to add job'
    }
  } catch (e: any) {
    addError.value = e.message || 'Failed to add job'
  } finally {
    adding.value = false
  }
}
</script>

<template>
  <header class="bg-base-200 border-b border-base-300">
    <div class="w-full max-w-7xl mx-auto px-4 py-3" style="max-width: 1200px;">
      <div class="flex justify-between items-center">
        <!-- Logo -->
        <NuxtLink to="/" class="btn btn-ghost text-xl px-2">
          🎯 Job Tracker
        </NuxtLink>
        
        <!-- Desktop Nav -->
        <div class="hidden sm:flex items-center gap-1">
          <NuxtLink to="/" class="btn btn-ghost btn-sm">Jobs</NuxtLink>
          <NuxtLink to="/dashboard" class="btn btn-ghost btn-sm">Dashboard</NuxtLink>
          <NuxtLink to="/questions" class="btn btn-ghost btn-sm">Questions</NuxtLink>
          <div class="divider divider-horizontal mx-1"></div>
          <button class="btn btn-primary btn-sm" @click="showAddModal = true">+ Add Job</button>
        </div>
        
        <!-- Mobile Hamburger -->
        <div class="sm:hidden dropdown dropdown-end">
          <label tabindex="0" class="btn btn-ghost btn-circle">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 mt-4 z-50">
            <li><NuxtLink to="/">Jobs</NuxtLink></li>
            <li><NuxtLink to="/dashboard">Dashboard</NuxtLink></li>
            <li><NuxtLink to="/questions">Questions</NuxtLink></li>
            <li class="menu-title">Actions</li>
            <li><button @click="showAddModal = true" class="text-primary">+ Add Job</button></li>
          </ul>
        </div>
      </div>
    </div>
  </header>

  <!-- Add Job Modal -->
  <dialog :open="showAddModal" class="modal modal-bottom sm:modal-middle" @click.self="showAddModal = false">
    <div class="modal-box">
      <h3 class="font-bold text-lg mb-4">Add New Job</h3>
      <form @submit.prevent="addJob">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Job URL</span>
          </label>
          <input
            v-model="jobUrl"
            type="url"
            placeholder="https://linkedin.com/jobs/view/..."
            class="input input-bordered w-full"
            required
          />
          <label v-if="addError" class="label">
            <span class="label-text-alt text-error">{{ addError }}</span>
          </label>
        </div>
        <div class="modal-action">
          <button type="button" class="btn btn-ghost" @click="showAddModal = false">Cancel</button>
          <button type="submit" class="btn btn-primary" :disabled="adding || !jobUrl.trim()">
            {{ adding ? 'Adding...' : 'Add Job' }}
          </button>
        </div>
      </form>
    </div>
  </dialog>
</template>
