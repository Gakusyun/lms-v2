<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue'
import DataTable from '../components/DataTable.vue'
import PaginationBar from '../components/PaginationBar.vue'
import Modal from '../components/Modal.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import http from '../utils/http'
import { getPagedData } from '../api/common'
import { onMounted, ref, computed, watch } from 'vue'

const auth = useAuthStore()
const toast = useToast()

const endpoint = '/schools'

const schools = ref<any[]>([])
const currentPage = ref<number>(1)
const pageSize = ref<number>(10)
const total = ref<number>(0)
const totalPages = ref<number>(1)
const loading = ref<boolean>(false)

const isAdmin = computed(() => auth.isAdmin)

const columns = [
  { key: 'school_id', label: '部门ID' },
  { key: 'school_name', label: '部门名称' },
]

const showCreateModal = ref<boolean>(false)
const newSchoolName = ref<string>('')

const importInput = ref<HTMLInputElement | null>(null)
function triggerImport() { importInput.value?.click() }

async function handleImport(e: Event) {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  const form = new FormData()
  form.append('file', file)
  try {
    const res: any = await http.post('/schools/import', form) as any
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
    schools.value = items
    total.value = res?.total ?? 0
    totalPages.value = res?.totalPages ?? Math.ceil(total.value / pageSize.value)
  } catch {
    toast.error('加载失败')
  } finally {
    loading.value = false
  }
}

async function createDepartment() {
  if (!newSchoolName.value) return
  try {
    await http.post('/schools', { school_name: newSchoolName.value })
    toast.success('创建成功')
    showCreateModal.value = false
    newSchoolName.value = ''
    await fetchPage()
  } catch {
    toast.error('创建失败')
  }
}

onMounted(fetchPage)
watch([currentPage, pageSize], fetchPage)
</script>

<template>
  <AppLayout>
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h1 class="text-xl font-semibold">部门列表</h1>
        <div v-if="isAdmin" class="flex items-center space-x-2">
          <button class="px-3 py-1 bg-blue-600 text-white rounded" @click="downloadTemplate(endpoint, 'schools_template.xlsx')">下载模板</button>
          <button class="px-3 py-1 bg-green-600 text-white rounded" @click="showCreateModal = true">新增部门</button>
          <label class="px-3 py-1 bg-green-600 text-white rounded cursor-pointer" @click="triggerImport()" v-if="true">
            导入
            <input ref="importInput" type="file" class="hidden" @change="handleImport" accept=".xlsx,.xls" />
          </label>
        </div>
      </div>

      <DataTable
        :columns="columns"
        :data="schools"
        :loading="loading"
        emptyText="暂无数据"
      >
        <template #cell-school_id="slot">{{ slot.row.school_id }}</template>
        <template #cell-school_name="slot">{{ slot.row.school_name }}</template>
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

    <Modal :show="showCreateModal" title="新增部门" @close="showCreateModal = false">
      <div class="mt-2">
        <input type="text" v-model="newSchoolName" placeholder="部门名称" class="w-full rounded border px-2 py-1" />
      </div>
      <div class="mt-3 flex justify-end">
        <button class="px-3 py-1 mr-2 rounded bg-gray-200" @click="showCreateModal = false">取消</button>
        <button class="px-3 py-1 rounded bg-blue-600 text-white" @click="createDepartment">创建</button>
      </div>
    </Modal>
  </AppLayout>
</template>
