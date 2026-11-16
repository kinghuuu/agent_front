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

    <!-- Day 03 练习 2：统一分发器的调用日志——观察一轮对话真实执行了几次工具 -->
    <div class="log-section">
      <div class="log-head">
        <h3 class="log-title">
          工具调用日志
          <el-tag size="small" effect="plain">Day 03 练习 2</el-tag>
        </h3>
        <el-button size="small" :loading="logLoading" @click="loadLog">刷新</el-button>
      </div>
      <p class="log-tip">
        这是 <code>dispatch</code> 分发器记录的每次真实执行（时间 / 工具 / 参数 / 耗时 / 是否报错）。
        跑一次 Agent 循环后过来刷新，观察"一轮对话到底执行了几次工具"；
        内存保留最近 200 条，重启后端即清空。
      </p>
      <el-table :data="logs" size="small" empty-text="还没有调用记录——去跑一次 Agent 循环吧">
        <el-table-column prop="time" label="时间" width="90" />
        <el-table-column prop="name" label="工具" width="130" />
        <el-table-column label="参数" min-width="200">
          <template #default="{ row }">
            <code class="log-args">{{ JSON.stringify(row.arguments) }}</code>
          </template>
        </el-table-column>
        <el-table-column label="耗时" width="80">
          <template #default="{ row }">{{ row.duration_ms }}ms</template>
        </el-table-column>
        <el-table-column label="结果" width="90">
          <template #default="{ row }">
            <el-tag size="small" :type="row.is_error ? 'danger' : 'success'">
              {{ row.is_error ? '报错' : '成功' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
// 工具清单：展示"模型眼里看到的工具长什么样"（名字 + 说明书 + 参数 Schema），
// 以及 Day 03 练习 2 的调用日志（dispatch 分发器的真实执行记录）
import { onMounted, ref } from 'vue'
import { getStudyToolCalls, listStudyTools } from '@/api/study'

const loading = ref(true)
const tools = ref([])
const logs = ref([])
const logLoading = ref(false)

// 加载工具调用日志（练习 2），失败不阻塞页面
const loadLog = async () => {
  logLoading.value = true
  try {
    logs.value = await getStudyToolCalls()
  } catch {
    // 静默失败：日志只是观察性数据
  } finally {
    logLoading.value = false
  }
}

onMounted(async () => {
  try {
    tools.value = await listStudyTools()
  } finally {
    loading.value = false
  }
  loadLog()
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

.log-section {
  margin-top: $gap-lg;

  .log-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $gap-sm;

    .log-title {
      margin: 0;
      font-size: 15px;
      color: $text-primary;
    }
  }

  .log-tip {
    margin: 0 0 $gap-sm;
    font-size: 12px;
    line-height: 1.8;
    color: $agent-text-muted;

    code {
      color: $agent-accent;
    }
  }

  .log-args {
    font-size: 12px;
    color: $text-regular;
    word-break: break-all;
  }
}
</style>
