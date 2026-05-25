<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface TimeSlot {
  date: string
  new: number
  applied: number
  interview: number
  offer: number
}

const props = defineProps<{
  data: TimeSlot[]
}>()

// Format date for display
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

const chartData = computed(() => ({
  labels: props.data.map(d => formatDate(d.date)),
  datasets: [
    {
      label: 'New Jobs',
      data: props.data.map(d => d.new),
      borderColor: '#6b7280',
      backgroundColor: 'rgba(107, 114, 128, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Applied',
      data: props.data.map(d => d.applied),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Interviews',
      data: props.data.map(d => d.interview),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      fill: true,
      tension: 0.4
    },
    {
      label: 'Offers',
      data: props.data.map(d => d.offer),
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const
    },
    tooltip: {
      mode: 'index' as const,
      intersect: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      }
    },
    y: {
      beginAtZero: true,
      ticks: {
        stepSize: 1
      }
    }
  },
  interaction: {
    mode: 'nearest' as const,
    axis: 'x' as const,
    intersect: false
  }
}
</script>

<template>
  <div class="chart-container" style="height: 300px;">
    <Line :data="chartData" :options="chartOptions" /></Line>
  </div>
</template>
