<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{ show: boolean; title: string; maxWidth?: string }>()
const emit = defineEmits<{ close: [] }>()

function close() {
  emit('close')
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.show) close()
}

onMounted(() => window.addEventListener('keydown', onKeyDown))
onUnmounted(() => window.removeEventListener('keydown', onKeyDown))
</script>

<template>
  <div v-if="props.show" class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="fixed inset-0 bg-black/40 backdrop-blur-sm" @click="close" aria-label="overlay"></div>
    <div class="bg-white rounded-xl shadow-xl overflow-hidden transform transition-all" :class="['w-full', props.maxWidth || 'max-w-lg', 'mx-4']">
      <div class="flex items-center justify-between p-4 border-b">
        <h3 class="text-lg font-semibold">{{ props.title }}</h3>
        <button aria-label="Close" class="text-gray-500 hover:text-gray-700" @click="close">✕</button>
      </div>
      <div class="p-4">
        <slot />
      </div>
    </div>
  </div>
</template>
