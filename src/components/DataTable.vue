<script setup lang="ts">
type Column = { key: string; label: string; format?: (value: any, row: any) => string }

const props = defineProps<{
  columns: Column[]
  data: any[]
  loading?: boolean
  emptyText?: string
  showActions?: boolean
}>()

</script>

<template>
  <div class="w-full overflow-auto"> 
    <table class="min-w-full table-fixed border-separate" aria-label="data-table">
      <thead class="thead-light bg-white sticky top-0">
        <tr>
          <th v-for="c in props.columns" :key="c.key" class="px-4 py-2 text-left text-sm font-medium text-slate-700 uppercase tracking-wide">{{ c.label }}</th>
          <th v-if="props.showActions" class="px-4 py-2 text-left text-sm font-medium text-slate-700">Actions</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-gray-200">
        <tr v-for="(row, idx) in props.data" :key="idx" class="hover:bg-slate-50">
          <td v-for="c in props.columns" :key="c.key" class="px-4 py-2 text-sm"> 
            <slot :name="`cell-${c.key}`" :value="row[c.key]" :row="row">
              {{ c.format ? c.format(row[c.key], row) : row[c.key] }}
            </slot>
          </td>
          <td v-if="props.showActions" class="px-4 py-2 text-sm"> 
            <slot name="actions" :row="row"></slot>
          </td>
        </tr>
        <tr v-if="!props.loading && props.data.length === 0">
          <td :colspan="props.columns.length + (props.showActions ? 1 : 0)" class="px-4 py-6 text-sm text-center text-slate-500">
            {{ props.emptyText ?? '暂无数据' }}
          </td>
        </tr>
        <tr v-if="props.loading">
          <td :colspan="props.columns.length + (props.showActions ? 1 : 0)" class="px-4 py-6 text-sm text-center text-slate-500">
            <span class="inline-block w-6 h-6 border-2 border-t-transparent border-slate-600 rounded-full animate-spin mr-2"></span>
            加载中...
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
