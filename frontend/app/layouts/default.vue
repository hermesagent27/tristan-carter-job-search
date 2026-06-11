<script setup>
const { data: authStatus, refresh: checkAuth } = await useFetch('/api/auth/check')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-base-100">
    <header class="navbar bg-base-200 shadow-sm">
      <div class="flex-1">
        <NuxtLink to="/" class="btn btn-ghost text-xl">Job Tracker</NuxtLink>
      </div>
      <div class="flex-none">
        <button class="btn btn-ghost btn-sm" @click="logout">Logout</button>
      </div>
    </header>
    
    <main class="p-4">
      <NuxtPage />
    </main>
  </div>
</template>
