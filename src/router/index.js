/**
 * 路由表。
 * 约定：所有业务页面都挂在 `/` 布局（BasicLayout）的 children 下，
 * 侧边栏菜单由布局组件读取本文件的 meta 自动生成：
 *   meta.title  菜单文案（同时用作浏览器标题与面包屑）
 *   meta.icon   Element Plus 图标名（必须是图标包中真实存在的名字）
 *   meta.hidden 为 true 时不在菜单中显示
 */
import { createRouter, createWebHistory } from 'vue-router'
import BasicLayout from '@/layouts/BasicLayout.vue'

const routes = [
  {
    path: '/',
    component: BasicLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '概览', icon: 'Odometer' }
      },
      {
        path: 'agent',
        name: 'Agent',
        component: () => import('@/views/agent/index.vue'),
        // fullscreen: 页面自己撑满内容区（对话页不需要 el-main 的内边距）
        meta: { title: '智能体', icon: 'ChatDotRound', fullscreen: true }
      },
      {
        path: 'models',
        name: 'Models',
        component: () => import('@/views/models/index.vue'),
        meta: { title: '模型管理', icon: 'Cpu' }
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/about/index.vue'),
        meta: { title: '关于', icon: 'InfoFilled' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/error/404.vue'),
    meta: { hidden: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} - Agent Front` : 'Agent Front'
})

export default router
