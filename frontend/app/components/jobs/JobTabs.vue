<script setup lang="ts">
interface Tab {
  id: 'post' | 'applied' | 'interview' | 'offer'
  label: string
}

const tabs: Tab[] = [
  { id: 'post', label: 'Post' },
  { id: 'applied', label: 'Applied' },
  { id: 'interview', label: 'Interview' },
  { id: 'offer', label: 'Offer' }
]

interface Props {
  modelValue: 'post' | 'applied' | 'interview' | 'offer'
  counts: Record<string, number>
}

defineProps<Props>()
defineEmits<{
  (e: 'update:modelValue', value: 'post' | 'applied' | 'interview' | 'offer'): void
}>()
</script>

<template>
  <div class="tabs tabs-boxed bg-base-200">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      @click="$emit('update:modelValue', tab.id)"
      class="tab"
      :class="{ 'tab-active': modelValue === tab.id }"
    >
      {{ tab.label }} ({{ counts[tab.id] || 0 }})
    </button>
  </div>
</template>
