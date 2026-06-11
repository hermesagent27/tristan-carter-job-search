<script setup lang="ts">
definePageMeta({
  layout: false
})

const password = ref('')
const error = ref('')
const loading = ref(false)

async function login() {
  error.value = ''
  loading.value = true
  
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { password: password.value }
    })
    // Redirect to home on success
    navigateTo('/')
  } catch (e) {
    error.value = 'Incorrect password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-base-100 flex items-center justify-center p-4">
    <div class="card bg-base-200 shadow-xl w-full max-w-sm">
      <div class="card-body">
        <h1 class="card-title text-2xl font-bold text-center mb-6">Job Tracker</h1>
        
        <form @submit.prevent="login" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Password</span>
            </label>
            <input
              v-model="password"
              type="password"
              class="input input-bordered"
              placeholder="Enter password..."
              required
            />
          </div>
          
          <div v-if="error" class="alert alert-error text-sm py-2">
            {{ error }}
          </div>
          
          <button
            type="submit"
            class="btn btn-primary w-full"
            :disabled="loading"
          >
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            {{ loading ? 'Logging in...' : 'Login' }}
          </button>
        </form>
      </div>
    </div>
  </div>
</template>
