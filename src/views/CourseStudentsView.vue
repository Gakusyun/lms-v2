<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue'
import DataTable from '../components/DataTable.vue'
import PaginationBar from '../components/PaginationBar.vue'
import Modal from '../components/Modal.vue'
import { useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import http from '../utils/http'
import { createStudentCourse } from '../api/students'
import { formatDate } from '../utils/formatters'

type StudentCourse = {
  student_id: number
  student_name: string
  course_name: string
  teacher_name: string
  enrollment_date: string
  status: string
}

const route = useRoute()
const router = useRouter()
const courseId = Number(route.params.id)

const auth = useAuthStore()
const toast = useToast()

// Data
const students = ref<StudentCourse[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(1)

// Modal state
const showModal = ref(false)
const newStudentId = ref<number | null>(null)

const columns = [
  { key: 'student_id', label: '学号' },
  { key: 'student_name', label: '姓名' },
  { key: 'course_name', label: '课程名' },
  { key: 'teacher_name', label: '授课教师' },
  { key: 'enrollment_date', label: '注册时间' },
  { key: 'status', label: '状态' },
]

// Derived header value
const courseName = computed(() => students.value[0]?.course_name ?? '')
const isAdmin = computed(() => auth.isAdmin)

async function fetchStudents() {
  loading.value = true
  try {
    const res = await http.get('/student-courses/course/' + courseId)
    const data = res as any
    students.value = (data ?? []) as StudentCourse[]
    total.value = students.value.length
    totalPages.value = 1
  } finally {
    loading.value = false
  }
}

async function addStudent() {
  if (!newStudentId.value) return
  try {
    await createStudentCourse({ student_id: newStudentId.value, course_id: courseId })
    toast.success('学生已添加到课程')
    showModal.value = false
    newStudentId.value = null
    await fetchStudents()
  } catch {
    toast.error('添加失败')
  }
}

function goBack() {
  router.push('/courses')
}

onMounted(() => {
  fetchStudents()
})

// Helpers for template slots
function enrollmentDateFmt(v: string) {
  return v ? formatDate(v) : ''
}
const getStatusBadgeClass = (s: string) => {
  // Simple badge mapping, reuse existing formatter if available
  return s === 'active' ? 'text-sm font-semibold text-green-700' : 'text-sm text-gray-600'
}
</script>

<template>
  <AppLayout>
    <div class="p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold">课程学生名单</h1>
        <div class="flex items-center space-x-2">
          <button v-if="isAdmin" @click="showModal = true" class="btn">添加学生</button>
          <button @click="goBack" class="btn-secondary">返回课程列表</button>
        </div>
      </div>

      <div class="bg-white rounded shadow p-4">
        <div class="mb-2 text-sm text-gray-500">
          课程: {{ courseName || '暂无课程名' }}
        </div>
        <DataTable :columns="columns" :data="students" :loading="loading" emptyText="暂无学生">
          <template #cell-enrollment_date="{ row }">
            <span>{{ enrollmentDateFmt(row.enrollment_date) }}</span>
          </template>
          <template #cell-status="{ row }">
            <span :class="getStatusBadgeClass(row.status)">{{ row.status }}</span>
          </template>
        </DataTable>
        <PaginationBar :currentPage="page" :totalPages="totalPages" :total="total" :pageSize="pageSize" :loading="loading" @page-change="p => page = p" />
      </div>
    </div>

    <Modal :show="showModal" title="添加学生" maxWidth="sm" @close="showModal = false">
      <div class="space-y-3 p-4">
        <label class="block text-sm">学生ID</label>
        <input type="number" v-model="newStudentId" class="w-full border rounded px-3 py-2" />
        <div class="flex space-x-2 justify-end">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="addStudent">添加</button>
        </div>
      </div>
    </Modal>
  </AppLayout>
</template>

<!-- end of script -->
