<template>
  <div class="day09">
    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="框架不是另一套东西，是给手写管线换工业零件：每学一个 API，先找它对应手写的哪一段"
    />

    <!-- 顶部：零件对照表 + 模型选择 -->
    <div class="card-block">
      <div class="block-head">
        <h4>手写零件 ↔ LangChain 零件（课程 2.5 对照表）</h4>
        <el-tag size="small" effect="plain">
          langchain-core {{ mapping?.langchain_version || '…' }}
        </el-tag>
      </div>
      <el-table :data="mapping?.part_mapping || []" size="small" empty-text="加载中…">
        <el-table-column prop="handwritten" label="你手写的（Day 01~08）" min-width="230" />
        <el-table-column prop="framework" label="LangChain 对应" min-width="230" />
        <el-table-column label="谁更省事" width="110">
          <template #default="{ row }">
            <el-tag size="small" :type="winnerType(row.winner)" effect="plain">
              {{ winnerLabel(row.winner) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <p class="hint">
        框架帮你的是<b>零件标准化</b>，不替你做的是<b>决策</b>——终止条件（Day 05）与上下文预算
        （Day 08）框架只提供挂载点，策略仍然要你定。
      </p>
    </div>

    <div class="model-bar">
      <span class="label">模型</span>
      <el-select v-model="modelId" placeholder="默认模型" size="small" clearable style="width: 200px">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="muted">③④⑤ 三个实验会真实调用模型；①② 是纯本地演示</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 消息抽象 -->
      <el-tab-pane label="① 消息抽象" name="messages">
        <div class="card-block">
          <div class="block-head">
            <h4>裸 dict → 类型对象（SystemMessage / HumanMessage / AIMessage / ToolMessage）</h4>
            <el-button type="primary" size="small" :loading="msgLoading" @click="doMessages">
              运行演示
            </el-button>
          </div>
          <p class="hint">不调模型：只演示对象构造、类型映射与双向转换。</p>
        </div>

        <template v-if="msgResult">
          <div class="card-block">
            <h4>四类消息</h4>
            <el-table :data="msgResult.messages" size="small">
              <el-table-column prop="type" label="type" width="90" />
              <el-table-column prop="openai_role" label="OpenAI role" width="120" />
              <el-table-column prop="content" label="content" min-width="220" show-overflow-tooltip />
              <el-table-column prop="note" label="对应手写代码" min-width="240" show-overflow-tooltip />
            </el-table>
          </div>

          <div class="two-col">
            <div class="card-block">
              <h4>裸 dict 的反例</h4>
              <pre class="code-block">{{ JSON.stringify(msgResult.raw_typo.payload) }}</pre>
              <p class="hint">{{ msgResult.raw_typo.note }}</p>
            </div>
            <div class="card-block">
              <h4>类型对象的正例</h4>
              <pre class="code-block">{{ msgResult.typed_error }}</pre>
              <p class="hint">构造就失败，不用等到调用模型才发现。</p>
              <p class="hint">{{ msgResult.extra_ignored }}</p>
            </div>
          </div>

          <div class="card-block">
            <h4>转回 OpenAI 格式（与 Day 01 手写结构完全同构）</h4>
            <pre class="code-block">{{ JSON.stringify(msgResult.openai_payload, null, 2) }}</pre>
            <p class="hint">{{ msgResult.roundtrip_note }}</p>
          </div>

          <div class="card-block">
            <h4>裸 dict vs 类型对象</h4>
            <el-table :data="msgResult.dict_vs_typed" size="small">
              <el-table-column prop="point" label="对比点" width="120" />
              <el-table-column prop="raw" label="裸 dict" min-width="230" />
              <el-table-column prop="typed" label="类型对象" min-width="230" />
            </el-table>
          </div>
        </template>
      </el-tab-pane>

      <!-- ② Prompt 模板 -->
      <el-tab-pane label="② Prompt 模板" name="prompt">
        <div class="card-block">
          <div class="form-grid">
            <el-input v-model="promptForm.company" size="small" placeholder="company（partial 冻结）" />
            <el-input v-model="promptForm.question" size="small" placeholder="question（当前问题）" />
          </div>
          <el-input
            v-model="promptHistoryJson"
            type="textarea"
            :rows="6"
            class="mt"
            placeholder="history（占位到 placeholder，JSON 数组）"
          />
          <div class="row-actions mt">
            <el-button type="primary" size="small" :loading="promptLoading" @click="doPrompt">
              填充模板
            </el-button>
            <el-checkbox v-model="promptForm.omit">故意漏填 question（观察 fail-fast）</el-checkbox>
          </div>
        </div>

        <template v-if="promptResult">
          <div class="card-block">
            <div class="meta-row">
              <el-tag v-for="item in promptResult.input_variables" :key="item" size="small" effect="plain">
                必填 {{ item }}
              </el-tag>
              <el-tag
                v-for="item in promptResult.optional_variables"
                :key="item"
                size="small"
                type="info"
                effect="plain"
              >
                可选 {{ item }}（placeholder 缺失即跳过）
              </el-tag>
              <el-tag
                v-for="item in promptResult.partial_frozen"
                :key="item"
                size="small"
                type="success"
                effect="plain"
              >
                已冻结 {{ item }}
              </el-tag>
            </div>
            <el-alert
              v-if="promptResult.error"
              class="mt"
              type="error"
              :closable="false"
              :title="promptResult.error"
            />
            <p class="hint">{{ promptResult.error_hint }}</p>
          </div>

          <div class="card-block">
            <h4>填充后的消息（{{ promptResult.messages.length }} 条）</h4>
            <div v-for="(message, index) in promptResult.messages" :key="index" class="msg-row">
              <el-tag size="small" effect="plain">{{ message.type }}</el-tag>
              <span class="msg-source">{{ message.source }}</span>
              <pre class="code-block">{{ message.content }}</pre>
            </div>
          </div>
        </template>
      </el-tab-pane>

      <!-- ③ 结构化输出 -->
      <el-tab-pane label="③ 结构化输出" name="structured">
        <div class="card-block">
          <div class="preset-row">
            <el-tag v-for="item in structuredPresets" :key="item" class="preset" effect="plain" @click="structuredText = item">
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="structuredText" type="textarea" :rows="3" placeholder="待抽取的客户原话" />
          <div class="form-grid mt">
            <el-select v-model="structuredRepeat" size="small">
              <el-option :value="1" label="跑 1 次" />
              <el-option :value="2" label="跑 2 次（对比抖动）" />
              <el-option :value="3" label="跑 3 次（对比抖动）" />
            </el-select>
            <div class="temp-row">
              <span class="muted">temperature = {{ structuredTemp }}</span>
              <el-slider v-model="structuredTemp" :min="0" :max="1.5" :step="0.5" size="small" />
            </div>
          </div>
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="structuredLoading"
              :disabled="!structuredText.trim()"
              @click="doStructured"
            >
              抽取三字段
            </el-button>
            <el-tag size="small" effect="plain">reply / sentiment / needs_escalation</el-tag>
          </div>
        </div>

        <template v-if="structuredResult">
          <div class="card-block">
            <div class="block-head">
              <h4>抽取结果</h4>
              <div class="meta-row">
                <el-tag
                  size="small"
                  :type="structuredResult.method_used === 'default' ? 'success' : 'warning'"
                  effect="plain"
                >
                  下发方式：{{ structuredResult.method_used }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ structuredResult.model }} · {{ structuredResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <el-table :data="structuredResult.attempts" size="small">
              <el-table-column prop="index" label="#" width="50" />
              <el-table-column prop="reply" label="reply" min-width="220" show-overflow-tooltip />
              <el-table-column prop="sentiment" label="sentiment" width="110" />
              <el-table-column label="needs_escalation" width="140">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.needs_escalation ? 'danger' : 'info'" effect="plain">
                    {{ row.needs_escalation }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="elapsed_ms" label="ms" width="70" />
              <el-table-column prop="error" label="错误" min-width="160" show-overflow-tooltip />
            </el-table>
            <el-alert
              v-if="structuredResult.unstable_fields.length"
              class="mt"
              type="warning"
              :closable="false"
              :title="`字段抖动：${structuredResult.unstable_fields.join('、')}`"
            />
            <p class="hint">{{ structuredResult.note }}</p>
            <el-collapse v-if="structuredResult.methods_tried.length" class="mt">
              <el-collapse-item
                :title="`降级轨迹（${structuredResult.methods_tried.length} 次失败现场）`"
                name="degrade"
              >
                <p v-for="(item, index) in structuredResult.methods_tried" :key="index" class="warn-line">
                  {{ item }}
                </p>
              </el-collapse-item>
            </el-collapse>
          </div>

          <div class="card-block">
            <h4>下发给模型的 JSON Schema（Field(description=) 就是说明书）</h4>
            <pre class="code-block">{{ JSON.stringify(structuredResult.schema_sent, null, 2) }}</pre>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ LCEL 管道 -->
      <el-tab-pane label="④ LCEL 管道" name="lcel">
        <div class="card-block">
          <el-radio-group v-model="lcelMode" size="small">
            <el-radio-button value="invoke">invoke 单次</el-radio-button>
            <el-radio-button value="stream">stream 流式</el-radio-button>
            <el-radio-button value="batch">batch 并发</el-radio-button>
            <el-radio-button value="retry">with_retry</el-radio-button>
            <el-radio-button value="lambda">RunnableLambda</el-radio-button>
          </el-radio-group>
          <el-input
            v-model="lcelQuestion"
            size="small"
            class="mt"
            placeholder="用一句话回答的问题"
            :disabled="lcelMode === 'retry'"
          />
          <template v-if="lcelMode === 'batch'">
            <el-input
              v-model="lcelBatchText"
              type="textarea"
              :rows="4"
              class="mt"
              placeholder="每行一个批量问题"
            />
            <el-checkbox v-model="lcelCompare" class="mt">同时串行跑一遍，对比耗时</el-checkbox>
          </template>
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="lcelLoading"
              :disabled="!lcelQuestion.trim()"
              @click="doLcel"
            >
              运行管道
            </el-button>
            <span class="muted">retry 模式纯本地演示，不花 token</span>
          </div>
        </div>

        <template v-if="lcelResult">
          <div class="card-block">
            <h4>管道组成（竖线从左到右）</h4>
            <div class="chain">
              <template v-for="(step, index) in lcelResult.chain" :key="step.index">
                <div class="chain-node">
                  <strong>{{ step.name }}</strong>
                  <span class="muted">{{ step.role }}</span>
                </div>
                <span v-if="index < lcelResult.chain.length - 1" class="chain-arrow">|</span>
              </template>
            </div>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>输出</h4>
              <el-tag size="small" effect="plain">{{ lcelResult.mode }} · {{ lcelResult.elapsed_ms }}ms</el-tag>
            </div>
            <pre class="code-block">{{ lcelResult.answer || '（本模式没有回答文本）' }}</pre>
            <p class="hint">{{ lcelResult.note }}</p>
            <div v-if="lcelResult.mode === 'stream'" class="meta-row">
              <el-tag size="small" effect="plain">分片 {{ lcelResult.chunk_count }} 段</el-tag>
              <el-tag v-for="(chunk, index) in lcelResult.chunks" :key="index" size="small" type="info" effect="plain">
                {{ chunk }}
              </el-tag>
            </div>
          </div>

          <div v-if="lcelResult.mode === 'batch'" class="card-block">
            <div class="block-head">
              <h4>并发批量</h4>
              <div class="meta-row">
                <el-tag size="small" type="success" effect="plain">batch {{ lcelResult.batch_ms }}ms</el-tag>
                <el-tag v-if="lcelResult.serial_ms" size="small" type="info" effect="plain">
                  串行 {{ lcelResult.serial_ms }}ms
                </el-tag>
              </div>
            </div>
            <el-table :data="lcelResult.batch" size="small">
              <el-table-column prop="question" label="问题" width="220" />
              <el-table-column prop="answer" label="回答" show-overflow-tooltip />
            </el-table>
          </div>

          <div v-if="lcelResult.mode === 'retry'" class="card-block">
            <h4>重试轨迹（前两次模拟 502）</h4>
            <div v-for="item in lcelResult.retry_trace" :key="item.attempt" class="retry-row">
              <el-tag size="small" :type="item.ok ? 'success' : 'danger'" effect="plain">
                第 {{ item.attempt }} 次
              </el-tag>
              <span class="muted">{{ item.ok ? '成功' : '失败（RuntimeError: 502）' }}</span>
            </div>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ 框架版循环 -->
      <el-tab-pane label="⑤ 框架版 Agent 循环" name="agent">
        <div class="card-block">
          <div class="preset-row">
            <el-tag v-for="item in mapping?.agent_presets || []" :key="item" class="preset" effect="plain" @click="agentQuestion = item">
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="agentQuestion" type="textarea" :rows="2" placeholder="问题" />
          <div class="form-grid mt">
            <el-radio-group v-model="agentVariant" size="small">
              <el-radio-button value="full">description 写全</el-radio-button>
              <el-radio-button value="vague">只剩「查询。」</el-radio-button>
              <el-radio-button value="missing">无 docstring</el-radio-button>
            </el-radio-group>
            <el-input-number v-model="agentMaxSteps" size="small" :min="1" :max="15" />
          </div>
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="agentLoading"
              :disabled="!agentQuestion.trim()"
              @click="doAgent"
            >
              跑框架版循环
            </el-button>
            <span class="muted">MAX_STEPS 是保险丝：框架不自带终止条件</span>
          </div>
        </div>

        <template v-if="agentResult">
          <div class="card-block">
            <div class="block-head">
              <h4>最终回答</h4>
              <div class="meta-row">
                <el-tag size="small" :type="agentResult.stop_reason === 'completed' ? 'success' : 'danger'" effect="plain">
                  {{ agentResult.stop_reason }}
                </el-tag>
                <el-tag size="small" effect="plain">messages {{ agentResult.messages_count }}</el-tag>
                <el-tag size="small" effect="plain">{{ agentResult.model }} · {{ agentResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <pre class="code-block">{{ agentResult.final_answer || '（没有产出回答）' }}</pre>
            <el-alert
              v-if="agentResult.variant_note"
              class="mt"
              :type="agentResult.stop_reason === 'tool_schema_error' ? 'error' : 'info'"
              :closable="false"
              :title="agentResult.variant_note"
            />
          </div>

          <div class="card-block">
            <h4>执行轨迹（@tool → bind_tools → ToolMessage 回填）</h4>
            <el-timeline v-if="agentResult.steps.length">
              <el-timeline-item v-for="(step, index) in agentResult.steps" :key="index" :timestamp="`第 ${step.step} 步`">
                <div v-if="step.tool_calls.length">
                  <div v-for="call in step.tool_calls" :key="call.id" class="tool-call">
                    <el-tag size="small">{{ call.name }}</el-tag>
                    <span class="muted">{{ JSON.stringify(call.args) }}</span>
                    <el-tag v-if="call.is_error" size="small" type="danger">error</el-tag>
                    <p class="tool-result">{{ call.result }}</p>
                  </div>
                </div>
                <span v-else class="muted">直接回答：{{ step.content }}</span>
              </el-timeline-item>
            </el-timeline>
            <p v-else class="muted">没有执行轨迹（工具定义阶段就报错了，见上方提示）</p>
          </div>

          <div class="card-block">
            <h4>bind_tools 真实下发的 schema（description 的权重看这里）</h4>
            <pre class="code-block">{{ JSON.stringify(agentResult.tool_schemas, null, 2) }}</pre>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 09 实验台：LangChain 零件——消息抽象 / Prompt 模板 / 结构化输出 / LCEL / 框架版循环
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDay09Mapping,
  listChatModels,
  runDay09Agent,
  runDay09Lcel,
  runDay09Messages,
  runDay09Prompt,
  runDay09Structured
} from '@/api/study'

const structuredPresets = [
  '你们客服态度太差了，我要投诉！订单 SO20261101001 到现在还没发货',
  'XR-500 Pro 保修多久？退款要运费吗？',
  '谢谢，问题解决了，速度很快'
]

const mapping = ref(null)
const models = ref([])
const modelId = ref(null)
const subTab = ref('messages')

// ① 消息抽象
const msgLoading = ref(false)
const msgResult = ref(null)

// ② Prompt 模板
const promptForm = reactive({ company: '极星科技', question: 'XR-500 Pro 退款要运费吗？', omit: false })
const promptHistoryJson = ref(
  JSON.stringify(
    [
      { role: 'user', content: 'XR-500 Pro 保修多久？' },
      { role: 'assistant', content: '整机保修两年 [来源: 产品手册]' }
    ],
    null,
    2
  )
)
const promptLoading = ref(false)
const promptResult = ref(null)

// ③ 结构化输出
const structuredText = ref(structuredPresets[0])
const structuredRepeat = ref(1)
const structuredTemp = ref(0)
const structuredLoading = ref(false)
const structuredResult = ref(null)

// ④ LCEL
const lcelMode = ref('invoke')
const lcelQuestion = ref('什么是 Function Calling？')
const lcelBatchText = ref('什么是短期记忆？\n什么是长期记忆？\n什么是上下文工程？')
const lcelCompare = ref(true)
const lcelLoading = ref(false)
const lcelResult = ref(null)

// ⑤ 框架版循环
const agentQuestion = ref('订单 SO20261101001 发货了吗？')
const agentVariant = ref('full')
const agentMaxSteps = ref(6)
const agentLoading = ref(false)
const agentResult = ref(null)

// 对照表里"谁更省事"的配色
const winnerType = (winner) => (winner === 'framework' ? 'success' : winner === 'you' ? 'warning' : 'info')
const winnerLabel = (winner) =>
  ({ framework: '框架', you: '你', half: '各一半' })[winner] || winner

// ① 消息抽象演示（不调模型）
const doMessages = async () => {
  msgLoading.value = true
  try {
    msgResult.value = await runDay09Messages()
  } finally {
    msgLoading.value = false
  }
}

// ② 模板填充：history 走 JSON 文本域，解析失败直接提示
const doPrompt = async () => {
  let history = []
  try {
    history = promptHistoryJson.value.trim() ? JSON.parse(promptHistoryJson.value) : []
  } catch (error) {
    ElMessage.warning(`history 不是合法 JSON：${error.message}`)
    return
  }
  promptLoading.value = true
  try {
    promptResult.value = await runDay09Prompt({
      company: promptForm.company.trim() || '极星科技',
      question: promptForm.question.trim() || 'XR-500 Pro 退款要运费吗？',
      history,
      omit_variable: promptForm.omit
    })
  } finally {
    promptLoading.value = false
  }
}

// ③ 结构化抽取：repeat>1 时对比同输入多次运行的字段稳定性
const doStructured = async () => {
  structuredLoading.value = true
  try {
    structuredResult.value = await runDay09Structured({
      text: structuredText.value.trim(),
      repeat: structuredRepeat.value,
      temperature: structuredTemp.value,
      model_config_id: modelId.value || undefined
    })
  } finally {
    structuredLoading.value = false
  }
}

// ④ LCEL：按模式组织请求（batch 用每行一条的问题列表）
const doLcel = async () => {
  lcelLoading.value = true
  try {
    lcelResult.value = await runDay09Lcel({
      question: lcelQuestion.value.trim() || '什么是 Function Calling？',
      mode: lcelMode.value,
      batch_questions:
        lcelMode.value === 'batch'
          ? lcelBatchText.value
              .split('\n')
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      compare_serial: lcelMode.value === 'batch' ? lcelCompare.value : false,
      model_config_id: modelId.value || undefined
    })
  } finally {
    lcelLoading.value = false
  }
}

// ⑤ 框架版循环：variant 切换工具 description，观察模型是否选错工具
const doAgent = async () => {
  agentLoading.value = true
  try {
    agentResult.value = await runDay09Agent({
      question: agentQuestion.value.trim(),
      variant: agentVariant.value,
      max_steps: agentMaxSteps.value,
      model_config_id: modelId.value || undefined
    })
  } finally {
    agentLoading.value = false
  }
}

onMounted(async () => {
  try {
    mapping.value = await getDay09Mapping()
  } catch {
    // 对照表加载失败不阻塞实验区
  }
  try {
    models.value = await listChatModels()
  } catch {
    // 模型列表失败时后端会给出明确错误
  }
})
</script>

<style lang="scss" scoped>
.day09 {
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

  .two-col {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: $gap-md;
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
  }

  .mb {
    margin-bottom: 8px;
  }

  .mt {
    margin-top: 8px;
  }

  .warn-line {
    margin: 4px 0;
    font-size: 12px;
    line-height: 1.7;
    color: #a05a00;
    word-break: break-all;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 8px;
    align-items: center;
  }

  .temp-row {
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

  .msg-row {
    padding: 8px 0;
    border-bottom: 1px dashed #eef0f6;

    &:last-child {
      border-bottom: none;
    }

    .msg-source {
      margin-left: 8px;
      font-size: 11px;
      color: $agent-text-muted;
    }

    .code-block {
      margin-top: 6px;
    }
  }

  .chain {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;

    .chain-node {
      display: flex;
      flex-direction: column;
      padding: 6px 10px;
      border: 1px solid #e8e9f0;
      border-radius: $radius-sm;
      background: #fafbfe;

      strong {
        font-size: 12px;
        color: $text-primary;
      }

      .muted {
        font-size: 11px;
      }
    }

    .chain-arrow {
      font-size: 16px;
      font-weight: 600;
      color: $agent-accent;
    }
  }

  .retry-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 0;
  }

  .tool-call {
    margin-bottom: 8px;

    .tool-result {
      margin: 4px 0 0;
      font-size: 11px;
      line-height: 1.7;
      color: $agent-text-muted;
      word-break: break-all;
    }
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
