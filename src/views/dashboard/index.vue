<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">应用</div>
          </template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="名称">{{ health.app || '-' }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="health.status === 'ok' ? 'success' : 'warning'" size="small">
                {{ health.status || '未知' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">依赖状态</div>
          </template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="PostgreSQL">
              <el-tag :type="health.database === 'up' ? 'success' : 'danger'" size="small">
                {{ health.database || '未知' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Redis">
              <el-tag :type="health.redis === 'up' ? 'success' : 'danger'" size="small">
                {{ health.redis || '未知' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">操作</div>
          </template>
          <el-button type="primary" :loading="loading" @click="loadHealth">刷新状态</el-button>
          <p class="tip">接口：GET /api/v1/health</p>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 概览页：展示后端健康状态（应用 / PostgreSQL / Redis）。
// 数据来源：GET /api/v1/health，失败时由 request.js 统一提示。
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getHealth } from '@/api/system'

const loading = ref(false)
const health = reactive({ status: '', app: '', database: '', redis: '' })

const loadHealth = async () => {
  loading.value = true
  try {
    const data = await getHealth()
    Object.assign(health, data || {})
  } catch (error) {
    ElMessage.error(error.message || '获取后端状态失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadHealth)
</script>

<style scoped lang="scss">
.tip {
  margin: $gap-md 0 0;
  color: $text-secondary;
  font-size: 12px;
}
</style>
