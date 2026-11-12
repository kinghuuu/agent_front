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
        placeholder="输入问题，例如：上海天气怎么样？之后可接着问：那北京呢？"
      />

      <div class="form-row">
        <div class="form-item">
          <span class="form-label">最大步数</span>
          <el-input-number v-model="maxSteps" :min="1" :max="12" />
          <span class="form-hint">文本协议更容易解析失败，步数留足一点</span>
        </div>
        <el-button type="primary" :loading="loading" @click="handleRun">
          {{ loading ? '运行中...' : '运行 ReAct' }}
        </el-button>
      </div>

      <!-- 会话状态：练习 3 多轮对话——同一会话 ID 的多次运行共享 history -->
      <div class="session-row">
        <el-tag effect="plain" size="small">第 {{ result?.turns || 0 }} 轮</el-tag>
        <span class="session-id">会话 ID：<code>{{ sessionId.slice(0, 8) }}</code></span>
        <span class="session-hint">同一会话内接着上一句问，模型能理解"那上海呢"这类指代</span>
        <el-button size="small" text type="primary" @click="resetSession">新对话（清空记忆）</el-button>
      </div>
    </div>

    <!-- 执行轨迹：每一步展示模型原文（Thought/Action）+ 解析结果 + Observation -->
    <div v-if="result" class="trace">
      <el-alert
        v-if="result.stopped_by_limit"
        type="warning"
        :closable="false"
        show-icon
        title="已达到最大步数，没能得到 Final Answer"
      />

      <h3 class="trace-title">执行轨迹</h3>
      <div v-for="step in result.steps" :key="step.step" class="step-card">
        <div class="step-head">
          <span class="step-no">Step {{ step.step }}</span>
          <el-tag v-if="step.is_error" type="danger" size="small">解析失败 · 已要求重试</el-tag>
          <el-tag v-else-if="step.action_name" type="primary" size="small">
            Action: {{ step.action_name }}
          </el-tag>
        </div>

        <pre class="raw-text">{{ step.raw_text }}</pre>

        <div v-if="step.action_name" class="parsed-line">
          解析参数：<code>{{ JSON.stringify(step.action_args) }}</code>
        </div>
        <div v-if="step.observation !== null" class="observation-line">
          Observation：<span :class="{ 'obs-error': step.is_error }">{{ step.observation }}</span>
        </div>
      </div>

      <!-- 最终回答 -->
      <div v-if="result.final_answer" class="answer-card">
        <h3 class="trace-title">Final Answer <el-tag size="small" effect="plain">{{ result.model }}</el-tag></h3>
        <MarkdownContent :content="result.final_answer" />
      </div>

      <!-- 跨轮记忆可视化：这就是下一轮请求发给模型的"已有记录"全文 -->
      <el-collapse v-if="result.history" class="history-collapse">
        <el-collapse-item :title="`会话累计记忆 history（${result.turns} 轮）`" name="history">
          <pre class="history-text">{{ result.history }}</pre>
        </el-collapse-item>
      </el-collapse>
    </div>
  </div>
</template>

<script setup>
// 手写 ReAct 实验区：展示"Function Calling 拆掉黑盒后"的样子——
// 模型输出 Thought/Action 文本，后端正则解析、执行工具、把 Observation 拼回 history
// 练习 3（多轮对话）：前端持有会话 ID，多次运行传同一个 ID，后端保留 history 实现"接着上一句继续问"
import { ref } from 'vue'
import { runStudyReact } from '@/api/study'
import MarkdownContent from '@/components/MarkdownContent.vue'

const presets = ['北京天气怎么样？', '现在几点了？帮我算一下 18*7+46', '上海天气怎么样？', '帮我查一下新能源最近的新闻，并总结一下']

const question = ref(presets[0])
const maxSteps = ref(6)
const loading = ref(false)
const result = ref(null)
// 会话 ID：页面加载时生成一次，之后每次运行都带上——后端据此找到同一份 history
const sessionId = ref(crypto.randomUUID())

// 新对话：换一个会话 ID（后端对应一份全新空白 history），并清空当前轨迹展示
const resetSession = () => {
  sessionId.value = crypto.randomUUID()
  result.value = null
}

const handleRun = async () => {
  if (!question.value.trim()) return
  loading.value = true
  result.value = null
  try {
    result.value = await runStudyReact({
      question: question.value.trim(),
      max_steps: maxSteps.value,
      session_id: sessionId.value
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

  // 会话状态行：轮数 / 会话 ID / 新对话入口
  .session-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin-top: $gap-md;
    padding-top: $gap-sm;
    border-top: 1px dashed $border-color;

    .session-id {
      font-size: 12px;
      color: $agent-text-muted;

      code {
        color: $agent-accent;
      }
    }

    .session-hint {
      font-size: 12px;
      color: $agent-text-muted;
    }
  }
}

.trace {
  margin-top: $gap-lg;

  .trace-title {
    margin: 0 0 $gap-sm;
    font-size: 15px;
    color: $text-primary;
  }

  .step-card {
    padding: $gap-sm $gap-md;
    margin-bottom: $gap-sm;
    border-radius: $radius-md;
    border: 1px solid $border-color;

    .step-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: $gap-sm;

      .step-no {
        font-size: 13px;
        font-weight: 600;
        color: $text-primary;
      }
    }

    .raw-text {
      margin: 0 0 $gap-sm;
      padding: 10px 12px;
      border-radius: $radius-sm;
      background: #1f2430;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.7;
      color: #e6e9f2;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .parsed-line,
    .observation-line {
      font-size: 13px;
      line-height: 1.7;
      color: $text-regular;

      code {
        color: $agent-accent;
      }

      .obs-error {
        color: $danger-color;
      }
    }
  }

  .answer-card {
    margin-top: $gap-md;
    padding: $gap-md $gap-lg;
    border-radius: $radius-md;
    background: $agent-assistant-bubble;
  }

  // 累计记忆折叠面板：展示下一轮请求会带上来的 history 全文
  .history-collapse {
    margin-top: $gap-md;

    .history-text {
      margin: 0;
      padding: 10px 12px;
      border-radius: $radius-sm;
      background: #f7f8fc;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 12px;
      line-height: 1.7;
      color: $text-regular;
      white-space: pre-wrap;
      word-break: break-word;
    }
  }
}
</style>
