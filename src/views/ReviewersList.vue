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
import { onMounted, ref, computed, watch } from 'vue'

const auth = useAuthStore()
const toast = useToast()

const endpoint = '/reviewers'

const rows = ref<any[]>([])
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)
const total = ref<number>(0)
const totalPages = ref<number>(1)
const loading = ref<boolean>(false)

const isAdmin = computed(() => auth.isAdmin)

const columns = [
  { key: 'reviewer_id', label: '审核员ID' },
  { key: 'reviewer_name', label: '姓名' },
  { key: 'role_name', label: '职务' },
  { key: 'school_name', label: '院系' },
]

const changePwdVisible = ref<boolean>(false)
const selectedReviewer = ref<any | null>(null)
const newPassword = ref<string>('')

const importInput = ref<HTMLInputElement | null>(null)
function triggerImport() { importInput.value?.click() }

async function handleImport(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const form = new FormData()
  form.append('file', file)
  try {
    const res: any = await http.post('/reviewers/import', form) as any
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
    rows.value = items
    total.value = res?.total ?? 0
    totalPages.value = res?.totalPages ?? Math.ceil(total.value / pageSize.value)
  } catch {
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

function openChangePwd(row: any) {
  selectedReviewer.value = row
  newPassword.value = ''
  changePwdVisible.value = true
}

async function submitPwd() {
  if (!selectedReviewer.value) return
  try {
    await changeUserPassword(selectedReviewer.value.reviewer_id, {
      old_password: '',
      new_password: newPassword.value,
    })
    toast.success('密码修改成功')
    changePwdVisible.value = false
  } catch {
    toast.error('修改失败')
  }
}

onMounted(fetchPage)
watch([currentPage, pageSize], fetchPage)
</script>

<template>
  <AppLayout>
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-semibold">审核员列表</h1>
        <div v-if="isAdmin" class="flex items-center space-x-2">
          <button class="px-3 py-1 bg-blue-600 text-white rounded" @click="downloadTemplate(endpoint, 'reviewers_template.xlsx')">下载模板</button>
          <label class="px-3 py-1 bg-green-600 text-white rounded cursor-pointer" @click="triggerImport()">
            导入
            <input ref="importInput" type="file" class="hidden" @change="handleImport" accept=".xlsx,.xls" />
          </label>
        </div>
      </div>

      <DataTable
        :columns="columns"
        :data="rows"
        :loading="loading"
        emptyText="暂无数据"
        :showActions="isAdmin"
      >
        <template #cell-reviewer_id="slot">{{ slot.row.reviewer_id }}</template>
        <template #cell-reviewer_name="slot">{{ slot.row.reviewer_name }}</template>
        <template #cell-role_name="slot">{{ slot.row.role_name }}</template>
        <template #cell-school_name="slot">{{ slot.row.school_name }}</template>
        <template #actions="slot">
          <button class="text-sm text-blue-500 hover:underline" @click="openChangePwd(slot.row)">修改密码</button>
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

    <Modal :show="changePwdVisible" title="修改密码" @close="changePwdVisible = false">
      <div class="mt-2">
        <input type="password" v-model="newPassword" class="w-full rounded border px-2 py-1" placeholder="新密码" />
      </div>
      <div class="mt-3 flex justify-end">
        <button class="px-3 py-1 mr-2 rounded bg-gray-200" @click="changePwdVisible = false">取消</button>
        <button class="px-3 py-1 rounded bg-blue-600 text-white" @click="submitPwd">确定</button>
      </div>
    </Modal>
  </AppLayout>
</template>
