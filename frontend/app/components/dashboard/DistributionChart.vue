<script setup lang="ts">
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
)

const props = defineProps<{
  data: Record<string, number>
  title: string
}>()

const labels = computed(() => Object.keys(props.data))
const values = computed(() => Object.values(props.data))

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#22c55e', // green
  '#ef4444', // red
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#6b7280', // gray
]

const chartData = computed(() => ({
  labels: labels.value.map(formatLabel),
  datasets: [{
    data: values.value,
    backgroundColor: COLORS.slice(0, labels.value.length),
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  }]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        padding: 15,
        usePointStyle: true
      }
    }
  }
}

function formatLabel(key: string): string {
  const map: Record<string, string> = {
    'frontend': 'Frontend',
    'backend': 'Backend',
    'fullstack': 'Full Stack',
    'support': 'Support',
    'devops': 'DevOps',
    'mobile': 'Mobile',
    'data': 'Data/ML',
    'other': 'Other'
  }
  return map[key] || key
}
</script>

<template>
  <div>
    <h4 class="font-semibold mb-4 text-center">{{ title }}</h4>
    <div class="chart-container" style="height: 250px;">
      <Doughnut :data="chartData" :options="chartOptions" /></Doughnut>
    </div>
  </div>
</template>
