import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as notifApi from '../api/notifications'

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref<number>(0)

  async function fetchUnreadCount() {
    const data: any = await notifApi.getUnreadCount()
    unreadCount.value = typeof data?.unreadCount === 'number' ? data.unreadCount : 0
  }

  function decrement() {
    if (unreadCount.value > 0) unreadCount.value--
  }

  function reset() {
    unreadCount.value = 0
  }

  return { unreadCount, fetchUnreadCount, decrement, reset }
})
