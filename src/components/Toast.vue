<script setup lang="ts">
import { onMounted } from 'vue'
import { useToast } from '../composables/useToast'

// The Toasts are provided via the global composable
const { toasts } = useToast()

// helper renderers
function toastBg(type: 'success'|'error'|'info') {
  switch (type) {
    case 'success': return 'bg-green-600'
    case 'error': return 'bg-red-600'
    default: return 'bg-blue-600'
  }
}
function toastIcon(type: 'success'|'error'|'info') {
  switch (type) {
    case 'success': return '✔️'
    case 'error': return '⛔'
    default: return 'ℹ️'
  }
}

onMounted(() => {
  // no extra setup required
})
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 w-auto" style="pointer-events: none;">
    <transition-group name="toast" tag="div" class="flex flex-col items-end space-y-2" appear>
      <div v-for="t in toasts" :key="t.id" :class="['flex items-center w-full max-w-sm rounded shadow-lg px-4 py-3 text-white', toastBg(t.type)]" style="pointer-events: auto;">
        <span class="mr-2" aria-hidden> {{ toastIcon(t.type) }} </span>
        <span class="truncate">{{ t.message }}</span>
      </div>
    </transition-group>
  </div>
</template>
<script lang="ts">
// Note: helper functions are defined in the setup script for template access
</script>
