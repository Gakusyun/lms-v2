/* 通用格式化工具函数 */

/**
 * 格式化日期显示
 * @param dateString 日期字符串
 * @returns 格式化后的日期字符串
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  const currentYear = new Date().getFullYear()
  const dateYear = date.getFullYear()

  if (dateYear === currentYear) {
    // 本年，只显示月日
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${month}-${day}`
  } else {
    // 非本年，显示年月日
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    return `${year}-${month}-${day}`
  }
}

/**
 * 格式化日期时间显示（包含时分秒）
 * @param dateString 日期字符串
 * @returns 格式化后的日期时间字符串
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 根据状态获取徽章样式类
 * @param status 状态字符串
 * @returns Tailwind 样式类字符串
 */
export const getStatusBadgeClass = (status: string): string => {
  switch (status) {
    case '已批准':
      return 'bg-green-100 text-green-800'
    case '待审批':
      return 'bg-yellow-100 text-yellow-800'
    case '已拒绝':
      return 'bg-red-100 text-red-800'
    case '已撤销':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-blue-100 text-blue-800'
  }
}
