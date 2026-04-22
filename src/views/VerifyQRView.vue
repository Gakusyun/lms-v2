<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Html5Qrcode } from 'html5-qrcode'
import { verifyQRCode } from '../api/leaves'
import http from '../utils/http'
import { useToast } from '../composables/useToast'
import { useRouter } from 'vue-router'

// State
const qrContent = ref<string>("")
const result = ref<null | { valid: boolean; data?: any; error?: string }>(null)
const errorMsg = ref<string | null>(null)
const scanner = ref<Html5Qrcode | null>(null)
const scanning = ref(false)
const toast = useToast()
const router = useRouter()

function goBack() {
  router.back()
}

async function startScanner() {
  if (scanning.value) return
  scanner.value = new Html5Qrcode('reader')
  try {
    await scanner.value.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 }, onScanSuccess, () => {})
    scanning.value = true
  } catch (e) {
    toast.show('无法启动摄像头，请检查浏览器权限')
  }
}

async function onScanSuccess(decodedText: string, _decodedResult: any) {
  qrContent.value = decodedText
  await stopScanner()
  await verify()
}

async function stopScanner() {
  if (scanner.value && scanning.value) {
    try {
      await scanner.value.stop()
    } catch {
      // ignore
    }
  }
  scanner.value = null
  scanning.value = false
}

async function verify() {
  errorMsg.value = null
  result.value = null
  const content = qrContent.value?.trim()
  if (!content) {
    errorMsg.value = '请提供二维码内容'
    return
  }
  try {
    // Try using the API wrapper if available
    const resp = await verifyQRCode(content)
    // Normalize possible outcomes
    if (resp && typeof resp === 'object') {
      if ((resp as any).ok) {
        result.value = { valid: true, data: (resp as any).data }
        return
      }
      if ((resp as any).data && (resp as any).data.valid) {
        result.value = { valid: true, data: (resp as any).data }
        return
      }
      if ((resp as any).error) {
        result.value = { valid: false, error: (resp as any).error }
        return
      }
    }
  } catch (err: any) {
    // Fallback to direct http call if wrapper fails
    try {
      const httpRes = await http.post('/leaves/verify-qr', { qr_content: content })
      if (httpRes?.data?.valid) {
        result.value = { valid: true, data: httpRes.data }
        return
      } else {
        result.value = { valid: false, error: httpRes?.data?.error ?? '核验失败' }
        return
      }
    } catch (e) {
      errorMsg.value = err?.message ?? '核验异常'
      toast.show(errorMsg.value!)
    }
  }
  // If none of the above worked, show a generic error
  errorMsg.value = '核验失败，请重试'
  toast.show('核验失败，请重试')
}

onUnmounted(() => {
  stopScanner()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center px-4">
    <div class="bg-white rounded-xl shadow-md w-full max-w-3xl p-6 md:p-8">
      <h1 class="text-2xl font-semibold text-gray-900 mb-4">请假凭证核验</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-max">
        <!-- Scanner panel -->
        <section class="border rounded-lg p-4 md:p-6 flex flex-col items-center">
          <div id="reader" class="w-full h-48 md:h-64 bg-gray-50 border rounded-md flex items-center justify-center mb-3"></div>
          <div class="flex gap-3">
            <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" @click="startScanner">开启摄像头</button>
            <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" @click="stopScanner" :disabled="!scanning">停止</button>
          </div>
          <div class="text-sm text-gray-600 mt-2">请对准条码或输入文本</div>
        </section>

        <!-- Manual input panel -->
        <section class="border rounded-lg p-4 md:p-6 flex flex-col">
          <label class="text-sm mb-2 text-gray-700">手动输入二维码内容</label>
          <textarea v-model="qrContent" rows="6" class="flex-1 resize-none border rounded p-2 text-sm focus:ring-2 focus:ring-blue-500" placeholder="请粘贴或输入二维码内容"></textarea>
          <button class="mt-3 w-full bg-green-600 text-white rounded py-2 hover:bg-green-700" @click="verify" :disabled="!qrContent.trim()">核验</button>
          <div v-if="errorMsg" class="mt-2 text-sm text-red-600">{{ errorMsg }}</div>
        </section>
      </div>

      <div v-if="result" class="mt-6 border rounded-lg p-4 bg-white shadow">
        <div v-if="result?.valid">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm sm:text-base">
            <div>学生姓名：<span class="font-semibold">{{ result?.data?.student_name }}</span></div>
            <div>请假类型：<span class="font-semibold">{{ result?.data?.leave_type }}</span></div>
            <div>请假时长：<span class="font-semibold">{{ result?.data?.leave_hours }}</span></div>
            <div>请假日期：<span class="font-semibold">{{ result?.data?.leave_date }}</span></div>
            <div>状态：
              <span class="font-semibold" :class="{'text-green-600': result?.data?.status==='valid','text-red-600': result?.data?.status!=='valid'}">{{ result?.data?.status }}</span>
            </div>
          </div>
          <div v-if="result?.data?.audit_remarks" class="mt-2 text-sm text-gray-700">审核备注：{{ result?.data?.audit_remarks }}</div>
        </div>
        <div v-else class="text-sm text-red-600">{{ result?.error ?? '核验无效' }}</div>
      </div>

      <div class="mt-6 flex justify-start">
        <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

 
