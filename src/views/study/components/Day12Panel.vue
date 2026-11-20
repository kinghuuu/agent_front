<template>
  <div class="day12">
    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="Supervisor = 一个只派活的主管 + 若干只干专活的专家。主管的人格不是 prompt 约束出来的，是输出 schema 卡出来的（Route 里没有 content 字段）"
    />

    <!-- 顶部：三堵墙 + 折叠的概念表 -->
    <div class="card-block">
      <div class="block-head">
        <h4>单 Agent 的三堵墙（课程 1）</h4>
        <el-tag size="small" effect="plain">langgraph {{ mapping?.langgraph_version || '…' }}</el-tag>
      </div>
      <el-table :data="mapping?.walls || []" size="small" empty-text="加载中…">
        <el-table-column prop="no" label="#" width="46" />
        <el-table-column prop="title" label="墙" width="200" />
        <el-table-column prop="symptom" label="现象" min-width="240" show-overflow-tooltip />
        <el-table-column prop="cause" label="原因" min-width="240" show-overflow-tooltip />
        <el-table-column prop="fix" label="修法" min-width="260" show-overflow-tooltip />
      </el-table>

      <el-collapse class="mt">
        <el-collapse-item title="三角色分工：主管只派活 / 专家只干专活 / writer 只收尾（课程 2.1）" name="roles">
          <el-table :data="mapping?.roles || []" size="small">
            <el-table-column prop="role" label="角色" width="130" />
            <el-table-column prop="only" label="只做什么" min-width="220" />
            <el-table-column prop="never" label="绝对不做什么" min-width="260" show-overflow-tooltip />
            <el-table-column prop="why" label="怎么保证" min-width="260" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="三种交接方式：选一种，别混用（课程 2.3）" name="handoff">
          <el-table :data="mapping?.handoff_modes || []" size="small">
            <el-table-column prop="mode" label="方式" width="200" />
            <el-table-column prop="how" label="写法" min-width="260" show-overflow-tooltip />
            <el-table-column prop="fit" label="适合" min-width="220" />
            <el-table-column prop="trap" label="坑" min-width="260" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="状态三层：共享层 / 账本层 / 私有层（课程 2.4）" name="state">
          <el-table :data="mapping?.state_layers || []" size="small">
            <el-table-column prop="layer" label="层" width="100" />
            <el-table-column prop="fields" label="字段" min-width="240" />
            <el-table-column prop="rule" label="规矩" min-width="320" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="三层终止：FINISH / MAX_HANDOFF / recursion_limit（课程 2.5）" name="term">
          <el-table :data="mapping?.terminations || []" size="small">
            <el-table-column prop="kind" label="层" width="110" />
            <el-table-column prop="how" label="写法" min-width="320" show-overflow-tooltip />
            <el-table-column prop="note" label="说明" min-width="280" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item :title="`五个必踩的坑（第 5 节，${pitfalls.length} 条）`" name="pitfalls">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="46" />
            <el-table-column prop="title" label="坑" width="190" />
            <el-table-column prop="symptom" label="现象" min-width="220" show-overflow-tooltip />
            <el-table-column prop="fix" label="修法" min-width="300" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="该不该上多智能体：选型判据 + 成本量级（第 4 节）" name="decision">
          <el-table :data="mapping?.decision_table || []" size="small">
            <el-table-column prop="criterion" label="判据" width="120" />
            <el-table-column prop="single" label="单 Agent 就够" min-width="220" />
            <el-table-column prop="supervisor" label="该拆成 Supervisor" min-width="260" />
          </el-table>
          <el-table class="mt" :data="mapping?.cost_table || []" size="small">
            <el-table-column prop="arch" label="架构" min-width="260" />
            <el-table-column prop="calls" label="LLM 调用" width="110" />
            <el-table-column prop="tokens" label="输入 token" width="110" />
            <el-table-column prop="latency" label="延迟" width="90" />
            <el-table-column prop="routing" label="路由准确率" width="120" />
          </el-table>
          <p class="hint">单 Agent 在工具 ≤ 8 时是最优解；多花 3 倍 token 换来的是「可解释 + 可分级 + 可替换」。</p>
        </el-collapse-item>
        <el-collapse-item title="今日必掌握清单（第 8 节）" name="checklist">
          <ul class="rule-list">
            <li v-for="item in mapping?.checklist || []" :key="item">{{ item }}</li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="model-bar">
      <span class="label">模型</span>
      <el-select v-model="modelId" placeholder="默认模型" size="small" clearable style="width: 200px">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="muted">四个实验都会真实调用模型；① 单 Agent 与 ② 主管模式的 token 差距就是拆分的代价</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 单 Agent 复现 -->
      <el-tab-pane label="① 单 Agent 复现" name="single">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.single || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="singleQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="singleQuestion" type="textarea" :rows="2" placeholder="写一句需要查订单 + 退款 + 写话术的问题" />
          <div class="row-actions mt">
            <el-button type="primary" size="small" :loading="singleLoading" @click="doSingle('wide')">
              跑 wide（5 个工具）
            </el-button>
            <el-button size="small" :loading="singleLoading" @click="doSingle('narrow')">
              跑 narrow（3 个只读）
            </el-button>
            <span class="muted">同一句问法，只改工具集——越权与假收敛会肉眼可见地减少</span>
          </div>
        </div>

        <template v-if="singleResult">
          <div class="card-block">
            <div class="block-head">
              <h4>{{ singleResult.toolset === 'wide' ? '宽工具集' : '窄工具集' }} · 执行现场</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">LLM {{ singleResult.llm_calls }} 次</el-tag>
                <el-tag
                  v-for="(count, name) in singleResult.tool_counts"
                  :key="name"
                  size="small"
                  :type="name === 'refund_order' ? 'danger' : 'success'"
                  effect="plain"
                >
                  {{ name }} × {{ count }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ singleResult.model }} · {{ singleResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <el-alert
              v-for="(issue, index) in singleResult.issues"
              :key="index"
              class="mt"
              type="warning"
              :closable="false"
              :title="issue"
            />
            <p class="hint">{{ singleResult.note }}</p>
          </div>

          <div class="card-block">
            <h4>执行轨迹</h4>
            <el-table :data="singleResult.steps" size="small">
              <el-table-column prop="index" label="步" width="50" />
              <el-table-column label="类型" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.kind === 'tool' ? 'success' : 'info'" effect="plain">
                    {{ row.kind === 'tool' ? '观察' : '决策' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="内容" min-width="420">
                <template #default="{ row }">
                  <span v-if="row.kind === 'tool'" class="mono">{{ row.tool }} → {{ row.content }}</span>
                  <span v-else class="line">
                    <span v-if="row.tool_calls?.length" class="mono">
                      调用 → {{ formatCalls(row.tool_calls) }}
                    </span>
                    <span v-else>{{ row.content }}</span>
                  </span>
                </template>
              </el-table-column>
            </el-table>
            <pre class="code-block mt">{{ singleResult.final_answer }}</pre>
          </div>
        </template>
      </el-tab-pane>

      <!-- ② 最小 Supervisor -->
      <el-tab-pane label="② 最小 Supervisor" name="team">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.team || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="teamQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="teamQuestion" type="textarea" :rows="2" placeholder="主管会先派 researcher 查事实，再派 writer 写答复" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="teamLoading"
              :disabled="!teamQuestion.trim()"
              @click="doTeam"
            >
              跑主管模式
            </el-button>
            <el-switch v-model="dedupeGuard" size="small" active-text="练习 1 去重守卫" />
            <span class="muted">主管每轮只看 findings 派一个人；连续两次派给同一人且任务相似就判乒乓</span>
          </div>
          <div class="form-grid mt">
            <div class="field">
              <span class="muted">交接预算 MAX_HANDOFF</span>
              <el-input-number v-model="teamBudget" size="small" :min="1" :max="20" />
            </div>
            <div class="field">
              <span class="muted">recursion_limit（超步数保险丝）</span>
              <el-input-number v-model="teamRecursion" size="small" :min="6" :max="80" />
            </div>
          </div>
        </div>

        <template v-if="teamResult">
          <div class="card-block">
            <div class="block-head">
              <h4>派单时间线</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">交接 {{ teamResult.steps }} 次</el-tag>
                <el-tag size="small" effect="plain">LLM {{ teamResult.llm_calls }} 次</el-tag>
                <el-tag v-if="teamResult.dedupe_skips" size="small" type="warning" effect="plain">
                  去重跳过 {{ teamResult.dedupe_skips }}
                </el-tag>
                <el-tag v-if="teamResult.budget_hit" size="small" type="danger" effect="plain">预算耗尽</el-tag>
                <el-tag size="small" effect="plain">{{ teamResult.model }} · {{ teamResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <div class="timeline">
              <div v-for="(event, index) in teamResult.events" :key="index" class="timeline-row">
                <el-tag size="small" :type="eventType(event.kind)" effect="plain">{{ event.node }}</el-tag>
                <span class="line">{{ event.detail }}</span>
                <el-tag v-if="event.method" size="small" type="info" effect="plain">{{ event.method }}</el-tag>
              </div>
            </div>
          </div>

          <div class="card-block">
            <h4>最终答复</h4>
            <pre class="code-block">{{ teamResult.final_answer }}</pre>
            <p class="hint">{{ teamResult.note }}</p>
          </div>

          <div class="card-block">
            <h4>账本层 findings（主管每轮都会读它，避免重复派活）</h4>
            <ul class="rule-list">
              <li v-for="(item, index) in teamResult.findings" :key="index">{{ item }}</li>
            </ul>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>共享层 messages（专家的 AIMessage 都带 name）</h4>
              <el-tag size="small" effect="plain">{{ teamResult.messages.length }} 条</el-tag>
            </div>
            <el-table :data="teamResult.messages" size="small" max-height="320">
              <el-table-column label="type" width="90">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="name" width="130">
                <template #default="{ row }">
                  <span class="mono">{{ row.name || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="content" min-width="420">
                <template #default="{ row }">
                  <span class="line">{{ row.content }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <Day10Graph title="主管 + 专家：Command 派单、Command 回跳" :structure="teamResult.graph" />
        </template>
      </el-tab-pane>

      <!-- ③ 完整版：审批 + 预算 + 存档 -->
      <el-tab-pane label="③ 完整版（审批+预算+存档）" name="full">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.full || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="fullQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="fullQuestion" type="textarea" :rows="2" placeholder="含「退款」就会在 coder 前弹审批" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="fullLoading"
              :disabled="!fullQuestion.trim()"
              @click="doStartFull"
            >
              发起（会停在审批）
            </el-button>
            <span class="muted">MemorySaver + thread_id：进程可以死，审批可以隔一天再批</span>
          </div>
        </div>

        <template v-if="fullStart">
          <div class="card-block">
            <div class="block-head">
              <h4>暂停现场</h4>
              <div class="meta-row">
                <el-tag size="small" :type="fullStart.paused ? 'warning' : 'success'" effect="plain">
                  {{ fullStart.paused ? '已暂停（等人工审批）' : '未暂停' }}
                </el-tag>
                <el-tag size="small" effect="plain">next = {{ formatNext(fullStart.next) }}</el-tag>
                <el-tag size="small" effect="plain">{{ fullStart.thread_id }}</el-tag>
                <el-tag size="small" effect="plain">{{ fullStart.model }} · {{ fullStart.elapsed_ms }}ms</el-tag>
              </div>
            </div>

            <template v-if="fullStart.paused">
              <el-alert type="warning" :closable="false" :title="fullStart.interrupt?.prompt || '等待人工决定'" />
              <pre class="code-block mt">{{ JSON.stringify(fullStart.interrupt, null, 2) }}</pre>
              <div class="decision-row mt">
                <el-radio-group v-model="fullDecision" size="small">
                  <el-radio-button value="approve">放行</el-radio-button>
                  <el-radio-button value="reject">驳回</el-radio-button>
                  <el-radio-button value="patch">改金额放行</el-radio-button>
                </el-radio-group>
                <span v-if="fullDecision === 'patch'" class="patch-row">
                  <span class="muted">退款金额</span>
                  <el-input-number v-model="fullAmount" size="small" :min="1" :max="99999" />
                </span>
                <el-button type="primary" size="small" :loading="fullResumeLoading" @click="doResumeFull">
                  恢复 Command(resume=...)
                </el-button>
              </div>
              <p class="hint">审批节点会被重放，但里面只有 interrupt——所以不会扣两次款（Day 11 的坑 1）。</p>
            </template>
            <p v-else class="line">{{ fullStart.answer || '这次没有命中写操作，图直接跑完了' }}</p>

            <div class="mt">
              <h4>已发生的交接</h4>
              <el-table :data="fullStart.handoffs" size="small" empty-text="还没派单">
                <el-table-column prop="role" label="专家" width="130" />
                <el-table-column prop="task" label="派单内容" min-width="300" show-overflow-tooltip />
                <el-table-column prop="reason" label="理由" min-width="220" show-overflow-tooltip />
              </el-table>
            </div>
          </div>

          <Day10Graph title="完整版图：coder 带审批闸门，writer 是终点" :structure="fullStart.graph" />
        </template>

        <template v-if="fullResume">
          <div class="card-block">
            <div class="block-head">
              <h4>恢复结果</h4>
              <div class="meta-row">
                <el-tag size="small" :type="fullResume.approved ? 'success' : 'danger'" effect="plain">
                  {{ fullResume.approved ? '已放行' : '已驳回' }}
                </el-tag>
                <el-tag size="small" effect="plain">交接 {{ fullResume.steps }} 次</el-tag>
                <el-tag v-if="fullResume.budget_hit" size="small" type="danger" effect="plain">预算耗尽</el-tag>
                <el-tag size="small" effect="plain">next = {{ formatNext(fullResume.next) }}</el-tag>
                <el-tag size="small" effect="plain">{{ fullResume.model }} · {{ fullResume.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <pre class="code-block">{{ fullResume.final_answer }}</pre>
            <el-table class="mt" :data="fullResume.refunds" size="small" empty-text="没有真实退款流水（被驳回或未命中写操作）">
              <el-table-column prop="order_id" label="订单" width="110" />
              <el-table-column prop="amount" label="金额" width="100" />
              <el-table-column prop="note" label="审批备注" min-width="240" />
            </el-table>
            <p class="hint">{{ fullResume.note }}</p>
          </div>

          <div class="card-block">
            <h4>结论账本</h4>
            <ul class="rule-list">
              <li v-for="(item, index) in fullResume.findings" :key="index">{{ item }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ 并行专家 -->
      <el-tab-pane label="④ 并行专家（Send）" name="parallel">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.parallel || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="parallelQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="parallelQuestion" type="textarea" :rows="2" placeholder="政策与订单互不依赖，可以同时查" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="parallelLoading"
              :disabled="!parallelQuestion.trim()"
              @click="doParallel"
            >
              并行扇出
            </el-button>
            <span class="muted">两条分支各拿一份 state 副本，findings 由 operator.add 在 join 处合并</span>
          </div>
        </div>

        <template v-if="parallelResult">
          <div class="card-block">
            <div class="block-head">
              <h4>两条分支</h4>
              <div class="meta-row">
                <el-tag size="small" :type="parallelResult.writer_calls === 1 ? 'success' : 'danger'" effect="plain">
                  writer 调用 {{ parallelResult.writer_calls }} 次
                </el-tag>
                <el-tag size="small" effect="plain">LLM {{ parallelResult.llm_calls }} 次</el-tag>
                <el-tag size="small" effect="plain">{{ parallelResult.model }} · {{ parallelResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <el-table :data="parallelResult.branches" size="small">
              <el-table-column prop="node" label="分支" width="190" />
              <el-table-column prop="detail" label="结论" min-width="380" show-overflow-tooltip />
              <el-table-column label="耗时" width="90">
                <template #default="{ row }">{{ row.elapsed_ms ?? '—' }}ms</template>
              </el-table-column>
            </el-table>
            <p class="hint">
              两支并行：总耗时取最大而不是求和；但 token 直接翻倍——只有「确实独立 + 都耗时」才值得。
            </p>
          </div>

          <div class="card-block">
            <h4>合并后的 findings</h4>
            <ul class="rule-list">
              <li v-for="(item, index) in parallelResult.findings" :key="index">{{ item }}</li>
            </ul>
            <pre class="code-block mt">{{ parallelResult.final_answer }}</pre>
          </div>

          <Day10Graph title="Send 扇出 → join → writer" :structure="parallelResult.graph" />
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 12 实验台：多智能体 Supervisor——单 Agent 复现 / 最小主管 / 完整版审批与预算 / Send 并行
import { computed, onMounted, ref } from 'vue'
import {
  getDay12Mapping,
  listChatModels,
  resumeDay12Full,
  runDay12Parallel,
  runDay12Single,
  runDay12Team,
  startDay12Full
} from '@/api/study'
import Day10Graph from './Day10Graph.vue'

const mapping = ref(null)
const models = ref([])
const modelId = ref(null)
const subTab = ref('single')

// ① 单 Agent 复现
const singleQuestion = ref('订单 A1001 签收几天了？按政策能不能退？帮我退掉，并给客户写一段说明。')
const singleLoading = ref(false)
const singleResult = ref(null)

// ② 最小 Supervisor
const teamQuestion = ref('订单 A1001 签收几天了？按政策能不能退？给客户写一段说明。')
const teamLoading = ref(false)
const teamResult = ref(null)
const dedupeGuard = ref(true)
const teamBudget = ref(6)
const teamRecursion = ref(24)

// ③ 完整版
const fullQuestion = ref('订单 A1001 签收3天，能不能退？退 299，顺便算 299*0.85')
const fullLoading = ref(false)
const fullStart = ref(null)
const fullResume = ref(null)
const fullResumeLoading = ref(false)
const fullDecision = ref('approve')
const fullAmount = ref(254)

// ④ 并行
const parallelQuestion = ref('订单 A1001 签收几天了？按政策能不能退？给客户写一段说明。')
const parallelLoading = ref(false)
const parallelResult = ref(null)

const pitfalls = computed(() => mapping.value?.pitfalls || [])

// tool_calls 一行展示：名字(参数)
const formatCalls = (calls) =>
  (calls || []).map((call) => `${call.name}(${JSON.stringify(call.args)})`).join('、')

// next 为空 = 图已跑完；非空 = 卡在这些节点
const formatNext = (next) => (next && next.length ? next.join(' → ') : '（已跑完）')

// 事件类型 → Element Plus tag 颜色
const eventType = (kind) =>
  ({ dispatch: 'primary', expert: 'success', dedupe: 'warning', budget: 'danger', finish: 'info' })[kind] || 'info'

// ① 单 Agent：wide 给全工具，narrow 去掉退款
const doSingle = async (toolset) => {
  singleLoading.value = true
  try {
    singleResult.value = await runDay12Single({
      question: singleQuestion.value.trim(),
      toolset,
      model_config_id: modelId.value || undefined
    })
  } finally {
    singleLoading.value = false
  }
}

// ② 最小主管模式
const doTeam = async () => {
  teamLoading.value = true
  try {
    teamResult.value = await runDay12Team({
      question: teamQuestion.value.trim(),
      max_handoff: teamBudget.value,
      recursion_limit: teamRecursion.value,
      dedupe_guard: dedupeGuard.value,
      model_config_id: modelId.value || undefined
    })
  } finally {
    teamLoading.value = false
  }
}

// ③ 发起完整版：命中退款会冻结在 coder 前
const doStartFull = async () => {
  fullLoading.value = true
  fullResume.value = null
  try {
    fullStart.value = await startDay12Full({
      question: fullQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    fullLoading.value = false
  }
}

// ③ 恢复审批：true / false / 改金额
const doResumeFull = async () => {
  if (!fullStart.value?.thread_id) return
  const decision =
    fullDecision.value === 'approve'
      ? true
      : fullDecision.value === 'reject'
        ? false
        : { approved: true, amount: fullAmount.value }
  fullResumeLoading.value = true
  try {
    fullResume.value = await resumeDay12Full({
      thread_id: fullStart.value.thread_id,
      decision,
      model_config_id: modelId.value || undefined
    })
    fullStart.value = null // 暂停现场已被消费
  } finally {
    fullResumeLoading.value = false
  }
}

// ④ 并行扇出
const doParallel = async () => {
  parallelLoading.value = true
  try {
    parallelResult.value = await runDay12Parallel({
      question: parallelQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    parallelLoading.value = false
  }
}

onMounted(async () => {
  try {
    mapping.value = await getDay12Mapping()
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
.day12 {
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

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 10px;
    align-items: end;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .decision-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .patch-row {
    display: flex;
    align-items: center;
    gap: 6px;
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
    align-items: center;
    gap: 6px;
  }

  .line {
    font-size: 12px;
    line-height: 1.7;
    color: $text-regular;
    word-break: break-all;
  }

  .timeline {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .timeline-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    padding: 6px 8px;
    border-radius: $radius-sm;
    background: #f9fafd;
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
