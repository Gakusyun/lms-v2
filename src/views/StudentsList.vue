<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue'
import DataTable from '../components/DataTable.vue'
import PaginationBar from '../components/PaginationBar.vue'
import Modal from '../components/Modal.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import http from '../utils/http'
import { getPagedData } from '../api/common'
import { formatDate } from '../utils/formatters'
import { changeUserPassword } from '../api/auth'
import { ref, onMounted, reactive } from 'vue'

type Student = {
  student_id: string
  student_name: string
  school_name: string
  guarantee_permission: string | Date
  reviewer_id?: string
  reviewer_name?: string
}

const auth = useAuthStore()
const toast = useToast()

// List state
const page = ref<number>(1)
const pageSize = ref<number>(10)
const totalPages = ref<number>(1)
const total = ref<number>(0)
const loading = ref(false)
const students = ref<Student[]>([])

const studentColumns = [
  { key: 'student_id', label: '学号' },
  { key: 'student_name', label: '学生姓名' },
  { key: 'school_name', label: '院系' },
  { key: 'guarantee_permission', label: '担保权限生效时间', format: (v: any) => formatDate(v) },
  { key: 'reviewer_id', label: '审核人ID' },
  { key: 'reviewer_name', label: '审核人姓名' },
]

// Change password modal state
const changePwdModal = ref(false)
const selectedUserId = ref<number | null>(null)
const pwdForm = reactive({ oldPassword: '', newPassword: '' })
const pwdSubmitting = ref(false)

// Import related

async function fetchStudents() {
  loading.value = true
  try {
    const res = await getPagedData<Student>('/students', page.value, pageSize.value) as any
    students.value = res.data
    total.value = res.total
    totalPages.value = res.totalPages
  } catch (e) {
    toast.error('Failed to fetch students')
  } finally {
    loading.value = false
  }
}

function onPageChange(p: number) {
  page.value = p
  fetchStudents()
}
function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  fetchStudents()
}

function openChangePwd(userId: number) {
  selectedUserId.value = userId
  changePwdModal.value = true
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
}
async function submitChangePwd() {
  if (!selectedUserId.value) return
  pwdSubmitting.value = true
  try {
    await changeUserPassword(Number(selectedUserId.value), {
      old_password: pwdForm.oldPassword,
      new_password: pwdForm.newPassword,
    })
    toast.success('Password changed successfully')
    changePwdModal.value = false
  } catch {
    toast.error('Failed to change password')
  } finally {
    pwdSubmitting.value = false
  }
}

async function downloadStudentTemplate() {
  const token = localStorage.getItem('token')
  const baseURL = import.meta.env.DEV
    ? 'http://localhost:8000/api/v1'
    : (import.meta.env.VITE_API_BASE_URL || 'https://lms.gxj62.cn/api/v1')
  const response = await fetch(`${baseURL}/students/import/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'student_import_template.xlsx')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

async function onStudentImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await http.post('/students/import', formData) as any
    toast.success(`Imported: ${res.imported ?? 0} rows`)
  } catch {
    toast.error('Import failed')
  } finally {
    if (input) input.value = ''
  }
}

onMounted(() => {
  fetchStudents()
})
</script>

<template>
  <AppLayout>
    <div class="p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold">Students</h1>
        <div class="flex items-center gap-2">
          <button v-if="auth.isAdmin" class="px-3 py-1.5 bg-blue-600 text-white rounded" @click="downloadStudentTemplate">下载导入模板</button>
          <label v-if="auth.isAdmin" class="px-3 py-1.5 bg-indigo-600 text-white rounded cursor-pointer">
            批量导入
            <input type="file" class="hidden" accept=".xlsx,.xls,.csv" @change="onStudentImport" />
          </label>
        </div>
      </div>

      <DataTable
        :columns="studentColumns"
        :data="students"
        :loading="loading"
        emptyText="暂无数据"
        :showActions="auth.isAdmin"
      >
        <template #actions="{ row }">
          <button v-if="auth.isAdmin" class="text-sm text-blue-600" @click="openChangePwd(row.student_id)">修改密码</button>
        </template>
      </DataTable>

      <PaginationBar
        :currentPage="page"
        :totalPages="totalPages"
        :total="total"
        :pageSize="pageSize"
        :loading="loading"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      />
    </div>

    <Modal :show="changePwdModal" title="Change Password" @close="changePwdModal = false">
      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Old Password</label>
          <input v-model="pwdForm.oldPassword" type="password" class="mt-1 w-full border rounded p-2" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">New Password</label>
          <input v-model="pwdForm.newPassword" type="password" class="mt-1 w-full border rounded p-2" />
        </div>
        <div class="flex justify-end space-x-2">
          <button class="px-3 py-1.5 border rounded" @click="() => changePwdModal = false">Cancel</button>
          <button class="px-3 py-1.5 bg-green-600 text-white rounded" :disabled="pwdSubmitting" @click="submitChangePwd">Change</button>
        </div>
      </div>
    </Modal>
  </AppLayout>
  <!-- Import input is triggered by the Import button and reused by the TeachersList.vue counterpart -->
</template>
