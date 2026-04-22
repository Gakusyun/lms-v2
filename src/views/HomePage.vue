<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppLayout from '../layouts/AppLayout.vue'
import { useAuthStore } from '../stores/auth'
import http from '../utils/http'

const router = useRouter()
const auth = useAuthStore()

// Count refs
const studentsCount = ref(0)
const leavesCount = ref(0)
const coursesCount = ref(0)
const reviewersCount = ref(0)
const teachersCount = ref(0)
const auditLogsCount = ref(0)
const schoolsCount = ref(0)

// Role-based card visibility
const showStudents = computed(() => auth.isAdmin || auth.isReviewer)
const showLeaves = computed(() => true)
const showReviewers = computed(() => auth.isAdmin || auth.isReviewer || auth.isStudent)
const showTeachers = computed(() => auth.isAdmin || auth.isReviewer || auth.isTeacher || auth.isStudent)
const showCourses = computed(() => true)
const showSchools = computed(() => auth.isAdmin)
const showVerifyQr = computed(() => true)
const showAuditLogs = computed(() => auth.isAdmin)
const showStatistics = computed(() => auth.isAdmin || auth.isReviewer)

function goto(path: string) {
  router.push(path)
}

// Fetch helpers
async function fetchCount(endpoint: string, key: string): Promise<number> {
  try {
    const res = await http.get(endpoint) as any
    return res?.[key] ?? 0
  } catch {
    return 0
  }
}

onMounted(async () => {
  // Parallel fetch based on visibility
  const promises: Promise<void>[] = []

  if (showStudents.value) {
    promises.push(fetchCount('/students/count', 'students_count').then(c => { studentsCount.value = c }))
  }
  promises.push(fetchCount('/leaves/count', 'leaves_count').then(c => { leavesCount.value = c }))
  promises.push(fetchCount('/courses/count', 'courses_count').then(c => { coursesCount.value = c }))

  if (showReviewers.value) {
    promises.push(fetchCount('/reviewers/count', 'reviewers_count').then(c => { reviewersCount.value = c }))
  }
  if (showTeachers.value) {
    promises.push(fetchCount('/teachers/count', 'teachers_count').then(c => { teachersCount.value = c }))
  }
  if (showAuditLogs.value) {
    promises.push(fetchCount('/audit-logs/count', 'total').then(c => { auditLogsCount.value = c }))
  }
  if (showSchools.value) {
    promises.push(fetchCount('/schools/count', 'schools_count').then(c => { schoolsCount.value = c }))
  }

  await Promise.all(promises)
})

interface FeatureCard {
  title: string
  icon: string
  count: number
  description: string
  path: string
  visible: boolean
}

const cards = computed<FeatureCard[]>(() => [
  { title: '学生管理', icon: '👨‍🎓', count: studentsCount.value, description: '查看和管理所有学生信息', path: '/students', visible: showStudents.value },
  { title: '请假条管理', icon: '📝', count: leavesCount.value, description: '处理和审核请假申请', path: '/leaves', visible: showLeaves.value },
  { title: '审核员管理', icon: '📋', count: reviewersCount.value, description: '管理审核员权限和设置', path: '/reviewers', visible: showReviewers.value },
  { title: '教师管理', icon: '🧑‍🏫', count: teachersCount.value, description: '维护教师信息档案', path: '/teachers', visible: showTeachers.value },
  { title: '课程管理', icon: '📚', count: coursesCount.value, description: '设置和管理课程信息', path: '/courses', visible: showCourses.value },
  { title: '院系管理', icon: '🏫', count: schoolsCount.value, description: '管理部门信息', path: '/schools', visible: showSchools.value },
  { title: '凭证核验', icon: '🔍', count: 0, description: '核验学生请假二维码凭证', path: '/verify-qr', visible: showVerifyQr.value },
  { title: '审计日志', icon: '📜', count: auditLogsCount.value, description: '查看系统操作审计日志', path: '/audit-logs', visible: showAuditLogs.value },
  { title: '数据统计', icon: '📊', count: 0, description: '请假趋势与数据可视化分析', path: '/statistics', visible: showStatistics.value },
])

const visibleCards = computed(() => cards.value.filter(c => c.visible))
</script>

<template>
  <AppLayout>
    <div>
      <h1 class="text-2xl font-bold mb-6">欢迎使用请假管理系统</h1>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="card in visibleCards"
          :key="card.path"
          class="bg-white rounded-xl shadow hover:shadow-md p-4 cursor-pointer transition-shadow"
          @click="goto(card.path)"
        >
          <div class="flex items-center gap-4">
            <div class="text-4xl">{{ card.icon }}</div>
            <div>
              <div class="text-sm text-slate-500">{{ card.title }}</div>
              <div v-if="card.count > 0" class="text-2xl font-semibold">{{ card.count }}</div>
              <div class="text-xs text-slate-400">{{ card.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
