<script setup lang="ts">
const { data: authStatus } = await useFetch('/api/auth/check')

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  navigateTo('/login')
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
          <button class="btn btn-ghost btn-sm text-error" @click="logout">Logout</button>
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
            <li class="menu-title">Account</li>
            <li><button @click="logout" class="text-error">Logout</button></li>
          </ul>
        </div>
      </div>
    </div>
  </header>
</template>
