<script setup lang="ts">
defineProps<{ title: string; value: string | number; icon?: string; description?: string }>()
</script>

<template>
  <div class="bg-white rounded-xl shadow hover:shadow-md p-4 flex items-center gap-4">
    <div class="text-4xl">{{ icon ?? '📊' }}</div>
    <div>
      <div class="text-sm text-slate-500">{{ title }}</div>
      <div class="text-2xl font-semibold">{{ value }}</div>
      <div v-if="description" class="text-xs text-slate-400">{{ description }}</div>
    </div>
  </div>
</template>
