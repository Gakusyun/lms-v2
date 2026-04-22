<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'

// Sidebar state for mobile
const sidebarOpen = ref(false)

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()

const nav = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/students', label: '学生管理', icon: '👨‍🎓' },
  { path: '/teachers', label: '教师管理', icon: '🧑‍🏫' },
  { path: '/reviewers', label: '审核员管理', icon: '📋' },
  { path: '/courses', label: '课程管理', icon: '📚' },
  { path: '/schools', label: '院系管理', icon: '🏫' },
  { path: '/leaves', label: '请假管理', icon: '📝' },
  { path: '/statistics', label: '统计分析', icon: '📊' },
  { path: '/notifications', label: '通知中心', icon: '🔔' },
  { path: '/audit-logs', label: '审计日志', icon: '📋' },
]

const isActive = (path: string) => {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}

onMounted(() => {
  notificationStore.fetchUnreadCount()
})

function logout() {
  authStore.logout()
  router.push('/login')
}

// Convenience for unread badge on Notification item
const unreadCount = computed(() => notificationStore.unreadCount ?? 0)

// Computed class for desktop sidebar visibility
const sidebarClasses = computed(() => [
  'hidden',
  'md:flex',
  'md:flex-col',
  'fixed',
  'h-full',
  'w-60',
  'bg-slate-900',
  'text-white',
])

</script>

<template>
  <div class="flex h-screen bg-gray-50">
    <!-- Mobile top bar -->
    <div class="md:hidden fixed top-0 left-0 right-0 h-12 bg-slate-900 text-white flex items-center px-4 z-40">
      <button aria-label="Toggle sidebar" class="mr-2 p-1 rounded focus:outline-none" @click="sidebarOpen = !sidebarOpen">☰</button>
      <span class="font-semibold">LMS 管理系统</span>
    </div>

    <!-- Mobile Sidebar Drawer -->
    <div v-if="sidebarOpen" class="md:hidden fixed inset-0 z-40" @click="sidebarOpen = false">
      <div class="absolute left-0 top-0 bottom-0 w-60 bg-slate-900 text-white p-4" @click.stop>
        <div class="mb-4 text-xl font-semibold">LMS 管理系统</div>
        <nav class="space-y-1">
          <template v-for="item in nav" :key="item.path">
            <router-link :to="item.path" @click.native="sidebarOpen = false" :class="['flex items-center gap-2 px-2 py-2 rounded', isActive(item.path) ? 'bg-slate-700' : 'hover:bg-slate-800']">
              <span class="text-lg">{{ item.icon }}</span>
              <span>{{ item.label }}</span>
            </router-link>
          </template>
        </nav>
        <div class="mt-auto pt-6 border-t border-slate-700"></div>
        <div class="mt-4 text-sm">必要时可在侧边栏外部关闭</div>
      </div>
    </div>

    <!-- Desktop Sidebar -->
    <aside :class="sidebarClasses" aria-label="Main navigation" class="hidden md:flex flex-col fixed h-full">
      <div class="p-4 text-2xl font-semibold border-b border-slate-700">LMS 管理系统</div>
      <nav class="flex-1 p-2 space-y-1">
        <template v-for="item in nav" :key="item.path">
          <router-link :to="item.path" :class="['flex items-center gap-2 px-3 py-2 rounded text-sm', isActive(item.path) ? 'bg-slate-700' : 'hover:bg-slate-800']">
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
            <span v-if="item.path === '/notifications' && unreadCount > 0" class="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 text-white px-2 py-0.5 text-xs">{{ unreadCount }}</span>
          </router-link>
        </template>
      </nav>
      <div class="p-4 border-t border-slate-700">
        <div class="flex items-center gap-3 mb-2">
          <div class="w-9 h-9 rounded-full bg-slate-600 flex items-center justify-center text-xs font-semibold">{{ authStore.userName?.slice(0,1) ?? 'U' }}</div>
          <div class="text-sm leading-tight">
            <div class="font-medium">{{ authStore.userName ?? '用户' }}</div>
            <div class="text-slate-300 text-xs">{{ authStore.userRole ?? '角色' }}</div>
          </div>
        </div>
        <button class="w-full text-sm px-3 py-2 rounded bg-slate-700 hover:bg-slate-600" @click="router.push('/change-password')">修改密码</button>
        <button class="w-full mt-2 text-sm px-3 py-2 rounded bg-red-600 hover:bg-red-500" @click="logout">退出登录</button>
      </div>
    </aside>

    <!-- Content area -->
    <div class="flex-1 ml-0 md:ml-60 w-full">
      <!-- Content header spacer for consistent top padding on pages -->
      <header class="h-14 bg-white shadow sticky top-0 z-20 flex items-center px-6"></header>
      <main class="p-6 max-w-7xl mx-auto pt-4">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped></style>
