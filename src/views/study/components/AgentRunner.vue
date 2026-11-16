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
          <span class="form-label">最大步数</span>
          <el-input-number v-model="maxSteps" :min="1" :max="12" />
          <span class="form-hint">防死循环的硬上限，改成 1 可观察"循环被砍掉"的效果</span>
        </div>
        <div class="form-item">
          <span class="form-label">模型</span>
          <el-select v-model="modelId" placeholder="默认模型" style="width: 220px" clearable>
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
      <el-alert
        v-if="result.stopped_by_limit"
        type="warning"
        :closable="false"
        show-icon
        title="已达到最大步数，模型始终没有给出最终回答——这正是砍掉循环后 Agent 退化的样子"
      />
      <el-alert
        v-if="result.escalated"
        type="error"
        :closable="false"
        show-icon
        title="自愈上限熔断（Day 04）：同一个工具同一类错误连续失败，继续重试只是烧 token，已升级为人工处理"
      />

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
import { onMounted, ref } from 'vue'
import { listChatModels, runStudyAgent } from '@/api/study'
import MarkdownContent from '@/components/MarkdownContent.vue'

// 预设问题覆盖 Day 03/04 的典型场景：并行多工具、串行依赖、
// 参数格式错误自愈（Day 04 场景 A）、退款确认门（Day 04 场景 B）
const presets = [
  '北京现在天气怎么样？如果气温低于 20 度，帮我算一下 18*7+46 等于多少。',
  '杭州今天多少度？需要带伞吗？现在几点了？',
  '北京现在多少度？换算成华氏度是多少？',
  '帮我看下 U000123 最近两单是什么状态',
  '把订单 O20260012 全额退了吧，键盘有质量问题',
  '现在几点了？',
  '帮我算一下 sqrt(144) + 18*7+46 的结果',
  '帮我查一下人工智能最近的新闻，并总结一下'
]

const question = ref(presets[0])
const maxSteps = ref(8)
const modelId = ref(null)
const userConfirmed = ref(false)
const models = ref([])
const loading = ref(false)
const result = ref(null)

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
      max_steps: maxSteps.value,
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
