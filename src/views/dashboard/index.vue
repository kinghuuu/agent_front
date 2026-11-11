<template>
  <div class="page-container">
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">应用</div>
          </template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="名称">{{
              health.app || "-"
            }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag
                :type="health.status === 'ok' ? 'success' : 'warning'"
                size="small"
              >
                {{ health.status || "未知" }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">依赖状态</div>
          </template>
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="PostgreSQL">
              <el-tag
                :type="health.database === 'up' ? 'success' : 'danger'"
                size="small"
              >
                {{ health.database || "未知" }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="Redis">
              <el-tag
                :type="health.redis === 'up' ? 'success' : 'danger'"
                size="small"
              >
                {{ health.redis || "未知" }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
// 概览页：展示后端健康状态（应用 / PostgreSQL / Redis）。
// 数据来源：GET /api/v1/health，失败时由 request.js 统一提示。
import { onMounted, reactive } from "vue";
import { ElMessage } from "element-plus";
import { getHealth } from "@/api/system";

const health = reactive({ status: "", app: "", database: "", redis: "" });

// 进入页面拉取一次健康数据（刷新按钮已移除，不再需要 loading 状态）
const loadHealth = async () => {
  try {
    const data = await getHealth();
    Object.assign(health, data || {});
  } catch (error) {
    ElMessage.error(error.message || "获取后端状态失败");
  }
};

onMounted(loadHealth);
</script>
