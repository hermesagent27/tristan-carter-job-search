<script setup lang="ts">
type SortOption = 'newest' | 'oldest' | 'company-az' | 'company-za'

const searchQuery = defineModel<string>('searchQuery')
const roleFilter = defineModel<string>('roleFilter')
const remoteOnly = defineModel<boolean>('remoteOnly')
const sortBy = defineModel<SortOption>('sortBy')

const clearFilters = () => {
  searchQuery.value = ''
  roleFilter.value = ''
  remoteOnly.value = false
}

const sortOptions = [
  { value: 'newest', label: 'Newest → Oldest' },
  { value: 'oldest', label: 'Oldest → Newest' },
  { value: 'company-az', label: 'Company A → Z' },
  { value: 'company-za', label: 'Company Z → A' },
]

const getLabel = (val: SortOption | undefined) => {
  if (!val) return 'Newest'
  const option = sortOptions.find(o => o.value === val)
  return option?.label || 'Sort'
}
</script>

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
      <option value="design">Design</option>
      <option value="support">Support/IT</option>
      <option value="devops">DevOps</option>
      <option value="mobile">Mobile</option>
      <option value="data">Data/ML</option>
      <option value="other">Other</option>
    </select>
    
    <!-- Remote Toggle -->
    <label class="label cursor-pointer gap-2">
      <span class="label-text">Remote</span>
      <input v-model="remoteOnly" type="checkbox" class="toggle toggle-sm" />
    </label>

    <!-- Sort Dropdown -->
    <div class="dropdown dropdown-end">
      <div tabindex="0" role="button" class="btn btn-outline btn-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
        Sort
      </div>
      <ul tabindex="0" class="dropdown-content menu p-2 shadow bg-base-200 rounded-box w-52 z-[1]">
        <li v-for="option in sortOptions" :key="option.value">
          <a 
            @click="sortBy = option.value"
            :class="{ 'active': sortBy === option.value || (!sortBy && option.value === 'newest') }"
          >
            {{ option.label }}
          </a>
        </li>
      </ul>
    </div>
    
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
