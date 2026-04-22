<script setup lang="ts">
import AppLayout from '../layouts/AppLayout.vue'
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../api/notifications'
import { formatDateTime } from '../utils/formatters'
import { useAuthStore } from '../stores/auth'
import { ref, onMounted, computed } from 'vue'

const auth = useAuthStore()

const items = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(6)
const total = ref(0)
const totalPages = ref(0)
const filterTab = ref<'all'|'unread'|'read'>('all')

async function fetchNotifications() {
  loading.value = true
  try {
    const res = await getNotifications({ page: page.value, pageSize: pageSize.value, tab: filterTab.value })
    const data = res as any
    items.value = (data.items ?? []) as any[]
    total.value = data.total ?? 0
    totalPages.value = data.total_pages ?? Math.ceil(total.value / pageSize.value)
  } finally {
    loading.value = false
  }
}

async function markRead(n: any) {
  if (n.read) return
  await markNotificationRead(n.id)
  n.read = true
}

async function markAll() {
  await markAllNotificationsRead()
  await fetchNotifications()
}

function prevPage() {
  if (page.value > 1) {
    page.value--
    fetchNotifications()
  }
}

function nextPage() {
  if (page.value < totalPages.value) {
    page.value++
    fetchNotifications()
  }
}

function format(ts: string) {
  return ts ? formatDateTime(ts) : ''
}

const isAdmin = computed(() => auth.isAdmin)

onMounted(() => {
  fetchNotifications()
})

</script>

<template>
  <AppLayout>
    <div class="p-4 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-xl font-semibold">通知</h1>
      <div class="flex space-x-2" v-if="isAdmin">
          <button class="btn" @click="markAll">全部标记已读</button>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4">
        <div class="flex items-center space-x-2 border-b pb-2">
          <button :class="{'font-semibold': filterTab==='all'}" @click="filterTab='all'; page=1; fetchNotifications()">全部</button>
          <button :class="{'font-semibold': filterTab==='unread'}" @click="filterTab='unread'; page=1; fetchNotifications()">未读</button>
          <button :class="{'font-semibold': filterTab==='read'}" @click="filterTab='read'; page=1; fetchNotifications()">已读</button>
        </div>
      </div>

      <div class="space-y-2">
        <div v-for="it in items" :key="it.id" class="border rounded p-3 flex items-start space-x-3 cursor-pointer" @click="it.read ? null : markRead(it)">
          <span class="w-2 h-2 rounded-full mt-1" :class="it.read ? 'bg-transparent' : 'bg-blue-500'"></span>
          <div>
            <div class="text-sm font-semibold">{{ it.title }}</div>
            <div class="text-sm text-slate-600">{{ it.content }}</div>
            <div class="text-xs text-slate-400">{{ format(it.timestamp) }}</div>
          </div>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2 border-t mt-2">
        <div class="text-xs text-slate-500">第 {{ page }} 页 / 总 {{ totalPages }} 页</div>
        <div class="flex space-x-2">
          <button class="btn-secondary" @click="prevPage" :disabled="page <= 1">Prev</button>
          <button class="btn-secondary" @click="nextPage" :disabled="page >= totalPages">Next</button>
        </div>
      </div>
    </div>
  </AppLayout>
  </template>
