<template>
  <div class="day08">
    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="上下文工程 = 在有限预算内决定放什么、放多少、放哪里、按什么顺序：头尾放关键，中部放背景"
    />

    <div class="two-col">
      <!-- 左列：原料（Day 02~07 的全部产物都从这里进来） -->
      <div>
        <div class="card-block">
          <h4>当前问题（永远在上下文最末尾）</h4>
          <div class="preset-row">
            <el-tag
              v-for="item in presets"
              :key="item"
              class="preset"
              effect="plain"
              @click="question = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input
            v-model="question"
            type="textarea"
            :rows="2"
            placeholder="问一句需要画像 / 资料 / 工具协作的问题"
          />
        </div>

        <div class="card-block">
          <h4>真实数据来源（不填就用右侧的演示原料）</h4>
          <div class="form-grid">
            <el-input v-model="userId" size="small" placeholder="用户 ID（读了就用真实画像）" />
            <el-input v-model="ragQuery" size="small" placeholder="检索 query（填了就真实混合检索）" />
            <el-input-number v-model="topK" size="small" :min="1" :max="10" />
            <el-input-number
              v-model="totalBudget"
              size="small"
              :min="1000"
              :max="128000"
              :step="1000"
            />
          </div>
          <div class="switch-row">
            <el-switch v-model="withTools" size="small" active-text="注入工具说明书" />
            <el-switch v-model="debug" size="small" active-text="产出 dump" />
          </div>
        </div>

        <div class="card-block">
          <h4>其他原料</h4>
          <el-input
            v-model="toolData"
            type="textarea"
            :rows="2"
            placeholder="工具实时数据（已 digest）"
            class="mb"
          />
          <el-input
            v-model="shortMemory"
            type="textarea"
            :rows="2"
            placeholder="短期记忆摘要（留空用示例）"
            class="mb"
          />
          <el-collapse>
            <el-collapse-item title="手填检索块（JSON，含 1 个重复块）" name="blocks">
              <el-input v-model="blocksJson" type="textarea" :rows="12" />
            </el-collapse-item>
            <el-collapse-item title="对话历史（JSON，可塞孤儿 tool 消息）" name="history">
              <el-input v-model="historyJson" type="textarea" :rows="10" />
            </el-collapse-item>
            <el-collapse-item title="系统提示词 / 硬约束" name="prompt">
              <el-input
                v-model="systemPrompt"
                type="textarea"
                :rows="7"
                placeholder="留空用课程默认客服规则"
                class="mb"
              />
              <el-input
                v-model="constraintsText"
                type="textarea"
                :rows="3"
                placeholder="每行一条硬约束（留空用默认两条）"
              />
            </el-collapse-item>
          </el-collapse>
        </div>

        <div class="row-actions">
          <el-button
            type="primary"
            :loading="building"
            :disabled="!question.trim()"
            @click="build"
          >
            编排上下文
          </el-button>
          <el-button @click="restoreDemo">恢复演示原料</el-button>
        </div>
      </div>

      <!-- 右列：四层账单 + 块轨迹 + 自检 + dump -->
      <div>
        <el-empty
          v-if="!result"
          description="点「编排上下文」查看分层账单与七问自检"
          :image-size="70"
        />
        <template v-else>
          <div class="card-block">
            <div class="block-head">
              <h4>预算总览</h4>
              <el-tag
                size="small"
                effect="plain"
                :type="result.usage_ratio > 0.9 ? 'danger' : 'success'"
              >
                {{ result.used_tokens }} / {{ result.total_budget }} tok（{{
                  (result.usage_ratio * 100).toFixed(1)
                }}%）
              </el-tag>
            </div>
            <el-progress
              :percentage="Math.min(100, Math.round(result.usage_ratio * 100))"
              :color="result.usage_ratio > 0.9 ? '#f56c6c' : '#7c5cff'"
              :stroke-width="10"
            />
            <div class="meta-row">
              <el-tag
                v-for="(value, key) in result.sources"
                :key="key"
                size="small"
                effect="plain"
              >
                {{ sourceLabel(key) }}：{{ value }}
              </el-tag>
            </div>
          </div>

          <div class="card-block">
            <h4>四层编排（从上到下即上下文顺序）</h4>
            <div v-for="layer in result.layers" :key="layer.key" class="layer">
              <div class="layer-head">
                <span class="layer-name">{{ layer.name }}</span>
                <span class="muted">{{ layer.used }}/{{ layer.budget }} tok</span>
              </div>
              <el-progress
                :percentage="percent(layer)"
                :color="layer.used > layer.budget ? '#f56c6c' : '#7c5cff'"
                :stroke-width="6"
                :show-text="false"
              />
              <p class="layer-pos">{{ layer.position }}</p>
              <div v-for="part in layer.parts" :key="part.name" class="part">
                <span>{{ part.name }}</span>
                <span class="muted">{{ part.tokens }}/{{ part.budget }} tok</span>
              </div>
              <el-collapse>
                <el-collapse-item
                  :title="`查看这一层的文本（${layer.content.length} 字）`"
                  :name="layer.key"
                >
                  <pre class="code-block">{{ layer.content || '（本层为空）' }}</pre>
                </el-collapse-item>
              </el-collapse>
            </div>
            <p class="hint">
              约束复述区不在上面四层里——它被放在上下文最末尾、紧贴当前问题，
              中间隔几千 token 历史就会被稀释。
            </p>
          </div>

          <div class="card-block">
            <h4>检索块的命运（去重 → 位置学 → token 裁剪）</h4>
            <el-table :data="result.blocks" size="small" empty-text="没有检索块">
              <el-table-column prop="title" label="来源" width="105" show-overflow-tooltip />
              <el-table-column prop="chunk_index" label="块" width="55" />
              <el-table-column prop="score" label="分数" width="70" />
              <el-table-column label="处理" width="110">
                <template #default="{ row }">
                  <el-tag size="small" :type="actionType(row.action)">{{ row.action }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="摆放" width="70">
                <template #default="{ row }">
                  {{ row.position ? `第${row.position}位` : '—' }}
                </template>
              </el-table-column>
              <el-table-column prop="tokens" label="tok" width="65" />
              <el-table-column prop="detail" label="说明" show-overflow-tooltip />
            </el-table>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>七问自检</h4>
              <el-tag
                size="small"
                effect="plain"
                :type="passedChecks === result.checks.length ? 'success' : 'danger'"
              >
                {{ passedChecks }}/{{ result.checks.length }} 通过
              </el-tag>
            </div>
            <div
              v-for="check in result.checks"
              :key="check.no"
              class="check"
              :class="{ bad: !check.ok }"
            >
              <span class="check-no">{{ check.ok ? '✔' : '✘' }} {{ check.no }}</span>
              <div class="check-body">
                <p class="check-q">{{ check.question }}</p>
                <p class="check-detail">{{ check.detail }}</p>
                <p class="check-signal">信号：{{ check.signal }}</p>
              </div>
            </div>
          </div>

          <div v-if="result.warnings.length" class="card-block warn">
            <h4>编排报警（{{ result.warnings.length }} 条）</h4>
            <p v-for="(item, index) in result.warnings" :key="index" class="warn-line">
              ⚠ {{ item }}
            </p>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>最终上下文</h4>
              <el-button link size="small" type="primary" @click="copyContext">复制</el-button>
            </div>
            <pre class="code-block context">{{ result.context }}</pre>
            <el-collapse v-if="result.dump">
              <el-collapse-item title="整体 dump（开发模式的听诊器）" name="dump">
                <pre class="code-block">{{ result.dump }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
// Day 08 实验台：上下文编排器——原料输入 / 四层预算账单 / 检索块裁剪轨迹 / 七问自检 / dump
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { buildStudyContext } from '@/api/study'

// 课程 4.2 的四个检索块：块 6 是块 5 的子集，用来看去重
const DEMO_BLOCKS = [
  {
    text: 'XR-500 Pro 保修期为两年，电池保修一年。',
    title: '产品手册',
    chunk_index: 5,
    score: 0.91,
    section: '规格与保修',
    style: 'narrative'
  },
  {
    text: '年卡会员退款免运费，且享 95 折优惠。',
    title: '退款政策',
    chunk_index: 2,
    score: 0.78,
    section: '会员权益',
    style: 'clause'
  },
  {
    text: '自签收之日起 30 天内可无理由退款，运费 10 元由买家承担。',
    title: '退款政策',
    chunk_index: 1,
    score: 0.74,
    section: '退款政策',
    style: 'clause'
  },
  {
    text: '保修期为两年，电池保修一年。',
    title: '产品手册',
    chunk_index: 6,
    score: 0.7,
    section: '规格与保修',
    style: 'narrative'
  }
]

// 课程 4.2 的对话历史：第三轮的问题才是当前问题，不会被重复注入
const DEMO_HISTORY = [
  { role: 'user', content: 'XR-500 Pro 保修多久？' },
  { role: 'assistant', content: 'XR-500 Pro 整机保修两年 [来源: 产品手册 §块5]。' }
]

const presets = [
  '那退款要运费吗？',
  'XR-500 Pro 保修多久？',
  '客服说运费 8 元，这和我该付的一样吗？',
  '我的订单 O20260012 到哪了？'
]

const question = ref(presets[0])
const userId = ref('')
const ragQuery = ref('')
const topK = ref(4)
const totalBudget = ref(16000)
const withTools = ref(true)
const debug = ref(true)
const toolData = ref('order_status: 已发货（今日 09:12 查询）')
const shortMemory = ref('')
const blocksJson = ref(JSON.stringify(DEMO_BLOCKS, null, 2))
const historyJson = ref(JSON.stringify(DEMO_HISTORY, null, 2))
const systemPrompt = ref('')
const constraintsText = ref('')

const building = ref(false)
const result = ref(null)

const passedChecks = computed(
  () => (result.value ? result.value.checks.filter((item) => item.ok).length : 0)
)

// 层用量百分比（超预算按 100 封顶，颜色另行标红）
const percent = (layer) => {
  if (!layer.budget) return 0
  return Math.min(100, Math.round((layer.used / layer.budget) * 100))
}

// 检索块处理状态的标签配色
const actionType = (action) => {
  if (action === '保留' || action === '裁剪装填') return 'success'
  return 'info'
}

// 原料来源的中文标签
const sourceLabel = (key) =>
  ({ profile: '画像', rag: '检索', tools: '工具说明书' })[key] || key

// 解析 JSON 文本域，格式错时给出可读提示
const parseJson = (text, field) => {
  if (!text.trim()) return undefined
  try {
    return JSON.parse(text)
  } catch (error) {
    throw new Error(`${field} 不是合法 JSON：${error.message}`)
  }
}

// 编排一次：只拼装上下文，不调模型（不花 token，秒回）
const build = async () => {
  if (!question.value.trim() || building.value) return
  let blocks
  let history
  try {
    blocks = parseJson(blocksJson.value, '手填检索块')
    history = parseJson(historyJson.value, '对话历史')
  } catch (error) {
    ElMessage.warning(error.message)
    return
  }
  building.value = true
  try {
    result.value = await buildStudyContext({
      user_query: question.value.trim(),
      user_id: userId.value.trim() || undefined,
      rag_query: ragQuery.value.trim() || undefined,
      top_k: topK.value,
      rag_blocks: ragQuery.value.trim() ? undefined : blocks,
      tool_data: toolData.value.trim(),
      short_memory: shortMemory.value.trim(),
      history: history || [],
      hard_constraints: constraintsText.value
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      system_prompt: systemPrompt.value.trim() || undefined,
      with_tools: withTools.value,
      total_budget: totalBudget.value,
      debug: debug.value
    })
  } finally {
    building.value = false
  }
}

// 还原课程演示原料（清掉真实数据来源，避免混淆）
const restoreDemo = () => {
  question.value = presets[0]
  userId.value = ''
  ragQuery.value = ''
  toolData.value = 'order_status: 已发货（今日 09:12 查询）'
  shortMemory.value = ''
  blocksJson.value = JSON.stringify(DEMO_BLOCKS, null, 2)
  historyJson.value = JSON.stringify(DEMO_HISTORY, null, 2)
  systemPrompt.value = ''
  constraintsText.value = ''
  totalBudget.value = 16000
  ElMessage.success('已恢复演示原料')
}

// 复制最终上下文，方便贴到任意模型里做对照实验
const copyContext = async () => {
  if (!result.value) return
  try {
    await navigator.clipboard.writeText(result.value.context)
    ElMessage.success('已复制最终上下文')
  } catch {
    ElMessage.warning('浏览器拒绝写剪贴板，请手动选中复制')
  }
}
</script>

<style lang="scss" scoped>
.day08 {
  .tip {
    margin-bottom: $gap-sm;
  }

  .two-col {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.3fr);
    gap: $gap-md;

    @media (max-width: 1100px) {
      grid-template-columns: 1fr;
    }
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
    align-items: center;
    justify-content: space-between;
    margin-bottom: $gap-sm;

    h4 {
      margin: 0;
    }
  }

  .warn {
    border-color: #f5dab1;
    background: #fffbf5;

    .warn-line {
      margin: 4px 0;
      font-size: 12px;
      line-height: 1.7;
      color: #a05a00;
      word-break: break-all;
    }
  }

  .muted {
    font-size: 12px;
    color: $agent-text-muted;
  }

  .mb {
    margin-bottom: 8px;
  }

  .row-actions {
    display: flex;
    gap: 8px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 8px;
  }

  .switch-row {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
    margin-top: $gap-sm;
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

  .layer {
    padding-bottom: $gap-sm;
    margin-bottom: $gap-sm;
    border-bottom: 1px dashed #eef0f6;

    &:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
  }

  .layer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;

    .layer-name {
      font-size: 12px;
      font-weight: 600;
      color: $text-primary;
    }
  }

  .layer-pos {
    margin: 6px 0;
    font-size: 11px;
    color: $agent-text-muted;
  }

  .part {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 11px;
    line-height: 1.9;
    color: $text-regular;
  }

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: $gap-sm;
  }

  .check {
    display: flex;
    gap: 10px;
    padding: 8px 0;
    border-bottom: 1px dashed #eef0f6;

    &:last-child {
      border-bottom: none;
    }

    &.bad .check-q {
      color: #d9534f;
    }

    .check-no {
      min-width: 34px;
      font-size: 12px;
      color: $agent-accent;
    }

    .check-body {
      flex: 1;
      min-width: 0;
    }

    .check-q {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
      color: $text-primary;
    }

    .check-detail {
      margin: 2px 0;
      font-size: 12px;
      line-height: 1.7;
      color: $text-regular;
      word-break: break-all;
    }

    .check-signal {
      margin: 0;
      font-size: 11px;
      color: $agent-text-muted;
    }
  }

  .hint {
    margin: $gap-sm 0 0;
    font-size: 12px;
    line-height: 1.7;
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

    &.context {
      max-height: 420px;
      overflow-y: auto;
      overscroll-behavior: contain;
    }
  }
}
</style>
