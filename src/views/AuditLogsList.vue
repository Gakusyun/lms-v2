<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue'
import DataTable from '../components/DataTable.vue'
import PaginationBar from '../components/PaginationBar.vue'
import { useAuthStore } from '../stores/auth'
import { getPagedData } from '../api/common'
import http from '../utils/http'
import { exportToExcel } from '../utils/excelExporter'
import { formatDateTime, getStatusBadgeClass } from '../utils/formatters'
import { ref, reactive, onMounted, computed } from 'vue'

type AuditLog = any

const auth = useAuthStore()

const logs = ref<AuditLog[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const totalPages = ref(0)

const filters = reactive<{ user_role: string; action: string; startDate: string; endDate: string }>({
  user_role: '',
  action: '',
  startDate: '',
  endDate: '',
})

const roleMap: Record<string, string> = {
  admin: '管理员',
  reviewer: '审核员',
  teacher: '教师',
  student: '学生',
}

const actionMap: Record<string, string> = {
  login: '登录',
  logout: '登出',
  password_change: '修改密码',
  leave_create: '创建请假',
  leave_edit: '编辑请假',
  leave_approve: '批准请假',
  leave_reject: '拒绝请假',
  leave_cancel: '取消请假',
  user_create: '创建用户',
  data_export: '数据导出',
}

const columns = [
  { key: 'log_id', label: '日志ID' },
  { key: 'timestamp', label: '时间' },
  { key: 'user', label: '用户' },
  { key: 'user_role', label: '角色' },
  { key: 'action', label: '行为' },
  { key: 'target_type', label: '目标类型' },
  { key: 'target_id', label: '目标ID' },
  { key: 'detail', label: '详情' },
  { key: 'ip_address', label: 'IP' },
]

async function fetchLogs() {
  loading.value = true
  try {
    const res = await getPagedData('/audit-logs', page.value, pageSize.value, {
      ...filters,
    } as any)
    const data = res as any
    logs.value = (data.items ?? []) as AuditLog[]
    total.value = data.total ?? 0
    totalPages.value = data.total_pages ?? Math.ceil(total.value / pageSize.value)
  } finally {
    loading.value = false
  }
}

async function exportExcel() {
  // Fetch all with large page size and export
  const res = await http.get('/audit-logs', { params: { ...filters, page: 1, pageSize: 1000000 } })
  const items = (res as any).items ?? []
  await exportToExcel(items, 'AuditLogs.xlsx')
}

function displayAction(a: string) {
  return actionMap[a] ?? a
}

function roleLabel(r: string) {
  return roleMap[r] ?? r
}

function formatTs(ts: string) {
  return ts ? formatDateTime(ts) : ''
}

function resetFilters() {
  filters.user_role = ''
  filters.action = ''
  filters.startDate = ''
  filters.endDate = ''
}

 const isAdmin = computed(() => auth.isAdmin)

onMounted(() => {
  fetchLogs()
})

function onPageChange(p: number) {
  page.value = p
  fetchLogs()
}
</script>

<template>
  <AppLayout>
    <div class="p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold">审计日志</h1>
        <div class="flex items-center space-x-2" v-if="isAdmin">
          <button @click="exportExcel" class="btn">导出 Excel</button>
        </div>
      </div>

      <div class="bg-white rounded shadow p-4">
        <div class="grid grid-cols-4 gap-2 mb-3 text-sm text-gray-700">
          <select v-model="filters.user_role" class="border rounded px-2 py-1">
            <option value="">全部</option>
            <option v-for="(label, key) in roleMap" :value="key">{{ label }}</option>
          </select>
          <select v-model="filters.action" class="border rounded px-2 py-1">
            <option value="">全部</option>
            <option v-for="(label, key) in actionMap" :value="key">{{ label }}</option>
          </select>
          <input type="date" v-model="filters.startDate" class="border rounded px-2 py-1" />
          <input type="date" v-model="filters.endDate" class="border rounded px-2 py-1" />
        </div>
        <div class="flex items-center space-x-2">
          <button class="btn" @click="fetchLogs">检索</button>
          <button class="btn-secondary" @click="resetFilters">重置</button>
        </div>
        <DataTable :columns="columns" :data="logs" :loading="loading" emptyText="暂无日志">
          <template #cell-log_id="{ row: r }"> {{ r.log_id }} </template>
          <template #cell-timestamp="{ row: r }"> {{ formatTs(r.timestamp) }} </template>
          <template #cell-user="{ row: r }"> {{ r.user_name ?? ('ID:' + r.user_id) }} </template>
          <template #cell-user_role="{ row: r }"> <span class="text-xs px-2 py-0.5 rounded" :class="getStatusBadgeClass(r.user_role)">{{ roleLabel(r.user_role) }}</span> </template>
          <template #cell-action="{ row: r }"> {{ displayAction(r.action) }} </template>
          <template #cell-target_type="{ row: r }"> {{ r.target_type }} </template>
          <template #cell-target_id="{ row: r }"> {{ r.target_id }} </template>
          <template #cell-detail="{ row: r }"> {{ r.detail }} </template>
          <template #cell-ip_address="{ row: r }"> {{ r.ip_address }} </template>
        </DataTable>
        <PaginationBar :currentPage="page" :totalPages="totalPages" :total="total" :pageSize="pageSize" :loading="loading" @page-change="onPageChange" />
      </div>
    </div>
  </AppLayout>
</template>
