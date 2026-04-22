<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import http from '../utils/http'
import { useToast } from '../composables/useToast'

const router = useRouter()
const toast = useToast()

// Health check on mount
onMounted(async () => {
  try {
    const res = await http.get('/') as any
    if (res?.status === 'healthy') {
      router.push('/login')
    }
  } catch {
    // ignore, stay on setup page
  }
})

// DB config state
const dbType = ref<string>('mysql')
const mysqlHost = ref<string>('localhost')
const mysqlPort = ref<string>('3306')
const mysqlDatabase = ref<string>('lms')
const mysqlUsername = ref<string>('root')
const mysqlPassword = ref<string>('')
const sqlitePath = ref<string>('/path/to/db.sqlite')
const testStatus = ref<{ success: boolean; message: string } | null>(null)

// Admin info
const adminId = ref<number>(1)
const adminName = ref<string>('admin')
const adminPassword = ref<string>('admin')

const configLoading = ref<boolean>(false)

const testConnection = async () => {
  testStatus.value = null
  try {
    const payload: any = {
      type: dbType.value,
      host: mysqlHost.value,
      port: mysqlPort.value,
      database: mysqlDatabase.value,
      username: mysqlUsername.value,
      password: mysqlPassword.value,
      db_path: sqlitePath.value
    }
    const pathParams = dbType.value === 'sqlite' ? { db_path: sqlitePath.value } : payload
    const res = await http.post('/admin/test-db-connection', pathParams) as any
    if (res?.status === 'success') {
      testStatus.value = { success: true, message: '连接成功' }
    } else {
      testStatus.value = { success: false, message: res?.message ?? '连接失败' }
      toast.show(testStatus.value.message, 'error')
    }
  } catch (e) {
    testStatus.value = { success: false, message: (e as any)?.response?.data?.message ?? '连接失败' }
    toast.show(testStatus.value.message, 'error')
  }
}

const canComplete = ref<boolean>(false)

const completeSetup = async () => {
  if (!canComplete.value) return
  try {
    configLoading.value = true
    // Configure DB first
    await http.post('/admin/configure-db', {
      type: dbType.value,
      host: mysqlHost.value,
      port: mysqlPort.value,
      database: mysqlDatabase.value,
      username: mysqlUsername.value,
      password: mysqlPassword.value,
      db_path: sqlitePath.value
    })
    // Create admin
    await http.post('/create/admin', {
      admin_id: adminId.value,
      name: adminName.value,
      password: adminPassword.value
    })
    toast.show('系统初始化完成，即将跳转到登录页', 'success')
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (e) {
    toast.show((e as any)?.response?.data?.message ?? '初始化失败', 'error')
  } finally {
    configLoading.value = false
  }
}

// Update enable/disable logic for Complete button
watch(
() => testStatus.value?.success,
(newVal) => {
  canComplete.value = !!newVal
}
)
</script>

<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-green-50 via-teal-100 to-teal-50 flex items-center justify-center">
    <div class="bg-white/95 rounded-2xl shadow-xl w-full max-w-3xl p-6 sm:p-8 space-y-6">
      <div class="flex items-center gap-3 text-2xl">
        <span>🚀</span>
        <span class="font-semibold">系统初始化</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Database Configuration -->
        <section class="border rounded-lg p-4 bg-white/60">
          <h3 class="text-lg font-semibold mb-3">数据库配置</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-sm mb-1">数据库类型</label>
              <select v-model="dbType" class="w-full border border-gray-300 rounded-md px-3 py-2" >
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>
            <div v-if="dbType === 'mysql'" class="space-y-2">
              <div class="grid grid-cols-2 gap-2">
                <div><label class="block text-sm mb-1">Host</label><input v-model="mysqlHost" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
                <div><label class="block text-sm mb-1">Port</label><input v-model="mysqlPort" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div><label class="block text-sm mb-1">Database</label><input v-model="mysqlDatabase" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
                <div><label class="block text-sm mb-1">Username</label><input v-model="mysqlUsername" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
              </div>
              <div><label class="block text-sm mb-1">Password</label><input type="password" v-model="mysqlPassword" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
            </div>
            <div v-else class="space-y-2">
              <div><label class="block text-sm mb-1">DB Path</label><input v-model="sqlitePath" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
            </div>
            <button @click="testConnection" class="w-full bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700" :disabled="configLoading">
              测试连接
            </button>
            <div class="text-sm" v-if="testStatus">{{ testStatus?.message }}</div>
          </div>
        </section>

        <!-- Admin Account -->
        <section class="border rounded-lg p-4 bg-white/60">
          <h3 class="text-lg font-semibold mb-3">管理员信息</h3>
          <div class="space-y-3">
            <div class="grid grid-cols-2 gap-2">
              <div><label class="block text-sm mb-1">Admin ID</label><input type="number" v-model="adminId" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
              <div><label class="block text-sm mb-1">Name</label><input v-model="adminName" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
            </div>
            <div><label class="block text-sm mb-1">Password</label><input type="password" v-model="adminPassword" class="w-full border border-gray-300 rounded-md px-3 py-2"/></div>
          </div>
        </section>
      </div>

      <button @click="completeSetup" class="w-full bg-green-600 text-white rounded-md px-4 py-2 hover:bg-green-700" :disabled="configLoading || !canComplete">
        {{ configLoading ? '处理中...' : '完成初始化' }}
      </button>
      <p class="text-xs text-gray-500 text-center">首次运行需要数据库配置与管理员账户，请按提示填写。</p>
    </div>
  </div>
</template>
