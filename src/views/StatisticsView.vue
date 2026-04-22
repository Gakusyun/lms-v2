<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { getLeaveStatistics, getLeaveTrend, getUserStatistics, getReviewerStudentsStatistics } from '../api/statistics'
import { Doughnut, Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(ArcElement, LineElement, BarElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend, Filler)

const auth = useAuthStore()
const toast = useToast()

const loading = ref(true)
const error = ref('')

// Raw data from API
const leaveStats = ref<{ status: string; count: number }[]>([])
const trendData = ref<{ date: string; count: number }[]>([])
const userStats = ref<{ students: number; teachers: number; reviewers: number }>({ students: 0, teachers: 0, reviewers: 0 })
const reviewerStudents = ref<any[]>([])

// Chart data objects (reactive)
const pieData = computed(() => ({
  labels: leaveStats.value.map(s => s.status),
  datasets: [{
    data: leaveStats.value.map(s => s.count),
    backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
  }]
}))

const pieOptions = { responsive: true, plugins: { title: { display: true, text: '请假状态分布' } } }

const lineData = computed(() => ({
  labels: trendData.value.map(t => t.date?.substring(5, 10) ?? ''),
  datasets: [{
    label: '请假次数',
    data: trendData.value.map(t => t.count),
    fill: true,
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59,130,246,0.1)',
    tension: 0.4,
  }]
}))

const lineOptions = { responsive: true, plugins: { title: { display: true, text: '近30天请假趋势' } } }

const barData = computed(() => ({
  labels: ['学生', '教师', '审核员'],
  datasets: [{
    label: '人数',
    data: [userStats.value.students, userStats.value.teachers, userStats.value.reviewers],
    backgroundColor: ['#6366f1', '#10b981', '#f59e0b'],
    borderRadius: 5,
  }]
}))

const barOptions = { responsive: true, plugins: { title: { display: true, text: '用户统计' } } }

async function fetchStatistics() {
  loading.value = true
  error.value = ''
  try {
    const [statsRes, trendRes] = await Promise.all([
      getLeaveStatistics() as any,
      getLeaveTrend(30) as any,
    ])
    leaveStats.value = statsRes?.leave_statistics ?? []
    trendData.value = trendRes?.leave_trend ?? []

    if (auth.isAdmin) {
      const userRes = await getUserStatistics() as any
      userStats.value = userRes?.user_statistics ?? { students: 0, teachers: 0, reviewers: 0 }
    }

    if (auth.isReviewer) {
      const revRes = await getReviewerStudentsStatistics() as any
      reviewerStudents.value = revRes?.students_statistics ?? []
    }
  } catch {
    error.value = '获取统计数据失败'
    toast.error('获取统计数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(fetchStatistics)
</script>

<template>
  <AppLayout>
    <div class="space-y-6">
      <h1 class="text-xl font-semibold">数据统计与可视化</h1>

      <div v-if="loading" class="flex items-center justify-center py-16">
        <span class="inline-block w-8 h-8 border-2 border-t-transparent border-blue-600 rounded-full animate-spin mr-3"></span>
        <span class="text-slate-500">正在加载统计数据...</span>
      </div>

      <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">{{ error }}</div>

      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-xl shadow p-4">
            <Doughnut :data="pieData" :options="pieOptions" />
          </div>
          <div class="bg-white rounded-xl shadow p-4">
            <Line :data="lineData" :options="lineOptions" />
          </div>
          <div v-if="auth.isAdmin" class="bg-white rounded-xl shadow p-4">
            <Bar :data="barData" :options="barOptions" />
          </div>
        </div>

        <!-- Reviewer student stats table -->
        <div v-if="auth.isReviewer && reviewerStudents.length > 0" class="bg-white rounded-xl shadow p-4">
          <h3 class="text-lg font-semibold mb-3">管理学生请假统计</h3>
          <div class="overflow-auto">
            <table class="min-w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="px-3 py-2 text-left">学生ID</th>
                  <th class="px-3 py-2 text-left">学生姓名</th>
                  <th class="px-3 py-2 text-left">请假总数</th>
                  <th class="px-3 py-2 text-left">已批准</th>
                  <th class="px-3 py-2 text-left">已拒绝</th>
                  <th class="px-3 py-2 text-left">待审批</th>
                  <th class="px-3 py-2 text-left">批准率</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in reviewerStudents" :key="s.student_id" class="border-b hover:bg-slate-50">
                  <td class="px-3 py-2">{{ s.student_id }}</td>
                  <td class="px-3 py-2">{{ s.student_name }}</td>
                  <td class="px-3 py-2">{{ s.total_leaves }}</td>
                  <td class="px-3 py-2">{{ s.approved_leaves }}</td>
                  <td class="px-3 py-2">{{ s.rejected_leaves }}</td>
                  <td class="px-3 py-2">{{ s.pending_leaves }}</td>
                  <td class="px-3 py-2">{{ s.approval_rate }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </div>
  </AppLayout>
</template>
