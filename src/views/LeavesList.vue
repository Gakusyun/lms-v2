<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import AppLayout from '../layouts/AppLayout.vue'
import DataTable from '../components/DataTable.vue'
import PaginationBar from '../components/PaginationBar.vue'
import Modal from '../components/Modal.vue'
import { useAuthStore } from '../stores/auth'
import { useToast } from '../composables/useToast'
import { getPagedData } from '../api/common'
import { formatDate, getStatusBadgeClass } from '../utils/formatters'
import { editLeave, approveLeave, rejectLeave, cancelLeave, closeOffLeave, guaranteeLeave, getLeaveQRCode } from '../api/leaves'
import { getAllCourses, getStudentCourses } from '../api/students'

const auth = useAuthStore()
const toast = useToast()

const currentUserId = computed(() => auth.userId ?? 0)
const currentRole = computed(() => auth.userRole ?? '')

// Pagination
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const totalPages = ref(1)
const loading = ref(false)
const leaves = ref<any[]>([])

// Edit modal
const editVisible = ref(false)
const editLoading = ref(false)
const editError = ref('')
const currentEditLeave = ref<any>(null)
const courses = ref<any[]>([])
const editForm = reactive({
  student_id: 0,
  leave_date: '',
  leave_hours: '',
  leave_type: '',
  remarks: '',
  materials: '',
  course_id: 0,
  teacher_id: 0,
})

// Audit modal
const auditVisible = ref(false)
const auditLoading = ref(false)
const auditError = ref('')
const currentAuditLeave = ref<any>(null)
const auditForm = reactive({ status: '', audit_remarks: '' })

// QR modal
const qrVisible = ref(false)
const qrData = ref('')
const qrLoading = ref(false)
const qrError = ref('')

// Columns per role
const baseColumns = [
  { key: 'leave_id', label: '请假ID' },
  { key: 'leave_type', label: '请假类型' },
  { key: 'leave_hours', label: '请假课时' },
  { key: 'leave_date', label: '请假时间', format: (v: string) => formatDate(v) },
  { key: 'status', label: '状态' },
]

const adminReviewerColumns = [
  { key: 'leave_id', label: '请假ID' },
  { key: 'student_name', label: '学生名称' },
  { key: 'leave_type', label: '请假类型' },
  { key: 'leave_hours', label: '请假课时' },
  { key: 'leave_date', label: '请假时间', format: (v: string) => formatDate(v) },
  { key: 'remarks', label: '备注' },
  { key: 'status', label: '状态' },
  { key: 'reviewer_name', label: '审核人' },
  { key: 'audit_remarks', label: '审核意见' },
]

const studentColumns = [
  ...baseColumns,
  { key: 'guarantee_student_name', label: '担保人' },
  { key: 'reviewer_name', label: '审核人' },
  { key: 'audit_remarks', label: '审核意见' },
]

const columns = computed(() => {
  if (currentRole.value === 'student') return studentColumns
  if (currentRole.value === 'teacher') return adminReviewerColumns
  return adminReviewerColumns
})

// Permission helpers
const canEdit = (leave: any) =>
  currentRole.value === 'student' && leave.student_id === currentUserId.value && leave.status === '待审批'

const canAudit = (leave: any) =>
  currentRole.value === 'admin' || (currentRole.value === 'reviewer' && leave.status === '待审批')

const canCancel = (leave: any) =>
  (currentRole.value === 'student' && leave.student_id === currentUserId.value && leave.status === '待审批') ||
  currentRole.value === 'admin'

const canCloseOff = (leave: any) =>
  leave.status === '已批准' && (currentRole.value === 'reviewer' || currentRole.value === 'admin')

const isGuarantorFor = (leave: any) =>
  leave.guarantee_student_id === currentUserId.value && leave.student_id !== currentUserId.value

// Data fetching
async function fetchLeaves() {
  loading.value = true
  try {
    const res = await getPagedData('/leaves', page.value, pageSize.value) as any
    leaves.value = res?.items ?? res?.data ?? []
    total.value = res?.total ?? 0
    totalPages.value = res?.total_pages ?? Math.ceil(total.value / pageSize.value)
  } catch {
    toast.error('获取请假列表失败')
  } finally {
    loading.value = false
  }
}

function onPageChange(p: number) { page.value = p; fetchLeaves() }
function onPageSizeChange(s: number) { pageSize.value = s; page.value = 1; fetchLeaves() }

// Edit
async function openEdit(leave: any) {
  currentEditLeave.value = leave
  editError.value = ''
  editVisible.value = true
  Object.assign(editForm, {
    student_id: leave.student_id,
    leave_date: leave.leave_date ? new Date(leave.leave_date).toISOString().split('T')[0] : '',
    leave_hours: leave.leave_hours || '',
    leave_type: leave.leave_type || '',
    remarks: leave.remarks || '',
    materials: leave.materials || '',
    course_id: leave.course_id || 0,
    teacher_id: leave.teacher_id || 0,
  })
  // Fetch courses
  try {
    if (currentRole.value === 'student') {
      const sc = await getStudentCourses(currentUserId.value) as any
      courses.value = (sc ?? []).map((c: any) => ({
        course_id: c.course_id,
        course_name: c.course_name || `课程 ${c.course_id}`,
        teacher_name: c.teacher_name || '未知教师',
        teacher_id: 0,
      }))
    } else {
      courses.value = (await getAllCourses()) as any
    }
  } catch { courses.value = [] }
}

