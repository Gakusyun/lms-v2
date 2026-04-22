<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue'
import DataTable from '../components/DataTable.vue'
import PaginationBar from '../components/PaginationBar.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import http from '../utils/http'
import { getPagedData } from '../api/common'
import { useRouter } from 'vue-router'
import { onMounted, ref, computed, watch } from 'vue'

const auth = useAuthStore()
const toast = useToast()
const router = useRouter()

const endpoint = '/courses'

const courses = ref<any[]>([])
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)
const total = ref<number>(0)
const totalPages = ref<number>(1)
const loading = ref<boolean>(false)

const isStudent = computed(() => auth.isStudent)

const columns = [
  { key: 'course_id', label: '课程ID' },
  { key: 'course_name', label: '课程名称' },
  { key: 'class_hours', label: '课时' },
  { key: 'teacher_name', label: '教师姓名' },
  { key: 'enrollment_count', label: '选课人数', },
]

const importInput = ref<HTMLInputElement | null>(null)
function triggerImport() { importInput.value?.click() }

async function handleImport(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const form = new FormData()
  form.append('file', file)
  try {
    const res: any = await http.post('/courses/import', form) as any
    toast.success(`导入完成: ${res?.imported ?? 0}`)
    await fetchPage()
  } catch {
    toast.error('导入失败')
  }
}

async function downloadTemplate(endpointPath: string, filename: string) {
  const token = localStorage.getItem('token')
  const baseURL = import.meta.env.DEV
    ? 'http://localhost:8000/api/v1'
    : (import.meta.env.VITE_API_BASE_URL || 'https://lms.gxj62.cn/api/v1')
  try {
    const resp = await fetch(`${baseURL}${endpointPath}/import/template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!resp.ok) throw new Error(`下载失败: ${resp.status}`)
    const blob = await resp.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  } catch {
    toast.error('下载模板失败')
  }
}

async function fetchPage() {
  loading.value = true
  try {
    const res: any = await getPagedData<any>(endpoint, currentPage.value, pageSize.value)
    const items: any[] = res?.data ?? res?.items ?? []
    courses.value = items
    total.value = res?.total ?? 0
    totalPages.value = res?.totalPages ?? Math.ceil(total.value / pageSize.value)
  } catch {
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

function showStudents(row: any) {
  router.push(`/courses/${row.course_id}/students`)
}

onMounted(fetchPage)
watch([currentPage, pageSize], fetchPage)
</script>

<template>
  <AppLayout>
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-semibold">课程列表</h1>
        <div v-if="!isStudent" class="flex items-center space-x-2">
          <button class="px-3 py-1 bg-blue-600 text-white rounded" @click="downloadTemplate(endpoint, 'courses_template.xlsx')">下载模板</button>
          <label class="px-3 py-1 bg-green-600 text-white rounded cursor-pointer" @click="triggerImport()">
            导入
            <input ref="importInput" type="file" class="hidden" @change="handleImport" accept=".xlsx,.xls" />
          </label>
        </div>
      </div>

      <DataTable
        :columns="columns"
        :data="courses"
        :loading="loading"
        emptyText="暂无数据"
        :showActions="!isStudent"
      >
        <template #cell-course_id="slot">{{ slot.row.course_id }}</template>
        <template #cell-course_name="slot">{{ slot.row.course_name }}</template>
        <template #cell-class_hours="slot">{{ slot.row.class_hours }}</template>
        <template #cell-teacher_name="slot">{{ slot.row.teacher_name }}</template>
        <template #cell-enrollment_count="slot">{{ (slot.row.enrollment_count ?? 0) + ' 人' }}</template>
        <template #actions="slot">
          <button class="text-blue-500 hover:underline" @click="showStudents(slot.row)">查看学生名单</button>
        </template>
      </DataTable>

      <PaginationBar
        :currentPage="currentPage"
        :totalPages="totalPages"
        :total="total"
        :pageSize="pageSize"
        :loading="loading"
        @page-change="(p: number) => currentPage = p"
        @page-size-change="(s: number) => { pageSize = s; currentPage = 1 }"
      />
    </div>
  </AppLayout>
</template>
