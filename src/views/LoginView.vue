<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { login } from '../api/auth'
import http from '../utils/http'
import { toDataURL } from 'qrcode'
import { useToast } from '../composables/useToast'

const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

type Mode = 'password' | 'qr'
const mode = ref<Mode>('password')

// Password login fields
const loginId = ref<string>('')
const loginPassword = ref<string>('')
const loadingPwd = ref<boolean>(false)
const pwdError = ref<string>('')

// QR login fields
const loginToken = ref<string>('')
const qrImage = ref<string>('')
const pollingId = ref<number | null>(null)
const loadingQR = ref<boolean>(false)
const qrError = ref<string>('')

const generateLoginToken = (): string => {
  // Simple token generator for QR login seed
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const generateQr = async () => {
  loginToken.value = generateLoginToken()
  try {
    loadingQR.value = true
    qrImage.value = await toDataURL(loginToken.value)
  } catch (e) {
    qrError.value = '无法生成二维码，请重试'
  } finally {
    loadingQR.value = false
  }
}

const startPolling = () => {
  if (!loginToken.value) return
  pollingId.value = window.setInterval(async () => {
    try {
      const res = await http.get(`/login/orcode?login_token=${loginToken.value}`)
      const data = res as any
      if (data?.token) {
        // Successful login via QR
        localStorage.setItem('token', data.token)
        if (data.id != null) localStorage.setItem('userId', String(data.id))
        if (data.name) localStorage.setItem('userName', data.name)
        if (data.role) localStorage.setItem('userRole', data.role)
        window.clearInterval(pollingId.value!)
        router.push('/')
      } else if (res?.status === 422) {
        // Still waiting; continue polling
      } else {
        // Other error: stop polling
        window.clearInterval(pollingId.value!)
      }
    } catch {
      window.clearInterval(pollingId.value!)
    }
  }, 5000)
}

const handlePwdLogin = async () => {
  pwdError.value = ''
  if (!loginId.value || !loginPassword.value) {
    pwdError.value = '请填写账户和密码'
    return
  }
  loadingPwd.value = true
  try {
    const res = await login({ id: loginId.value, password: loginPassword.value })
    const data = res as any
    // Persist via auth store
    authStore.login(data.id ?? loginId.value, data.password ?? loginPassword.value)
    localStorage.setItem('token', data.token)
    router.push('/')
  } catch (e) {
    const msg = (e as any)?.response?.data?.message ?? '登录失败，请重试'
    toast.show(msg, 'error')
  } finally {
    loadingPwd.value = false
  }
}

onMounted(async () => {
  // Prepare QR login and start polling
  await generateQr()
  startPolling()
})
</script>

<template>
  <div class="min-h-screen w-full bg-gradient-to-br from-indigo-50 via-violet-100 to-pink-50 flex items-center justify-center">
    <div class="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl w-full max-w-md px-6 py-8 sm:px-8">
      <div class="flex flex-col items-center text-center mb-6">
        <div class="text-4xl mb-2">📚</div>
        <h1 class="text-2xl font-semibold">请假管理系统</h1>
      </div>

      <!-- Tabs -->
      <div class="mb-4">
        <div class="flex gap-2 bg-gray-100 rounded-full p-1 w-max mx-auto">
          <button
            class="px-4 py-2 rounded-full text-sm font-medium focus:outline-none" 
            :class="mode === 'password' ? 'bg-white shadow' : 'text-gray-600'"
            @click="mode = 'password'"
          >密码登录</button>
          <button
            class="px-4 py-2 rounded-full text-sm font-medium focus:outline-none" 
            :class="mode === 'qr' ? 'bg-white shadow' : 'text-gray-600'"
            @click="mode = 'qr'"
          >二维码登录</button>
        </div>
      </div>

      <!-- Password Login -->
      <div v-if="mode === 'password'" class="space-y-4">
        <div>
          <label class="block text-sm mb-1">账号</label>
          <input v-model="loginId" type="text" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="请输入账户"/>
        </div>
        <div>
          <label class="block text-sm mb-1">密码</label>
          <input v-model="loginPassword" type="password" class="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="请输入密码"/>
        </div>
        <div class="text-sm text-red-600" v-if="pwdError">{{ pwdError }}</div>
        <button :disabled="loadingPwd" @click="handlePwdLogin" class="w-full bg-indigo-600 text-white rounded-md px-4 py-2 hover:bg-indigo-700 disabled:opacity-50">
          {{ loadingPwd ? '登录中...' : '登录' }}
        </button>
        <div class="text-sm text-gray-600 text-center mt-2">
          <a href="/verify-qr" class="underline">核验请假凭证</a>
        </div>
      </div>

      <!-- QR Code Login -->
      <div v-if="mode === 'qr'" class="pt-2 text-center">
        <div class="mx-auto w-48 h-48 bg-white border rounded-md flex items-center justify-center overflow-hidden mx-0 mb-2" aria-label="QR Code">
          <img :src="qrImage" alt="QR 登录二维码" class="max-w-full max-h-full" v-if="qrImage"/>
        </div>
        <div class="text-sm text-gray-600 mb-2" v-if="loadingQR">正在生成二维码...</div>
        <div class="text-sm text-red-600 mb-2" v-if="qrError">{{ qrError }}</div>
        <div class="text-sm text-gray-600">使用手机微信等扫码完成登录</div>
        <div class="mt-4 text-sm text-gray-600">
          <a href="/verify-qr" class="underline">核验请假凭证</a>
        </div>
      </div>
    </div>
  </div>
</template>
