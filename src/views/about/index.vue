<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">关于本项目</div>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="前端">Vue 3 + Vite + Element Plus + Sass</el-descriptions-item>
        <el-descriptions-item label="后端">FastAPI + PostgreSQL + Redis + Docker</el-descriptions-item>
        <el-descriptions-item label="目的">从零学习 Agent 开发</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup>
// 纯静态展示页，无逻辑
</script>
