<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

const props = defineProps<{
  data: { week: string; applied: number; interview: number; offer: number }[]
}>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.week),
  datasets: [
    {
      label: 'Applied',
      data: props.data.map(d => d.applied),
      backgroundColor: 'rgba(59, 130, 246, 0.8)'
    },
    {
      label: 'Interview',
      data: props.data.map(d => d.interview),
      backgroundColor: 'rgba(139, 92, 246, 0.8)'
    },
    {
      label: 'Offer',
      data: props.data.map(d => d.offer),
      backgroundColor: 'rgba(34, 197, 94, 0.8)'
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    }
  },
  scales: {
    x: {
      stacked: false,
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      stacked: false,
      ticks: {
        stepSize: 1
      }
    }
  }
}
</script>

<template>
  <div class="chart-container" style="height: 250px;">
    <Bar :data="chartData" :options="chartOptions" />
  </div>
</template>
