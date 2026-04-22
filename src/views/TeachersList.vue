<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue'
import DataTable from '../components/DataTable.vue'
import PaginationBar from '../components/PaginationBar.vue'
import Modal from '../components/Modal.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import http from '../utils/http'
import { getPagedData } from '../api/common'
import { changeUserPassword } from '../api/auth'
import { ref, onMounted, reactive } from 'vue'

type Teacher = {
  teacher_id: string
  teacher_name: string
}

const auth = useAuthStore()
const toast = useToast()

// List state
const page = ref<number>(1)
const pageSize = ref<number>(10)
const totalPages = ref<number>(1)
const total = ref<number>(0)
const loading = ref(false)
const teachers = ref<Teacher[]>([])

const teacherColumns = [
  { key: 'teacher_id', label: '教师ID' },
  { key: 'teacher_name', label: '姓名' },
]

// Change password modal state
const changePwdModal = ref(false)
const selectedUserId = ref<number | null>(null)
const pwdForm = reactive({ oldPassword: '', newPassword: '' })
const pwdSubmitting = ref(false)

// Import input ref
async function fetchTeachers() {
  loading.value = true
  try {
    const res = await getPagedData<Teacher>('/teachers', page.value, pageSize.value) as any
    teachers.value = res.data
    total.value = res.total
    totalPages.value = res.totalPages
  } catch {
    toast.error('Failed to fetch teachers')
  } finally {
    loading.value = false
  }
}

function onPageChange(p: number) {
  page.value = p
  fetchTeachers()
}
function onPageSizeChange(size: number) {
  pageSize.value = size
  page.value = 1
  fetchTeachers()
}

async function openChangePwd(userId: number) {
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

async function downloadTemplate() {
  const token = localStorage.getItem('token')
  const baseURL = import.meta.env.DEV
    ? 'http://localhost:8000/api/v1'
    : (import.meta.env.VITE_API_BASE_URL || 'https://lms.gxj62.cn/api/v1')
  const response = await fetch(`${baseURL}/teachers/import/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'teacher_import_template.xlsx')
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}

async function onTeacherImport(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const formData = new FormData()
  formData.append('file', file)
  try {
    const res = await http.post('/teachers/import', formData) as any
    toast.success(`Imported: ${res.imported ?? 0} rows`)
  } catch {
    toast.error('Import failed')
  } finally {
    if (input) input.value = ''
  }
}

onMounted(() => {
  fetchTeachers()
})
</script>

<template>
  <AppLayout>
    <div class="p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold">Teachers</h1>
        <div class="flex items-center gap-2">
          <button v-if="auth.isAdmin" class="px-3 py-1.5 bg-blue-600 text-white rounded" @click="downloadTemplate">下载导入模板</button>
          <label v-if="auth.isAdmin" class="px-3 py-1.5 bg-indigo-600 text-white rounded cursor-pointer">
            批量导入
            <input type="file" class="hidden" accept=".xlsx,.xls,.csv" @change="onTeacherImport" />
          </label>
        </div>
      </div>

      <DataTable
        :columns="teacherColumns"
        :data="teachers"
        :loading="loading"
        emptyText="暂无数据"
        :showActions="auth.isAdmin"
      >
        <template #actions="{ row }">
          <button v-if="auth.isAdmin" class="text-sm text-blue-600" @click="openChangePwd(row.teacher_id)">修改密码</button>
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
  <!-- hidden input forTeacherImport is rendered in header section -->
</template>
