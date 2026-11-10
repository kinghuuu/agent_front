<template>
  <div class="basic-layout">
    <el-container class="layout-container">
      <!-- 侧边栏 -->
      <el-aside class="layout-aside" :width="collapsed ? '64px' : '210px'">
        <div class="logo">
          <AgentIcon class="logo-icon" />
          <span v-show="!collapsed" class="logo-text">Agent 平台</span>
        </div>
        <el-menu
          class="layout-menu"
          :default-active="activePath"
          :collapse="collapsed"
          :collapse-transition="false"
          router
        >
          <template v-for="item in menuRoutes" :key="item.path">
            <el-menu-item :index="resolveMenuPath(item.path)">
              <el-icon><component :is="item.meta.icon" /></el-icon>
              <template #title>{{ item.meta.title }}</template>
            </el-menu-item>
          </template>
        </el-menu>
      </el-aside>

      <el-container>
        <!-- 顶部栏 -->
        <el-header class="layout-header">
          <el-icon class="fold-btn" :size="20" @click="toggleSidebar">
            <component :is="collapsed ? 'Expand' : 'Fold'" />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ route.meta.title }}</el-breadcrumb-item>
          </el-breadcrumb>
          <div class="header-right">
            <el-tag type="success" size="small" effect="plain">{{ backendStatus }}</el-tag>
          </div>
        </el-header>

        <!-- 内容区：meta.fullscreen 的页面（如会话页）去掉内边距，自行撑满 -->
        <el-main :class="['layout-main', { 'layout-main--full': route.meta.fullscreen }]">
          <router-view v-slot="{ Component }">
            <transition name="fade-slide" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
// 布局逻辑：
// 1) 菜单项来自路由表中 `/` 的 children（按 meta.hidden 过滤）
// 2) 侧边栏折叠状态存在 Pinia
// 3) 顶栏右侧展示后端健康状态，进入页面时探测一次
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import AgentIcon from '@/components/icons/AgentIcon.vue'
import { useAppStore } from '@/store/modules/app'
import { getHealth } from '@/api/system'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const { sidebarCollapsed: collapsed } = storeToRefs(appStore)
const { toggleSidebar } = appStore

const backendStatus = ref('检测中...')

// 由路由自动生成菜单（meta.hidden 的路由不展示）
const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find((r) => r.path === '/')
  return (layoutRoute?.children || []).filter((r) => !r.meta?.hidden)
})

const activePath = computed(() => `/${route.path.split('/')[1] || ''}`)

// el-menu 按 index 与 default-active 精确匹配来高亮，
// 路由表子路由的 path 是相对值（如 'dashboard'），这里统一补成完整路径（如 '/dashboard'）
const resolveMenuPath = (path) => (path.startsWith('/') ? path : `/${path}`)

onMounted(async () => {
  try {
    const data = await getHealth()
    backendStatus.value = data?.status === 'ok' ? '后端正常' : '后端降级'
  } catch {
    backendStatus.value = '后端未连接'
  }
})
</script>

<style scoped lang="scss">
.basic-layout {
  height: 100vh;
}

.layout-container {
  height: 100%;
}

// 浅色侧边栏：与内容区同色系，仅靠右侧描边分隔
.layout-aside {
  background-color: $sidebar-bg;
  border-right: 1px solid $border-color;
  overflow: hidden;
  @include transition(all);

  .logo {
    height: $header-height;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    color: $text-primary;

    .logo-icon {
      font-size: 24px;
    }

    .logo-text {
      font-size: 16px;
      font-weight: 600;
      white-space: nowrap;
    }
  }

  .layout-menu {
    border-right: none;
    background: transparent;
    --el-menu-bg-color: transparent;
    --el-menu-text-color: #{$text-regular};
    --el-menu-active-color: #{$primary-color};
    --el-menu-hover-bg-color: #{$sidebar-hover-bg};

    // 当前页菜单项加淡色底，浅色背景下光靠文字变色不够明显
    :deep(.el-menu-item.is-active) {
      background: $sidebar-hover-bg;
      font-weight: 600;
    }
  }
}

.layout-header {
  height: $header-height;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-bottom: 1px solid $border-color;

  .fold-btn {
    cursor: pointer;
    color: $text-regular;
  }

  .header-right {
    margin-left: auto;
  }
}

.layout-main {
  background-color: $bg-color;

  &--full {
    padding: 0;
    overflow: hidden;
  }
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateX(12px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-12px);
}
</style>
