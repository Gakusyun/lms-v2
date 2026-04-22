<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'
import Modal from '../components/Modal.vue'
import { useAuthStore } from '../stores/auth'
import { changePassword } from '../api/auth'
import http from '../utils/http'
import { Html5Qrcode } from 'html5-qrcode'
import { useToast } from '../composables/useToast'

const auth = useAuthStore()

const displayName = computed(() => auth.userName ?? '')
const role = computed(() => auth.userRole ?? '')
const userId = computed(() => auth.userId ?? '')

// inline edit name
const editingName = ref(false)
const newName = ref(displayName.value)

// Password modal
const passwordModal = ref(false)
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const pwError = ref('')
const toast = useToast()

// Device login modal
const deviceModal = ref(false)
const deviceToken = ref('')
const deviceManual = ref(false)
let deviceScanner: Html5Qrcode | null = null
let deviceScannerActive = ref(false)

// Avatar initials
const initials = computed(() => {
  const n = (auth.userName ?? 'U').trim()
  return n.charAt(0).toUpperCase()
})

function roleName(r: string): string {
  switch (r) {
    case 'admin': return '管理员'
    case 'reviewer': return '审核员'
    case 'teacher': return '教师'
    case 'student': return '学生'
    default: return r
  }
}

function showManualDevice() {
  deviceManual.value = true
  deviceScannerActive.value = false
}

function startEdit() {
  newName.value = displayName.value
  editingName.value = true
}

async function saveName() {
  if (!newName.value?.trim()) {
    toast.show('名称不能为空')
    return
  }
  try {
    await http.put('/profile', { name: newName.value.trim() })
    auth.userName = newName.value.trim()
    editingName.value = false
    toast.show('名称已更新')
  } catch {
    toast.show('更新名称失败')
  }
}

function cancelEdit() {
  editingName.value = false
}

async function submitPassword() {
  pwError.value = ''
  if (!oldPassword.value || !newPassword.value || !confirmPassword.value) {
    pwError.value = '请填写完整字段'
    toast.show(pwError.value)
    return
  }
  if (newPassword.value.length < 6) {
    pwError.value = '新密码至少 6 位'
    toast.show(pwError.value)
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    pwError.value = '两次输入的密码不一致'
    toast.show(pwError.value)
    return
  }
  try {
    await changePassword({ old_password: oldPassword.value, new_password: newPassword.value })
    passwordModal.value = false
    oldPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    toast.show('密码修改成功')
  } catch {
    toast.show('密码修改失败')
  }
}

function openDeviceModal() {
  deviceModal.value = true
  // reset
  deviceToken.value = ''
  deviceManual.value = false
}

async function authorizeWithToken() {
  if (!deviceToken.value) {
    toast.show('请输入登录令牌')
    return
  }
  try {
    // As per API documentation: GET /login/orcode?login_token=xxx&token=JWT
    await http.get('/login/orcode?login_token=' + encodeURIComponent(deviceToken.value) + '&token=JWT')
    toast.show('授权请求已发送')
    deviceModal.value = false
  } catch {
    toast.show('授权失败')
  }
}

function startDeviceScanner() {
  deviceScanner = new Html5Qrcode('device-reader')
  deviceScannerActive.value = true
  deviceScanner!.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, (text) => {
    deviceToken.value = text
    stopDeviceScanner()
    toast.show('设备令牌已获取')
  }, () => {}).catch(() => {
    toast.show('无法启动设备扫描')
  })
}

function stopDeviceScanner() {
  if (deviceScanner && deviceScannerActive.value) {
    deviceScanner.stop().catch(() => {})
  }
  deviceScannerActive.value = false
}

onMounted(() => {
  // initialize new name from store
  newName.value = displayName.value
})

onUnmounted(() => {
  stopDeviceScanner()
})
</script>

<template>
  <AppLayout>
    <div class="p-6 space-y-6">
        <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-gray-200 text-xl flex items-center justify-center font-semibold">{{ initials }}</div>
        <div>
          <div class="text-sm text-gray-600">ID</div>
        <div class="text-lg font-semibold">{{ userId }}</div>
        </div>
        <div class="flex-1" />
        <button class="px-4 py-2 bg-blue-600 text-white rounded" @click="passwordModal = true">修改密码</button>
        <button class="px-4 py-2 bg-green-600 text-white rounded" @click="openDeviceModal">让其他设备登录</button>
      </div>

      <div class="border rounded-lg p-4 md:p-6 bg-white">
        <div class="flex items-center gap-4 mb-4">
          <div class="text-lg font-semibold">个人资料</div>
          <span class="text-sm text-gray-500">{{ roleName(role) }}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="flex items-center justify-between border-b pb-3">
            <span>名称</span>
            <div class="flex items-center gap-2">
              <span v-if="!editingName">{{ displayName }}</span>
              <input v-else v-model="newName" class="border rounded px-2 py-1" />
              <button v-if="!editingName" class="px-2 py-1 bg-blue-500 text-white rounded" @click="startEdit">编辑</button>
              <button v-else class="px-2 py-1 bg-green-500 text-white rounded" @click="saveName">保存</button>
              <button v-if="editingName" class="px-2 py-1 bg-gray-200 rounded" @click="cancelEdit">取消</button>
            </div>
          </div>
          <div class="flex items-center justify-between border-b pb-3">
            <span>角色</span>
            <span class="font-semibold">{{ roleName(role) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Password Modal -->
    <Modal :show="passwordModal" title="修改密码" @close="passwordModal = false">
      <div class="space-y-3 p-4">
        <input type="password" v-model="oldPassword" placeholder="原密码" class="w-full border rounded px-3 py-2" />
        <input type="password" v-model="newPassword" placeholder="新密码" class="w-full border rounded px-3 py-2" />
        <input type="password" v-model="confirmPassword" placeholder="确认新密码" class="w-full border rounded px-3 py-2" />
        <div v-if="pwError" class="text-sm text-red-600">{{ pwError }}</div>
        <button class="px-4 py-2 bg-blue-600 text-white rounded" @click="submitPassword">保存</button>
      </div>
    </Modal>

    <!-- Device authorization Modal -->
    <Modal :show="deviceModal" title="让其他设备登录" @close="deviceModal = false">
      <div class="p-4 space-y-4">
        <div class="flex gap-2">
          <button class="px-3 py-2 bg-blue-600 text-white rounded" @click="startDeviceScanner">扫码授权</button>
          <button class="px-3 py-2 bg-gray-200 rounded" @click="showManualDevice">手动输入</button>
        </div>
        <div v-if="deviceManual">
          <input v-model="deviceToken" placeholder="输入登录令牌" class="w-full border rounded px-3 py-2" />
        </div>
        <div id="device-reader" v-if="deviceScannerActive" class="w-full h-48 bg-black/5 rounded"></div>
        <button class="px-4 py-2 bg-green-600 text-white rounded" @click="authorizeWithToken">授权</button>
      </div>
    </Modal>
  </AppLayout>
</template>

 
