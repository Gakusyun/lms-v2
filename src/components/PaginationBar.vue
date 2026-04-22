<script setup lang="ts">
import { ref, computed, watch } from 'vue'

type Props = {
  currentPage: number
  totalPages: number
  total: number
  pageSize: number
  loading?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{ 'page-change': [page: number]; 'page-size-change': [size: number] }>()

const gotoPage = ref<number>(props.currentPage)
const pageSize = ref<number>(props.pageSize)

watch(() => props.currentPage, v => { gotoPage.value = v })
watch(() => props.pageSize, v => { pageSize.value = v })

function goTo() {
  if (gotoPage.value >= 1 && gotoPage.value <= props.totalPages) {
    emit('page-change', gotoPage.value)
  }
}
function changeSize(v: string) {
  const n = Number(v)
  if (!Number.isNaN(n) && n > 0) {
    pageSize.value = n
    emit('page-size-change', n)
  }
}

const start = computed(() => (props.total === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1))
const end = computed(() => Math.min(props.total, props.currentPage * props.pageSize))
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 text-sm text-slate-700">
    <div>
      显示第 {{ start }} 到 {{ end }} 条，共 {{ props.total }} 条
    </div>
    <div class="flex items-center gap-2">
      <button class="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300" :disabled="props.loading || props.currentPage <= 1" @click="emit('page-change', 1)">First</button>
      <button class="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300" :disabled="props.loading || props.currentPage <= 1" @click="emit('page-change', props.currentPage - 1)">Prev</button>
      <span>第 {{ props.currentPage }} 页，共 {{ props.totalPages }} 页</span>
      <button class="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300" :disabled="props.loading || props.currentPage >= props.totalPages" @click="emit('page-change', props.currentPage + 1)">Next</button>
      <button class="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300" :disabled="props.loading || props.currentPage >= props.totalPages" @click="emit('page-change', props.totalPages)">Last</button>
      <span class="px-2 py-1">每页</span>
      <input class="w-14 px-2 py-1 rounded border" type="number" min="1" :value="pageSize" @input="e => changeSize((e.target as HTMLInputElement).value)" />
      <span>条</span>
      <span>跳至</span>
      <input class="w-16 px-2 py-1 rounded border" type="number" min="1" :value="gotoPage" @input="e => gotoPage = Number((e.target as HTMLInputElement).value)" @keyup.enter="goTo" />
      <button class="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300" @click="goTo">Go</button>
    </div>
  </div>
</template>
