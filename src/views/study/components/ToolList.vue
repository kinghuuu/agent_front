<template>
  <div v-loading="loading">
    <p class="pane-tip">
      这是随请求发给模型的 <b>tools 清单</b>——模型看不到函数代码，只能读到这些说明书，
      它选不选工具、参数填得对不对，完全取决于 description 写得清不清楚。
    </p>

    <div class="tool-grid">
      <el-card v-for="tool in tools" :key="tool.name" shadow="never" class="tool-card">
        <div class="tool-head">
          <el-tag type="primary" effect="dark" size="small">{{ tool.name }}</el-tag>
        </div>
        <p class="tool-desc">{{ tool.description }}</p>
        <p class="schema-label">parameters（JSON Schema）</p>
        <pre class="schema-block">{{ JSON.stringify(tool.parameters, null, 2) }}</pre>
      </el-card>
    </div>
  </div>
</template>

<script setup>
// 工具清单：展示"模型眼里看到的工具长什么样"（名字 + 说明书 + 参数 Schema）
import { onMounted, ref } from 'vue'
import { listStudyTools } from '@/api/study'

const loading = ref(true)
const tools = ref([])

onMounted(async () => {
  try {
    tools.value = await listStudyTools()
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.pane-tip {
  margin: 0 0 $gap-md;
  font-size: 13px;
  line-height: 1.8;
  color: $text-regular;

  b {
    color: $agent-accent;
  }
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: $gap-md;
}

.tool-card {
  .tool-head {
    margin-bottom: $gap-sm;
  }

  .tool-desc {
    margin: 0 0 $gap-sm;
    font-size: 13px;
    line-height: 1.7;
    color: $text-regular;
  }

  .schema-label {
    margin: 0 0 6px;
    font-size: 12px;
    color: $agent-text-muted;
  }

  .schema-block {
    margin: 0;
    padding: 10px 12px;
    border-radius: $radius-sm;
    background: #f5f6fa;
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 1.6;
    color: $text-primary;
    overflow-x: auto;
    white-space: pre-wrap;
  }
}
</style>
