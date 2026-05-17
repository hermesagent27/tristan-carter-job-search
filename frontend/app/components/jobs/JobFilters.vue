<template>
  <div class="flex flex-wrap gap-3 items-center">
    <!-- Search -->
    <div class="form-control flex-1 min-w-[200px]">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search jobs..."
        class="input input-bordered input-sm w-full"
      />
    </div>
    
    <!-- Role Filter -->
    <select v-model="roleFilter" class="select select-bordered select-sm">
      <option value="">All Roles</option>
      <option value="frontend">Frontend</option>
      <option value="backend">Backend</option>
      <option value="fullstack">Fullstack</option>
      <option value="support">Support</option>
    </select>
    
    <!-- Remote Toggle -->
    <label class="label cursor-pointer gap-2">
      <span class="label-text">Remote</span>
      <input v-model="remoteOnly" type="checkbox" class="toggle toggle-sm" />
    </label>
    
    <!-- Clear filters -->
    <button 
      v-if="searchQuery || roleFilter || remoteOnly"
      @click="clearFilters"
      class="btn btn-ghost btn-sm"
    >
      Clear
    </button>
  </div>
</template>

<script setup lang="ts">
const searchQuery = defineModel<string>('searchQuery')
const roleFilter = defineModel<string>('roleFilter')
const remoteOnly = defineModel<boolean>('remoteOnly')

const clearFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  remoteOnly.value = false
}
</script>