function onCourseChange() {
  const c = courses.value.find((x: any) => x.course_id === editForm.course_id)
  editForm.teacher_id = c ? c.teacher_id : 0
}

async function submitEdit() {
  if (!currentEditLeave.value) return
  editLoading.value = true
  editError.value = ''
  try {
    const payload: any = {
      student_id: Number(editForm.student_id),
      leave_date: editForm.leave_date,
      leave_hours: String(editForm.leave_hours),
    }
    if (editForm.course_id > 0) payload.course_id = editForm.course_id
    if (editForm.teacher_id) payload.teacher_id = editForm.teacher_id
    if (editForm.leave_type) payload.leave_type = editForm.leave_type.slice(0, 8)
    if (editForm.remarks) payload.remarks = editForm.remarks.slice(0, 100)
    if (editForm.materials) payload.materials = editForm.materials.slice(0, 100)

    await editLeave(currentEditLeave.value.leave_id, payload)
    toast.success('修改成功')
    editVisible.value = false
    fetchLeaves()
  } catch (e: any) {
    const err = (e as any)?.response?.data
    editError.value = (typeof err === 'string' ? err : err?.message) || '修改失败'
  } finally {
    editLoading.value = false
  }
}

// Audit
function openAudit(leave: any) {
  currentAuditLeave.value = leave
  auditError.value = ''
  auditForm.status = ''
  auditForm.audit_remarks = ''
  auditVisible.value = true
}

async function submitAudit() {
  if (!currentAuditLeave.value) return
  if (!auditForm.status) { auditError.value = '请选择审核状态'; return }
  auditLoading.value = true
  auditError.value = ''
  try {
    const remarks = auditForm.audit_remarks ? auditForm.audit_remarks.slice(0, 100) : ''
    if (auditForm.status === '已批准') {
      await approveLeave(currentAuditLeave.value.leave_id, remarks)
    } else {
      await rejectLeave(currentAuditLeave.value.leave_id, remarks)
    }
    toast.success('审核完成')
    auditVisible.value = false
    fetchLeaves()
  } catch (e: any) {
    auditError.value = '审核失败'
  } finally {
    auditLoading.value = false
  }
}

// Cancel
async function handleCancel(leave: any) {
  if (!confirm('确定要撤销这条请假申请吗？')) return
  try {
    await cancelLeave(leave.leave_id)
    toast.success('已撤销')
    fetchLeaves()
  } catch { toast.error('撤销失败') }
}

// Close off
async function handleCloseOff(leave: any) {
  const isGuarantor = isGuarantorFor(leave)
  let penaltyDays: number | undefined
  if (isGuarantor) {
    const ok = confirm(`确定销假？学生: ${leave.student_name}\n\n点确定：处罚7天\n点取消：仅销假`)
    penaltyDays = ok ? 7 : undefined
  } else {
    if (!confirm(`确定销假？学生: ${leave.student_name}`)) return
  }
  try {
    await closeOffLeave(leave.leave_id, penaltyDays)
    toast.success('销假成功')
    fetchLeaves()
  } catch { toast.error('销假失败') }
}

// Guarantee
async function handleGuarantee(leave: any) {
  if (!confirm(`确定要担保这张请假条吗？学生: ${leave.student_name}`)) return
  try {
    await guaranteeLeave(leave.leave_id)
    toast.success('担保成功')
    fetchLeaves()
  } catch { toast.error('担保失败') }
}

// QR Code
async function showQR(leave: any) {
  qrVisible.value = true
  qrData.value = ''
  qrError.value = ''
  qrLoading.value = true
  try {
    const res = await getLeaveQRCode(leave.leave_id) as any
    qrData.value = res?.qr_code ?? res ?? ''
  } catch {
    qrError.value = '获取二维码失败'
  } finally {
    qrLoading.value = false
  }
}

onMounted(fetchLeaves)
watch([page, pageSize], fetchLeaves)
</script>

