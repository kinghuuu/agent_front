<template>
  <div v-loading="loading">
    <p class="pane-tip">
      这是随请求发给模型的 <b>tools 清单</b>——模型看不到函数代码，只能读到这些说明书，
      它选不选工具、参数填得对不对，完全取决于 description 写得清不清楚
      （Day 04：四段式写法——做什么 / 何时用 / 何时不用 / 返回什么）。
    </p>

    <!-- Day 04 练习 2：说明书预算——每轮请求都要重新付费的隐性成本 -->
    <el-alert
      v-if="budget"
      class="budget-tip"
      :type="budget.over_limit ? 'warning' : 'info'"
      :closable="false"
      show-icon
      :title="`工具说明书总字符数：${budget.total_chars} / 预算 ${budget.limit}（每轮请求都会重复发送）。` +
        `description 最长：${budget.top_tools.map(t => `${t.name}(${t.chars}字符)`).join('、')}` +
        (budget.over_limit ? '——已超预算，优先精简最长的说明或考虑工具分组。' : '')"
    />

    <div class="tool-grid">
      <el-card v-for="tool in tools" :key="tool.name" shadow="never" class="tool-card">
        <div class="tool-head">
          <el-tag type="primary" effect="dark" size="small">{{ tool.name }}</el-tag>
          <!-- Day 04：副作用分级与确认门——读写分离，安全边界落在代码里 -->
          <el-tag
            size="small"
            effect="plain"
            :type="tool.side_effect === 'read' ? 'info' : 'warning'"
            class="meta-tag"
          >
            {{ tool.side_effect }}
          </el-tag>
          <el-tag v-if="tool.require_confirm" size="small" type="danger" effect="plain" class="meta-tag">
            需用户确认
          </el-tag>
        </div>
        <p class="tool-desc">{{ tool.description }}</p>
        <p class="schema-label">parameters（由 Pydantic 参数模型自动生成）</p>
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
// 工具清单：展示"模型眼里看到的工具长什么样"（名字 + 说明书 + 参数 Schema + 副作用分级），
// 以及 Day 04 练习 2 的说明书预算与 Day 03 练习 2 的调用日志
import { onMounted, ref } from 'vue'
import { getStudyToolBudget, getStudyToolCalls, listStudyTools } from '@/api/study'

const loading = ref(true)
const tools = ref([])
const budget = ref(null)
const logs = ref([])
const logLoading = ref(false)

// 加载说明书预算（练习 2），失败不阻塞页面
const loadBudget = async () => {
  try {
    budget.value = await getStudyToolBudget()
  } catch {
    // 静默失败：预算只是观察性数据
  }
}

// 加载工具调用日志（Day 03 练习 2），失败不阻塞页面
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
  loadBudget()
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
  /* 固定一行两个卡片；窄屏（移动端）下退回单列，避免说明书文本被挤成一列字 */
  grid-template-columns: repeat(2, 1fr);
  gap: $gap-md;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.tool-card {
  /* 卡片整体限高 360px（约等于"两段 description + 十行 JSON"的可视高度）：
     内容超出时在卡片内部纵向滚动，而不是把整页拉长；
     取 360 而非 300，是因为四段式 description + parameters 标题已占掉近 150px，
     300 会让绝大多数卡片一进来就出滚动条，还得先滚一下才知道工具长什么样 */
  max-height: 360px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    /* 滚到底不把滚动传给外层页面，避免"滚着滚着整页跳走" */
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }

  /* 细滚动条：默认滚动条会压住 JSON 内容的右边，视觉上很抢戏 */
  :deep(.el-card__body)::-webkit-scrollbar {
    width: 6px;
  }

  :deep(.el-card__body)::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.16);
  }

  :deep(.el-card__body)::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }

  :deep(.el-card__body)::-webkit-scrollbar-track {
    background: transparent;
  }

  .tool-head {
    margin-bottom: $gap-sm;

    .meta-tag {
      margin-left: 6px;
    }
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

.budget-tip {
  margin-bottom: $gap-md;
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
