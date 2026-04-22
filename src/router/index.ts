import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '../utils/auth'

// Lazy-loaded route components (matching v1 paths)
const InitialSetupView = () => import('../views/InitialSetupView.vue')
const LoginView = () => import('../views/LoginView.vue')
const HomePage = () => import('../views/HomePage.vue')
const StudentsList = () => import('../views/StudentsList.vue')
const LeavesList = () => import('../views/LeavesList.vue')
const ReviewersList = () => import('../views/ReviewersList.vue')
const TeachersList = () => import('../views/TeachersList.vue')
const CoursesList = () => import('../views/CoursesList.vue')
const CourseStudentsView = () => import('../views/CourseStudentsView.vue')
const SchoolsList = () => import('../views/SchoolsList.vue')
const VerifyQRView = () => import('../views/VerifyQRView.vue')
const ProfileView = () => import('../views/ProfileView.vue')
const AuditLogsList = () => import('../views/AuditLogsList.vue')
const StatisticsView = () => import('../views/StatisticsView.vue')
const NotificationsView = () => import('../views/NotificationsView.vue')

const routes = [
  { path: '/admin/setup', name: 'InitialSetup', component: InitialSetupView, meta: { requiresAuth: false } },
  { path: '/login', name: 'Login', component: LoginView, meta: { requiresAuth: false } },
  { path: '/', name: 'Home', component: HomePage, meta: { requiresAuth: true } },
  { path: '/students', name: 'StudentsList', component: StudentsList, meta: { requiresAuth: true } },
  { path: '/leaves', name: 'LeavesList', component: LeavesList, meta: { requiresAuth: true } },
  { path: '/reviewers', name: 'ReviewersList', component: ReviewersList, meta: { requiresAuth: true } },
  { path: '/teachers', name: 'TeachersList', component: TeachersList, meta: { requiresAuth: true } },
  { path: '/courses', name: 'CoursesList', component: CoursesList, meta: { requiresAuth: true } },
  { path: '/courses/:id/students', name: 'CourseStudentsView', component: CourseStudentsView, meta: { requiresAuth: true } },
  { path: '/schools', name: 'SchoolsList', component: SchoolsList, meta: { requiresAuth: true } },
  { path: '/verify-qr', name: 'VerifyQRView', component: VerifyQRView, meta: { requiresAuth: false } },
  { path: '/profile', name: 'ProfileView', component: ProfileView, meta: { requiresAuth: true } },
  { path: '/audit-logs', name: 'AuditLogsList', component: AuditLogsList, meta: { requiresAuth: true } },
  { path: '/statistics', name: 'StatisticsView', component: StatisticsView, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'NotificationsView', component: NotificationsView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  if (to.meta?.requiresAuth && !isAuthenticated()) {
    return '/login'
  }
})

export default router
