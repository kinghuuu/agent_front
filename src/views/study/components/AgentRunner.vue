<template>
  <div>
    <!-- 运行表单 -->
    <div class="run-form">
      <div class="preset-row">
        <span class="preset-label">快捷问题：</span>
        <el-tag
          v-for="q in presets"
          :key="q"
          class="preset-tag"
          effect="plain"
          @click="question = q"
        >
          {{ q }}
        </el-tag>
      </div>

      <el-input
        v-model="question"
        type="textarea"
        :rows="3"
        placeholder="输入问题，例如：北京现在天气怎么样？如果气温低于 20 度，帮我算一下 18*7+46 等于多少。"
      />

      <div class="form-row">
        <div class="form-item">
          <span class="form-label">预算档位</span>
          <el-select v-model="budgetProfile" style="width: 130px">
            <el-option label="自动判断" value="auto" />
            <el-option label="简单（6 步）" value="simple" />
            <el-option label="复杂（20 步）" value="complex" />
          </el-select>
          <span class="form-hint">档位同时限制步数 / token / 时延三道上限</span>
        </div>
        <div class="form-item">
          <span class="form-label">覆盖步数</span>
          <el-input-number v-model="maxSteps" :min="0" :max="30" />
          <span class="form-hint">0 = 按档位；设 1 可观察"循环被砍掉"的强制收敛</span>
        </div>
        <div class="form-item">
          <span class="form-label">模型</span>
          <el-select v-model="modelId" placeholder="默认模型" style="width: 200px" clearable>
            <el-option
              v-for="m in models"
              :key="m.id"
              :label="m.name"
              :value="m.id"
            />
          </el-select>
        </div>
        <!-- Day 04 确认门：资金操作被拦截后，勾选此项重新发送同一问题即可放行 -->
        <el-checkbox v-model="userConfirmed">已获用户确认（放行退款等资金操作）</el-checkbox>
        <el-button type="primary" :loading="loading" @click="handleRun">
          {{ loading ? '运行中...' : '运行 Agent' }}
        </el-button>
      </div>
    </div>

    <!-- 执行轨迹 -->
    <div v-if="result" class="trace">
      <!-- Day 05：停止原因与降级交付说明 -->
      <div class="stop-bar">
        <el-tag :type="stopTagType" effect="dark" size="small">{{ stopLabel }}</el-tag>
        <span class="stop-meta">
          档位 {{ result.budget_profile }}（{{ result.budget_desc }}） ·
          {{ result.steps.length }} 步 · {{ result.tokens }} tokens · {{ (result.elapsed_ms / 1000).toFixed(1) }}s
        </span>
      </div>

      <el-alert
        v-if="result.degraded"
        type="warning"
        :closable="false"
        show-icon
        :title="`已触发强制收敛（${stopLabel}）：用 tools=None 逼模型只用手上信息交卷，下面是降级交付的答案，可能标注了“未能确认”`"
      />
      <el-alert
        v-if="result.escalated"
        type="error"
        :closable="false"
        show-icon
        title="自愈上限熔断（Day 04）：同一个工具同一类错误连续失败，继续重试只是烧 token，已改为强制收敛并升级人工"
      />
      <el-alert
        v-if="result.grounding_note"
        :type="result.grounded ? 'info' : 'error'"
        :closable="false"
        show-icon
        :title="result.grounded
          ? `结果校验（第 4 层）：${result.grounding_note}，重写后已引用工具事实`
          : `结果校验（第 4 层）：${result.grounding_note}，重写后仍未引用任何工具事实，疑似假收敛`"
      />
      <p v-if="result.guard_diagnosis" class="guard-diag">
        终止诊断：{{ result.guard_diagnosis }}
      </p>

      <h3 class="trace-title">执行轨迹</h3>
      <el-timeline>
        <el-timeline-item
          v-for="step in result.steps"
          :key="step.step"
          :type="step.tool_calls.length ? 'primary' : 'success'"
          :timestamp="`Step ${step.step}`"
          placement="top"
        >
          <!-- 调工具的轮次：展示每次调用的参数与真实执行结果 -->
          <div v-if="step.tool_calls.length" class="call-list">
            <div class="call-mode">
              <el-tag v-if="step.tool_calls.length > 1" size="small" type="warning" effect="plain">
                并行调用 × {{ step.tool_calls.length }}（模型自主决策，互不依赖）
              </el-tag>
              <el-tag v-else size="small" effect="plain">单工具调用</el-tag>
              <!-- Day 05：结果指纹只看结果不看动作，连续几步相同 = 无进展 -->
              <el-tag v-if="step.progress_fp" size="small" effect="plain" class="fp-tag">
                结果指纹 {{ step.progress_fp }}
              </el-tag>
            </div>
            <div v-for="(call, i) in step.tool_calls" :key="i" class="call-item">
              <div class="call-name">
                调用工具 <code>{{ call.name }}</code>
                <el-tag size="small" effect="plain" class="call-tag">{{ call.duration_ms }}ms</el-tag>
                <el-tag v-if="call.self_heal" size="small" type="warning" effect="plain" class="call-tag">
                  [self-heal] 上一轮报错后的自我纠正
                </el-tag>
                <el-tag v-else-if="call.is_error" size="small" type="danger" effect="plain" class="call-tag">
                  报错（{{ call.error_type || 'error' }}，错误已回填给模型）
                </el-tag>
              </div>
              <pre class="call-args">参数：{{ JSON.stringify(call.arguments) }}</pre>
              <pre class="call-result">结果：{{ call.result }}</pre>
            </div>
          </div>
          <!-- 直接回答的轮次 -->
          <div v-else class="final-step">模型认为信息足够，给出最终回答</div>
        </el-timeline-item>
      </el-timeline>

      <!-- 最终回答 -->
      <div v-if="result.final_answer" class="answer-card">
        <h3 class="trace-title">最终回答 <el-tag size="small" effect="plain">{{ result.model }}</el-tag></h3>
        <MarkdownContent :content="result.final_answer" />
      </div>
    </div>
  </div>
