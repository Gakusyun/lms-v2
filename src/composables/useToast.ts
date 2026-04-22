import { ref } from 'vue'
import type { Ref } from 'vue'

type Toast = { id: number; message: string; type: 'success' | 'error' | 'info' }

const toasts: Ref<Toast[]> = ref([])
let nextId = 1

export function useToast() {
  function show(message: string, type: Toast['type'] = 'info') {
    const id = nextId++
    toasts.value.push({ id, message, type })
    // Auto-dismiss after 3 seconds
    setTimeout(() => remove(id), 3000)
  }
  function remove(id: number) {
    const idx = toasts.value.findIndex(t => t.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }
  const success = (msg: string) => show(msg, 'success')
  const error = (msg: string) => show(msg, 'error')
  return {
    toasts,
    show,
    success,
    error,
    remove
  }
}
