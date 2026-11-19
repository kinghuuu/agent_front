<template>
  <div class="day10">
    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="LangGraph 不替换 LangChain：节点内部照样用 LangChain 组件，节点之间交给图来连——break 变成一条边，while 变成一条回头边"
    />

    <!-- 顶部：三件套 + while 对照表 -->
    <div class="card-block">
      <div class="block-head">
        <h4>State / Node / Edge 三件套（课程 1.2）</h4>
        <el-tag size="small" effect="plain">langgraph {{ mapping?.langgraph_version || '…' }}</el-tag>
      </div>
      <el-table :data="mapping?.triple_pieces || []" size="small" empty-text="加载中…">
        <el-table-column prop="piece" label="概念" width="80" />
        <el-table-column prop="what" label="是什么" min-width="200" />
        <el-table-column prop="handwritten" label="手写的对应物" min-width="180" />
        <el-table-column prop="key_point" label="关键点" min-width="260" show-overflow-tooltip />
      </el-table>

      <el-collapse class="mt">
        <el-collapse-item title="手写 while ↔ LangGraph 图，逐行对照（课程 1.6）" name="mapping">
          <el-table :data="mapping?.while_vs_graph || []" size="small">
            <el-table-column prop="handwritten" label="Day 01~09 手写" min-width="200" />
            <el-table-column prop="graph" label="Day 10 图" min-width="240" />
            <el-table-column prop="gap" label="差别" min-width="220" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item :title="`六个坑（课程第 4 节，${pitfalls.length} 条）`" name="pitfalls">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="50" />
            <el-table-column prop="title" label="坑" min-width="200" />
            <el-table-column prop="symptom" label="现象" min-width="200" show-overflow-tooltip />
            <el-table-column prop="fix" label="修法" min-width="240" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="model-bar">
      <span class="label">模型</span>
      <el-select v-model="modelId" placeholder="默认模型" size="small" clearable style="width: 200px">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="muted">②③④ 会真实调用模型；①⑤ 是纯本地实验（不花 token）</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 状态与 reducer -->
      <el-tab-pane label="① 状态与 reducer" name="state">
        <div class="card-block">
          <div class="block-head">
            <h4>四个对照实验：同一个图，只改一行 Annotated</h4>
            <el-button type="primary" size="small" :loading="stateLoading" @click="doState">
              跑四个实验
            </el-button>
          </div>
          <p class="hint">
            这是今天最容易翻车的地方：不给 <code>messages</code> 加 reducer，第二个节点一写就把它覆盖成一条，
            Agent 瞬间「失忆」。实验 D 顺便演示相反方向的坑——节点返回全量再让 reducer 追加。
          </p>
        </div>

        <template v-if="stateResult">
          <div v-for="item in stateResult.experiments" :key="item.key" class="card-block">
            <div class="block-head">
              <h4>{{ item.title }}</h4>
              <el-tag size="small" effect="plain">{{ item.key }}</el-tag>
            </div>
            <pre class="code-block">{{ item.state_def }}</pre>
            <el-table :data="item.patches" size="small" class="mt">
              <el-table-column prop="node" label="节点" width="90" />
              <el-table-column label="读到（received）" min-width="200">
                <template #default="{ row }">
                  <span class="mono">{{ shortJson(row.received) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="交出（patch）" min-width="200">
                <template #default="{ row }">
                  <span class="mono">{{ shortJson(row.patch) }}</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="mt">
              <el-tag size="small" type="success" effect="plain">最终状态</el-tag>
              <pre class="code-block">{{ JSON.stringify(item.result, null, 2) }}</pre>
            </div>
            <p class="hint">{{ item.verdict }}</p>
          </div>

          <div class="card-block">
            <h4>reducer 速查表</h4>
            <el-table :data="stateResult.reducer_table" size="small">
              <el-table-column prop="declare" label="声明" min-width="260" />
              <el-table-column prop="merge" label="合并行为" min-width="180" />
              <el-table-column prop="use" label="典型用途" min-width="200" />
            </el-table>
            <p class="hint">{{ stateResult.takeaway }}</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ② 最小线性图 -->
      <el-tab-pane label="② 最小线性图" name="min">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.min_graph || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="minQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="minQuestion" size="small" placeholder="问点什么（知识库只有『保修』『退款』能命中）" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="minLoading"
              :disabled="!minQuestion.trim()"
              @click="doMin"
            >
              START → retrieve → generate → END
            </el-button>
            <span class="muted">重点不是回答，而是每个节点交了什么补丁</span>
          </div>
        </div>

        <template v-if="minResult">
          <Day10Graph title="线性图" :structure="minResult.graph" />

          <div class="card-block">
            <div class="block-head">
              <h4>逐节点事件（updates 补丁 / values 完整状态）</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">{{ minResult.model }}</el-tag>
                <el-tag size="small" effect="plain">{{ minResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <el-table :data="minResult.events" size="small">
              <el-table-column label="mode" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.mode === 'updates' ? 'warning' : 'info'" effect="plain">
                    {{ row.mode }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="node" label="节点" width="100" />
              <el-table-column label="提交/包含字段" width="180">
                <template #default="{ row }">
                  <span class="mono">{{ row.fields.join(', ') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="内容" min-width="240">
                <template #default="{ row }">
                  <span class="mono">{{ shortJson(row.detail) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="card-block">
            <h4>最终回答</h4>
            <pre class="code-block">{{ minResult.answer || '（无回答）' }}</pre>
            <div class="meta-row mt">
              <el-tag size="small" effect="plain">trace: {{ (minResult.trace || []).join(' → ') }}</el-tag>
              <el-tag v-for="(doc, index) in minResult.docs" :key="index" size="small" type="info" effect="plain">
                {{ doc }}
              </el-tag>
            </div>
            <p class="hint">{{ minResult.note }}</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ③ 条件边 -->
      <el-tab-pane label="③ 条件边路由" name="conditional">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.conditional || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="fillConditionalPreset(item)"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input
            v-model="conditionalText"
            type="textarea"
            :rows="4"
            placeholder="每行一个问题，依次走一遍图"
          />
          <div class="threshold-row mt">
            <span class="muted">置信度阈值 = {{ conditionalThreshold.toFixed(2) }}</span>
            <el-slider v-model="conditionalThreshold" :min="0" :max="1" :step="0.05" size="small" />
            <span class="muted">低于它就走「转人工」（练习 1）</span>
          </div>
          <div class="row-actions mt">
            <el-button type="primary" size="small" :loading="conditionalLoading" @click="doConditional">
              跑路由
            </el-button>
            <span class="muted">classify 只打标签 → route 只选路 → 分支各自收口</span>
          </div>
        </div>

        <template v-if="conditionalResult">
          <Day10Graph title="条件边图（四条分支）" :structure="conditionalResult.graph" />

          <div class="card-block">
            <div class="block-head">
              <h4>三条轨迹：不同问句走不同路径</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">阈值 {{ conditionalResult.threshold }}</el-tag>
                <el-tag size="small" effect="plain">{{ conditionalResult.model }}</el-tag>
                <el-tag size="small" effect="plain">{{ conditionalResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <el-table :data="conditionalResult.runs" size="small">
              <el-table-column prop="question" label="问题" min-width="180" show-overflow-tooltip />
              <el-table-column label="intent / 置信度" width="170">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.intent }}</el-tag>
                  <el-tag
                    size="small"
                    class="ml"
                    :type="row.confidence < conditionalResult.threshold ? 'danger' : 'success'"
                    effect="plain"
                  >
                    {{ row.confidence }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="走了哪些节点" width="200">
                <template #default="{ row }">
                  <span class="mono">{{ (row.path || []).join(' → ') }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="answer" label="回答" min-width="260" show-overflow-tooltip />
            </el-table>
            <p class="hint">{{ conditionalResult.note }}</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ ReAct 环 -->
      <el-tab-pane label="④ ReAct 环（核心）" name="react">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.react || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="reactQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="reactQuestion" type="textarea" :rows="2" placeholder="问题" />
          <div class="form-grid mt">
            <div class="field">
              <span class="muted">recursion_limit（物理保险丝，数的是超步）</span>
              <el-input-number v-model="reactRecursionLimit" size="small" :min="2" :max="40" />
            </div>
            <div class="field">
              <span class="muted">step_limit（语义刹车，练习 2）</span>
              <el-input-number v-model="reactStepLimit" size="small" :min="1" :max="20" />
            </div>
            <div class="field">
              <span class="muted">工具状态</span>
              <el-radio-group v-model="reactToolMode" size="small">
                <el-radio-button value="ok">正常</el-radio-button>
                <el-radio-button value="broken">永远失败</el-radio-button>
              </el-radio-group>
            </div>
            <div class="field">
              <span class="muted">练习 3：打包成子图</span>
              <el-switch v-model="reactAsSubgraph" size="small" />
            </div>
          </div>
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="reactLoading"
              :disabled="!reactQuestion.trim()"
              @click="doReact"
            >
              跑 ReAct 环
            </el-button>
            <span class="muted">练习 2：工具选「永远失败」+ step_limit 调到 1~2，最容易看到 degrade 节点接手</span>
          </div>
        </div>

        <template v-if="reactResult">
          <Day10Graph title="ReAct 图（★ 那条回头边就是循环）" :structure="reactResult.graph" />

          <div class="card-block">
            <div class="block-head">
              <h4>最终回答</h4>
              <div class="meta-row">
                <el-tag size="small" :type="stopTagType(reactResult.stop_reason)" effect="plain">
                  {{ reactResult.stop_reason }}
                </el-tag>
                <el-tag size="small" effect="plain">steps {{ reactResult.step_limit }} 上限</el-tag>
                <el-tag size="small" effect="plain">超步 {{ reactResult.outer_steps }}</el-tag>
                <el-tag size="small" effect="plain">messages {{ reactResult.messages_count }}</el-tag>
                <el-tag size="small" effect="plain">{{ reactResult.model }} · {{ reactResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <pre class="code-block">{{ reactResult.final_answer || '（没有产出回答）' }}</pre>
            <p class="hint">{{ reactResult.note }}</p>
          </div>

          <div class="card-block">
            <h4>执行轨迹（agent ⇄ tools，每个节点提交的补丁）</h4>
            <el-timeline>
              <el-timeline-item
                v-for="(event, index) in reactResult.events"
                :key="index"
                :timestamp="`${event.scope} · ${event.node}`"
              >
                <template v-if="event.kind === 'tool_call'">
                  <div v-for="call in toolCallsOf(event)" :key="call.id" class="call">
                    <el-tag size="small">{{ call.name }}</el-tag>
                    <span class="muted">{{ JSON.stringify(call.args) }}</span>
                  </div>
                </template>
                <template v-else-if="event.kind === 'tool_result'">
                  <p class="line">工具返回：{{ firstContent(event) }}</p>
                </template>
                <template v-else-if="event.kind === 'answer'">
                  <p class="line">回答：{{ firstContent(event) }}</p>
                </template>
                <span v-else class="muted">状态更新：steps = {{ event.steps }}</span>
              </el-timeline-item>
            </el-timeline>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ 并行 -->
      <el-tab-pane label="⑤ 并行扇出" name="parallel">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.parallel || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="parallelQuery = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="parallelQuery" size="small" placeholder="检索词（分号分隔的子查询决定 Send 的分支数）" />
          <div class="row-actions mt">
            <el-button type="primary" size="small" :loading="parallelLoading" @click="doParallel">
              跑三个并行实验
            </el-button>
            <span class="muted">本地假检索，不花 token</span>
          </div>
        </div>

        <template v-if="parallelResult">
          <div class="card-block">
            <div class="block-head">
              <h4>① 静态扇出 / 汇聚</h4>
              <div class="meta-row">
                <el-tag size="small" type="success" effect="plain">实际 {{ parallelResult.static.elapsed_s }}s</el-tag>
                <el-tag size="small" type="info" effect="plain">串行需 {{ parallelResult.static.sum_s }}s</el-tag>
              </div>
            </div>
            <el-table :data="costRows" size="small">
              <el-table-column prop="name" label="分支" width="100" />
              <el-table-column prop="cost" label="模拟耗时(s)" width="110" />
            </el-table>
            <pre class="code-block mt">{{ parallelResult.static.merged }}</pre>
            <p class="hint">
              耗时取<b>最大</b>而不是求和；<code>docs</code> 的顺序不保证（完成顺序不同）。
              汇聚节点自动等全部上游——这是超步模型的直接结果，不用写 join。
            </p>
          </div>

          <Day10Graph title="① 静态扇出图" :structure="parallelResult.static.graph" />

          <div class="card-block">
            <div class="block-head">
              <h4>② Send 动态扇出（分支数运行时决定）</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">{{ parallelResult.dynamic.branch_count }} 条分支</el-tag>
                <el-tag size="small" effect="plain">{{ parallelResult.dynamic.elapsed_s }}s</el-tag>
              </div>
            </div>
            <el-table :data="parallelResult.dynamic.subs.map((sub, index) => ({ index: index + 1, sub }))" size="small">
              <el-table-column prop="index" label="#" width="60" />
              <el-table-column prop="sub" label="子查询（Send 的 payload）" />
            </el-table>
            <pre class="code-block mt">{{ parallelResult.dynamic.merged }}</pre>
            <ul class="rule-list">
              <li v-for="rule in parallelResult.send_rules" :key="rule">{{ rule }}</li>
            </ul>
          </div>

          <Day10Graph title="② Send 扇出图" :structure="parallelResult.dynamic.graph" />

          <div class="card-block">
            <div class="block-head">
              <h4>③ 子图当节点（subgraphs=True 看内部事件）</h4>
              <el-tag size="small" effect="plain">{{ parallelResult.subgraph.elapsed_s }}s</el-tag>
            </div>
            <el-table :data="parallelResult.subgraph.events" size="small">
              <el-table-column prop="scope" label="命名空间" width="120" />
              <el-table-column prop="node" label="节点" width="120" />
              <el-table-column label="补丁" min-width="240">
                <template #default="{ row }">
                  <span class="mono">{{ shortJson(row.patch) }}</span>
                </template>
              </el-table-column>
            </el-table>
            <pre class="code-block mt">{{ parallelResult.subgraph.summary }}</pre>
            <el-alert class="mt" type="warning" :closable="false" :title="parallelResult.subgraph.reducer_trap" />
          </div>

          <Day10Graph title="③ 子图（外层图）" :structure="parallelResult.subgraph.graph" />

          <div class="card-block">
            <p class="hint">{{ parallelResult.note }}</p>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 10 实验台：LangGraph 状态图——reducer / 线性图 / 条件边 / ReAct 环 / 并行扇出
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDay10Mapping,
  listChatModels,
  runDay10Conditional,
  runDay10MinGraph,
  runDay10Parallel,
  runDay10React,
  runDay10State
} from '@/api/study'
import Day10Graph from './Day10Graph.vue'

const mapping = ref(null)
const models = ref([])
const modelId = ref(null)
const subTab = ref('state')

// ① 状态与 reducer
const stateLoading = ref(false)
const stateResult = ref(null)

// ② 最小线性图
const minQuestion = ref('XR-500 Pro 保修多久？')
const minLoading = ref(false)
const minResult = ref(null)

// ③ 条件边
const conditionalText = ref('SO20261101001 到哪了？\n能退款吗？\n你们几点上班？')
const conditionalThreshold = ref(0.6)
const conditionalLoading = ref(false)
const conditionalResult = ref(null)

// ④ ReAct 环
const reactQuestion = ref('帮我查下 SO20261101001 到哪了，顺便说下 XR-500 Pro 的退款政策')
const reactRecursionLimit = ref(12)
const reactStepLimit = ref(6)
const reactToolMode = ref('ok')
const reactAsSubgraph = ref(false)
const reactLoading = ref(false)
const reactResult = ref(null)

// ⑤ 并行
const parallelQuery = ref('退款；订单物流；发票政策')
const parallelLoading = ref(false)
const parallelResult = ref(null)

// 静态扇出各分支的模拟耗时（与后端 costs 一致）
const costRows = [
  { name: 'kb', cost: 0.3 },
  { name: 'ticket', cost: 0.5 },
  { name: 'web', cost: 0.4 }
]

// 长 JSON 一行显示：表格里只露出开头，完整内容放折叠/pre
const shortJson = (value) => {
  const text = JSON.stringify(value)
  return text && text.length > 120 ? `${text.slice(0, 120)}…` : text
}

// ReAct 停止原因配色：completed 绿 / degraded 橙 / recursion_limit 红
const stopTagType = (reason) =>
  ({ completed: 'success', degraded: 'warning', recursion_limit: 'danger' })[reason] || 'info'

const toolCallsOf = (event) => (event.messages || []).flatMap((item) => item.tool_calls || [])

const firstContent = (event) => (event.messages || [])[0]?.content || ''

// 条件边预设：点一下追加一行，方便构造"模糊问句"验证转人工
const fillConditionalPreset = (question) => {
  const lines = conditionalText.value.split('\n').map((item) => item.trim()).filter(Boolean)
  if (!lines.includes(question)) lines.push(question)
  conditionalText.value = lines.join('\n')
}

// ① 四个 reducer 对照实验（纯本地）
const doState = async () => {
  stateLoading.value = true
  try {
    stateResult.value = await runDay10State()
  } finally {
    stateLoading.value = false
  }
}

// ② 线性图：retrieve → generate
const doMin = async () => {
  minLoading.value = true
  try {
    minResult.value = await runDay10MinGraph({
      question: minQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    minLoading.value = false
  }
}

// ③ 条件边：一次跑一行问题
const doConditional = async () => {
  const questions = conditionalText.value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
  if (!questions.length) {
    ElMessage.warning('至少写一个问题')
    return
  }
  conditionalLoading.value = true
  try {
    conditionalResult.value = await runDay10Conditional({
      questions,
      threshold: conditionalThreshold.value,
      model_config_id: modelId.value || undefined
    })
  } finally {
    conditionalLoading.value = false
  }
}

// ④ ReAct 环：刹车参数与工具状态都可调
const doReact = async () => {
  reactLoading.value = true
  try {
    reactResult.value = await runDay10React({
      question: reactQuestion.value.trim(),
      recursion_limit: reactRecursionLimit.value,
      step_limit: reactStepLimit.value,
      tool_mode: reactToolMode.value,
      as_subgraph: reactAsSubgraph.value,
      model_config_id: modelId.value || undefined
    })
  } finally {
    reactLoading.value = false
  }
}

// ⑤ 并行：三个实验一次跑完
const doParallel = async () => {
  parallelLoading.value = true
  try {
    parallelResult.value = await runDay10Parallel({ query: parallelQuery.value.trim() })
  } finally {
    parallelLoading.value = false
  }
}

// 对照表里的实验清单（6 个坑在 mapping 里，按需在折叠区展示）
const pitfalls = computed(() => mapping.value?.pitfalls || [])

onMounted(async () => {
  try {
    mapping.value = await getDay10Mapping()
  } catch {
    // 概念表加载失败不阻塞实验区
  }
  try {
    models.value = await listChatModels()
  } catch {
    // 模型列表失败时后端会给出明确错误
  }
})
</script>

<style lang="scss" scoped>
.day10 {
  .tip {
    margin-bottom: $gap-sm;
  }

  .card-block {
    padding: $gap-md;
    margin-bottom: $gap-md;
    border: 1px solid #e8e9f0;
    border-radius: $radius-md;
    background: #fff;

    h4 {
      margin: 0 0 $gap-sm;
      font-size: 13px;
      color: $text-primary;
    }
  }

  .block-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: $gap-sm;

    h4 {
      margin: 0;
    }
  }

  .model-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: $gap-sm;

    .label {
      font-size: 12px;
      color: $text-regular;
    }
  }

  .muted {
    font-size: 12px;
    color: $agent-text-muted;
  }

  .hint {
    margin: $gap-sm 0 0;
    font-size: 12px;
    line-height: 1.7;
    color: $agent-text-muted;

    b {
      color: $agent-accent;
    }

    code {
      padding: 0 3px;
      border-radius: 3px;
      background: #f2f3fa;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 11px;
    }
  }

  .mono {
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 11px;
    word-break: break-all;
  }

  .mt {
    margin-top: 8px;
  }

  .ml {
    margin-left: 6px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
    align-items: end;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .threshold-row {
    display: flex;
    align-items: center;
    gap: 10px;

    :deep(.el-slider) {
      flex: 1;
    }
  }

  .row-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .preset-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: $gap-sm;

    .preset {
      cursor: pointer;
      font-size: 11px;
    }
  }

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .call {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }

  .line {
    margin: 0;
    font-size: 12px;
    line-height: 1.7;
    color: $text-regular;
    word-break: break-all;
  }

  .rule-list {
    margin: $gap-sm 0 0;
    padding-left: 18px;
    font-size: 12px;
    line-height: 1.8;
    color: $agent-text-muted;
  }

  .code-block {
    margin: 0;
    padding: 10px 12px;
    border-radius: $radius-sm;
    background: #f7f8fc;
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 11px;
    line-height: 1.8;
    color: $text-regular;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 320px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
</style>
