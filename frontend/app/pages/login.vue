<script setup>
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
    navigateTo('/')
  } catch (e) {
    error.value = 'Wrong password'
    loading.value = false
  }
}
</script>

<template>
  <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 1rem; background: #1a1a2e;">
    <div style="background: #16213e; padding: 2rem; border-radius: 8px; width: 100%; max-width: 360px;">
      <h1 style="text-align: center; color: white; margin-bottom: 1.5rem; font-size: 1.5rem;">Job Tracker</h1>

      <form @submit.prevent="login">
        <div style="margin-bottom: 1rem;">
          <label style="display: block; color: #94a3b8; margin-bottom: 0.5rem; font-size: 0.875rem;">Password</label>
          <input
            v-model="password"
            type="password"
            placeholder="Enter password..."
            required
            style="width: 100%; padding: 0.75rem; border: 1px solid #334155; border-radius: 4px; background: #0f172a; color: white; font-size: 1rem; box-sizing: border-box;"
          />
        </div>

        <div v-if="error" style="background: #ef4444; color: white; padding: 0.75rem; border-radius: 4px; margin-bottom: 1rem; font-size: 0.875rem;">
          {{ error }}
        </div>

        <button
          type="submit"
          :disabled="loading"
          style="width: 100%; padding: 0.875rem; background: #3b82f6; color: white; border: none; border-radius: 4px; font-size: 1rem; cursor: pointer;"
        >
          <span v-if="loading">Loading...</span>
          <span v-else>Login</span>
        </button>
      </form>
    </div>
  </div>
</template>