</template>

<script setup>
// Function Calling Agent 循环实验区：
// 提问 → 后端跑「决策 → 调工具 → 观察」循环 → 前端把轨迹渲染成时间线
import { computed, onMounted, ref } from 'vue'
import { listChatModels, runStudyAgent } from '@/api/study'
import MarkdownContent from '@/components/MarkdownContent.vue'

// 预设问题覆盖 Day 03/04/05 的典型场景：并行多工具、串行依赖、参数自愈、
// 退款确认门、空结果无进展（变体自旋）、异步导出轮询（白名单+退避）、假收敛
const presets = [
  '北京现在天气怎么样？如果气温低于 20 度，帮我算一下 18*7+46 等于多少。',
  '杭州今天多少度？需要带伞吗？现在几点了？',
  '北京现在多少度？换算成华氏度是多少？',
  '帮我看下 U000123 最近两单是什么状态',
  '把订单 O20260012 全额退了吧，键盘有质量问题',
  '帮我查一下 U999999 最近有没有订单，有没有发货',
  '把我的订单导出成 Excel，好了给我下载链接',
  '我上个月买了什么？',
  '帮我算一下 sqrt(144) + 18*7+46 的结果'
]

// Day 05 停止原因 → 展示文案与标签配色
const STOP_LABELS = {
  completed: { label: 'completed · 正常收敛', type: 'success' },
  repeated_action: { label: 'repeated_action · 同一动作反复', type: 'danger' },
  no_progress: { label: 'no_progress · 结果无进展', type: 'danger' },
  max_steps: { label: 'max_steps · 跑满步数', type: 'warning' },
  budget: { label: 'budget · 资源熔断', type: 'warning' },
  ungrounded: { label: 'ungrounded · 答案无事实支撑', type: 'danger' }
}

const question = ref(presets[0])
const budgetProfile = ref('auto')
const maxSteps = ref(0)
const modelId = ref(null)
const userConfirmed = ref(false)
const models = ref([])
const loading = ref(false)
const result = ref(null)

const stopLabel = computed(
  () => (STOP_LABELS[result.value?.stop_reason] || {}).label || result.value?.stop_reason
)
const stopTagType = computed(
  () => (STOP_LABELS[result.value?.stop_reason] || {}).type || 'info'
)

onMounted(async () => {
  try {
    models.value = await listChatModels()
  } catch {
    // 模型列表加载失败不阻塞页面，运行时后端会给出明确错误
  }
})

const handleRun = async () => {
  if (!question.value.trim()) return
  loading.value = true
  result.value = null
  try {
    result.value = await runStudyAgent({
      question: question.value.trim(),
      budget_profile: budgetProfile.value,
      // 0 表示不覆盖，由后端按档位决定步数上限
      max_steps: maxSteps.value || undefined,
      model_config_id: modelId.value || undefined,
      user_confirmed: userConfirmed.value
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.run-form {
  .preset-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    margin-bottom: $gap-sm;

    .preset-label {
      font-size: 13px;
      color: $agent-text-muted;
    }

    .preset-tag {
      cursor: pointer;
    }
  }

  .form-row {
    display: flex;
    flex-wrap: wrap;
    gap: $gap-md;
    align-items: center;
    margin-top: $gap-md;

    .form-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .form-label {
        font-size: 13px;
        color: $text-regular;
      }

      .form-hint {
        font-size: 12px;
        color: $agent-text-muted;
      }
    }
  }
}

.trace {
  margin-top: $gap-lg;

  .trace-title {
    margin: $gap-md 0 $gap-sm;
    font-size: 15px;
    color: $text-primary;
  }

  /* Day 05：停止原因 + 成本一行速览 */
  .stop-bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-bottom: $gap-sm;

    .stop-meta {
      font-size: 12px;
      color: $agent-text-muted;
    }
  }

  .guard-diag {
    margin: 6px 0 0;
    font-size: 12px;
    color: $agent-text-muted;
  }

  .fp-tag {
    margin-left: 6px;
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  }

  .call-list {
    display: flex;
    flex-direction: column;
    gap: $gap-sm;
  }

  .call-mode {
    margin-bottom: 6px;
  }

  .call-item {
    padding: $gap-sm $gap-md;
    border-radius: $radius-md;
    background: #f7f8fc;

    .call-name {
      font-size: 13px;
      font-weight: 600;
      color: $text-primary;

      code {
        color: $agent-accent;
      }

      .call-tag {
        margin-left: 6px;
        font-weight: 400;
      }
    }

    .call-args,
    .call-result {
      margin: 6px 0 0;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.6;
      color: $text-regular;
      white-space: pre-wrap;
      word-break: break-all;
    }
  }

  .final-step {
    font-size: 13px;
    color: $agent-text-muted;
  }

  .answer-card {
    margin-top: $gap-md;
    padding: $gap-md $gap-lg;
    border-radius: $radius-md;
    background: $agent-assistant-bubble;
  }
}
</style>