<template>
  <AppLayout>
    <div class="p-4 space-y-4">
      <h1 class="text-xl font-semibold">
        {{ currentRole === 'student' ? '我的请假条' : '请假条列表' }}
      </h1>

      <DataTable :columns="columns" :data="leaves" :loading="loading" emptyText="暂无数据" :showActions="true">
        <template #cell-status="{ row: r }">
          <span class="text-xs px-2 py-0.5 rounded" :class="getStatusBadgeClass(r.status)">{{ r.status }}</span>
        </template>
        <template #actions="{ row: r }">
          <div class="flex flex-wrap gap-1">
            <button v-if="canEdit(r)" class="text-xs px-2 py-1 bg-amber-500 text-white rounded" @click="openEdit(r)">修改</button>
            <button v-if="canAudit(r)" class="text-xs px-2 py-1 bg-blue-600 text-white rounded" @click="openAudit(r)">审核</button>
            <button v-if="canCancel(r)" class="text-xs px-2 py-1 bg-red-500 text-white rounded" @click="handleCancel(r)">撤销</button>
            <button v-if="canCloseOff(r)" class="text-xs px-2 py-1 bg-green-600 text-white rounded" @click="handleCloseOff(r)">销假</button>
            <button v-if="isGuarantorFor(r) && r.status === '待审批'" class="text-xs px-2 py-1 bg-blue-600 text-white rounded" @click="handleGuarantee(r)">担保</button>
            <button v-if="r.status === '已批准'" class="text-xs px-2 py-1 bg-indigo-500 text-white rounded" @click="showQR(r)">凭证</button>
          </div>
        </template>
      </DataTable>

      <PaginationBar
        :currentPage="page"
        :totalPages="totalPages"
        :total="total"
        :pageSize="pageSize"
        :loading="loading"
        @page-change="onPageChange"
        @page-size-change="onPageSizeChange"
      />
    </div>

    <!-- Edit Modal -->
    <Modal :show="editVisible" title="修改请假条" maxWidth="max-w-xl" @close="editVisible = false">
      <div class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">学生ID</label>
            <input type="number" :value="editForm.student_id" disabled class="w-full border rounded px-3 py-2 bg-gray-100" />
          </div>
          <div>
            <label class="block text-sm mb-1">请假日期 *</label>
            <input type="date" v-model="editForm.leave_date" class="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div>
          <label class="block text-sm mb-1">课程</label>
          <select v-model="editForm.course_id" @change="onCourseChange" class="w-full border rounded px-3 py-2">
            <option :value="0">请选择课程</option>
            <option v-for="c in courses" :key="c.course_id" :value="c.course_id">{{ c.course_name }} ({{ c.teacher_name }})</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm mb-1">请假课时 *</label>
            <input type="number" v-model="editForm.leave_hours" class="w-full border rounded px-3 py-2" />
          </div>
          <div>
            <label class="block text-sm mb-1">请假类型</label>
            <select v-model="editForm.leave_type" class="w-full border rounded px-3 py-2">
              <option value="">请选择</option>
              <option value="病假">病假</option>
              <option value="事假">事假</option>
              <option value="公假">公假</option>
              <option value="其他">其他</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm mb-1">备注</label>
          <textarea v-model="editForm.remarks" rows="3" maxlength="100" class="w-full border rounded px-3 py-2" />
        </div>
        <div v-if="editError" class="text-sm text-red-600">{{ editError }}</div>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 border rounded" @click="editVisible = false">取消</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded" :disabled="editLoading" @click="submitEdit">{{ editLoading ? '修改中...' : '确认修改' }}</button>
        </div>
      </div>
    </Modal>

    <!-- Audit Modal -->
    <Modal :show="auditVisible" title="审核请假条" @close="auditVisible = false">
      <div class="space-y-3">
        <div>
          <label class="block text-sm mb-1">审核状态 *</label>
          <select v-model="auditForm.status" class="w-full border rounded px-3 py-2">
            <option value="">请选择</option>
            <option value="已批准">已批准</option>
            <option value="已拒绝">已拒绝</option>
          </select>
        </div>
        <div>
          <label class="block text-sm mb-1">审核备注</label>
          <textarea v-model="auditForm.audit_remarks" rows="4" maxlength="100" class="w-full border rounded px-3 py-2" />
        </div>
        <div v-if="auditError" class="text-sm text-red-600">{{ auditError }}</div>
        <div class="flex justify-end gap-2">
          <button class="px-4 py-2 border rounded" @click="auditVisible = false">取消</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded" :disabled="auditLoading" @click="submitAudit">{{ auditLoading ? '审核中...' : '确认审核' }}</button>
        </div>
      </div>
    </Modal>

    <!-- QR Modal -->
    <Modal :show="qrVisible" title="请假凭证" @close="qrVisible = false">
      <div class="text-center space-y-3">
        <div v-if="qrLoading" class="py-8 text-slate-500">加载中...</div>
        <div v-else-if="qrError" class="py-4 text-red-600">{{ qrError }}</div>
        <div v-else-if="qrData">
          <img :src="'data:image/png;base64,' + qrData" alt="请假凭证二维码" class="mx-auto max-w-64 border rounded p-2" />
          <p class="text-sm text-slate-500 mt-2">请将此二维码出示给教师核验</p>
        </div>
        <button class="px-4 py-2 border rounded" @click="qrVisible = false">关闭</button>
      </div>
    </Modal>
  </AppLayout>
</template>
