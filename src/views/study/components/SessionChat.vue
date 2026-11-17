<template>
  <div class="session-layout">
    <!-- 左侧：对话区 -->
    <div class="chat-panel">
      <div class="chat-head">
        <div>
          <h3 class="panel-title">多轮对话</h3>
          <p class="session-id">
            会话：{{ sessionId || '尚未开始（首次发送后自动生成 ID）' }}
          </p>
        </div>
        <div class="head-actions">
          <el-select v-model="budgetProfile" style="width: 110px" size="small">
            <el-option label="自动判断" value="auto" />
            <el-option label="简单" value="simple" />
            <el-option label="复杂" value="complex" />
          </el-select>
          <el-button size="small" :disabled="!sessionId" @click="handleReset">新会话</el-button>
        </div>
      </div>

      <el-alert
        class="tip"
        type="info"
        :closable="false"
        show-icon
        title="messages 是每轮现算的视图，SessionState 才是记忆：硬约束进锚点、事实进槽位、旧轮进增量摘要，且裁剪单位永远是“轮”"
      />

      <div v-if="!messages.length" class="preset-row">
        <span class="preset-label">试一试这组追问（测约束锚点与事实槽位）：</span>
        <el-tag
          v-for="q in presets"
          :key="q"
          class="preset-tag"
          effect="plain"
          @click="draft = q"
        >
          {{ q }}
        </el-tag>
      </div>

      <div ref="scrollRef" class="message-area">
        <template v-if="!messages.length">
          <div class="empty-hint">发送第一句话开始——比如“我们公司只能走对公转账，别推荐在线支付”，随后再问“我刚才说的付款方式是什么？”验证约束是否还在。</div>
        </template>
        <div v-for="(item, i) in messages" :key="i" class="message-item" :class="item.role">
          <div class="bubble">
            <MarkdownContent :content="item.content || '（空回答）'" />
            <div v-if="item.meta" class="msg-meta">
              <el-tag size="small" effect="plain">{{ item.meta.stop }}</el-tag>
              <span>{{ item.meta.ctx }} tok · {{ item.meta.water }} · {{ item.meta.tokens }} tokens 消耗</span>
            </div>
          </div>
        </div>

        <!-- 加载中标识：请求未返回时在消息列表末尾显示跳动的思考气泡 -->
        <div v-if="loading" class="message-item assistant">
          <div class="bubble thinking-bubble">
            <span class="thinking-dots"><i></i><i></i><i></i></span>
            <span>正在思考…</span>
          </div>
        </div>
      </div>

      <div class="composer">
        <!-- 发送按钮内嵌在输入框右下角：外层定位容器 + 文本框右侧留白，不依赖 el-input 的 slot -->
        <div class="input-wrap">
          <el-input
            v-model="draft"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="输入一句话继续对话…（Enter 发送，Shift + Enter 换行）"
            :disabled="loading"
            @keydown.enter.exact.prevent="handleSend"
          />
          <el-tooltip :content="loading ? '停止生成' : '发送'" placement="top">
            <!-- 用 span 包一层承接 hover，避免 disabled 按钮吞掉 tooltip 的鼠标事件 -->
            <span class="send-icon-wrap">
              <button
                class="send-icon"
                :class="{ 'stop-btn': loading }"
                type="button"
                :disabled="!loading && !draft.trim()"
                @click="loading ? handleStop() : handleSend()"
              >
                <el-icon><component :is="loading ? 'VideoPause' : 'Promotion'" /></el-icon>
              </button>
            </span>
          </el-tooltip>
        </div>
      </div>
    </div>

    <!-- 右侧：SessionState 真相源 -->
    <div class="state-panel">
      <h3 class="panel-title">SessionState（记忆真相源）</h3>
      <el-empty v-if="!state" description="发送消息后展示记忆投影" :image-size="60" />
      <template v-else>
        <div class="stat-grid">
          <div class="stat"><span>轮数</span><b>{{ state.turn }}</b></div>
          <div class="stat"><span>上下文</span><b>{{ state.context_tokens }} tok</b></div>
          <div class="stat"><span>水位</span><b>{{ state.water_level }}</b></div>
          <div class="stat"><span>近轮</span><b>{{ state.recent_rounds }} 轮</b></div>
        </div>

        <div class="state-section">
          <h4>③ 约束锚点 <el-tag size="small" effect="plain">永不裁剪</el-tag></h4>
          <p v-if="!state.constraints.length" class="muted">暂无——用户说过“只能/必须/别…”会自动进这里</p>
          <p v-for="(c, i) in state.constraints" :key="i" class="fact-line">- {{ c }}</p>
        </div>

        <div class="state-section">
          <h4>事实槽位 <el-tag size="small" effect="plain">不靠摘要</el-tag></h4>
          <pre class="state-code">{{ JSON.stringify(state.facts, null, 2) }}</pre>
        </div>

        <div v-if="state.anchors.length" class="state-section">
          <h4>摘要质检补回的硬事实</h4>
          <p v-for="(a, i) in state.anchors" :key="i" class="fact-line">- {{ a }}</p>
        </div>

        <div class="state-section">
          <h4>④ 滚动摘要 <el-tag size="small" effect="plain">增量合并</el-tag></h4>
          <p class="summary-text">{{ state.summary || '（暂无，轮次被挤出时自动生成）' }}</p>
        </div>

        <div class="state-section">
          <h4>淘汰与水位记录</h4>
          <p v-if="!state.dropped.length" class="muted">暂无淘汰</p>
          <p v-for="(d, i) in state.dropped" :key="`d${i}`" class="log-line">
            第 {{ d.turn }} 轮挤出 {{ d.evicted_msgs }} 条消息 → 摘要 {{ d.summary_len }} 字
          </p>
          <p v-for="(w, i) in state.water_events.slice(-3)" :key="`w${i}`" class="log-line">
            第 {{ w.turn }} 轮水位 {{ (w.ratio * 100).toFixed(0) }}%（{{ w.level }}）
          </p>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
// Day 06 短期记忆实验区：多轮对话 + SessionState 真相源可视化
// 左侧发消息，右侧实时展示约束锚点 / 事实槽位 / 摘要 / 水位 / 淘汰记录
import { nextTick, ref } from 'vue'
import { chatStudySession, resetStudySession } from '@/api/study'
import MarkdownContent from '@/components/MarkdownContent.vue'

// 预设对话：先立硬约束，再追问约束与事实，观察锚点与槽位是否生效
const presets = [
  '我们公司只能走对公转账，别推荐在线支付。我最近买的东西到哪了？',
  '那 O20260044 这单呢？',
  '我上一条说的付款方式是什么？',
  '帮我看看上个月有没有退款到账',
  '退款单号是多少？'
]

const budgetProfile = ref('auto')
const sessionId = ref(null)
const draft = ref('')
const messages = ref([])
const state = ref(null)
const loading = ref(false)
const scrollRef = ref(null)
// 当前进行中的请求控制器：加载中点击"停止"即 abort，让按钮具备真实的请求语义
let activeController = null

// 滚动到底部：发送后立即滚一次露出"正在思考"，回答返回后再滚一次
const scrollToBottom = async () => {
  await nextTick()
  scrollRef.value?.scrollTo({ top: scrollRef.value.scrollHeight, behavior: 'smooth' })
}

// 发送消息：后端用 session_id 取回同一份记忆，返回本轮结果 + 记忆状态快照
const handleSend = async () => {
  const text = draft.value.trim()
  if (!text || loading.value) return
  loading.value = true
  messages.value.push({ role: 'user', content: text })
  draft.value = ''
  scrollToBottom()

  // 每次请求用独立控制器，abort 后不影响下一轮
  const controller = new AbortController()
  activeController = controller
  try {
    const result = await chatStudySession(
      {
        message: text,
        session_id: sessionId.value || undefined,
        budget_profile: budgetProfile.value
      },
      controller.signal
    )
    sessionId.value = result.session_id
    state.value = result
    messages.value.push({
      role: 'assistant',
      content: result.run.final_answer,
      meta: {
        stop: result.run.stop_reason,
        ctx: result.context_tokens,
        water: result.water_level,
        tokens: result.run.tokens
      }
    })
    scrollToBottom()
  } catch (err) {
    // 主动停止是正常交互，不留失败气泡；其它异常才提示失败
    if (err?.code !== 'ERR_CANCELED' && err?.name !== 'CanceledError') {
      messages.value.push({ role: 'assistant', content: '请求失败，请稍后重试。' })
    }
  } finally {
    activeController = null
    loading.value = false
  }
}

// 停止生成：中止当前请求；后端仍会跑完本轮，但前端不再等待（学习实验台够用）
const handleStop = () => {
  activeController?.abort()
}

// 新会话：后端按同 id 重置记忆（也可以直接换 ID，效果一样）
const handleReset = async () => {
  if (!sessionId.value) return
  try {
    await resetStudySession(sessionId.value)
  } catch {
    // 会话可能已随后端重启清空，本地照样重置即可
  }
  sessionId.value = null
  messages.value = []
  state.value = null
  draft.value = ''
}
</script>

<style lang="scss" scoped>
.session-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: $gap-md;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
}

.chat-panel,
.state-panel {
  min-width: 0;
  padding: $gap-md;
  border: 1px solid #e8e9f0;
  border-radius: $radius-md;
  background: #fff;
}

.panel-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
}

.chat-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: $gap-sm;

  .session-id {
    margin: 4px 0 0;
    font-size: 11px;
    color: $agent-text-muted;
    word-break: break-all;
  }

  .head-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
}

.tip {
  margin-bottom: $gap-sm;
}

.preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: $gap-sm;

  .preset-label {
    font-size: 12px;
    color: $agent-text-muted;
  }

  .preset-tag {
    cursor: pointer;
    font-size: 11px;
  }
}

.message-area {
  height: 360px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: $gap-sm;
  border-radius: $radius-sm;
  background: #f9fafc;

  .empty-hint {
    margin-top: 80px;
    text-align: center;
    font-size: 12px;
    line-height: 1.8;
    color: $agent-text-muted;
  }
}

.message-item {
  display: flex;
  margin-bottom: $gap-sm;

  &.user {
    justify-content: flex-end;
  }

  .bubble {
    max-width: 90%;
    padding: 10px 12px;
    border-radius: $radius-md;
    font-size: 13px;
    line-height: 1.7;
  }

  &.user .bubble {
    background: $agent-accent;
    color: #fff;
  }

  &.assistant .bubble {
    background: #fff;
    border: 1px solid #e8e9f0;
    color: $text-primary;
  }

  // 加载中的思考气泡：三个跳动的圆点 + 文案，让用户明确感知请求仍在进行
  .thinking-bubble {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 14px;
    color: $agent-text-muted;
    font-size: 12px;
  }

  .msg-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-top: 8px;
    font-size: 11px;
    color: $agent-text-muted;
  }
}

.composer {
  margin-top: $gap-sm;

  .input-wrap {
    position: relative;

    // 右侧留出圆形按钮的宽度，避免输入文字压到按钮上
    :deep(.el-textarea__inner) {
      padding-right: 44px;
    }
  }

  .send-icon-wrap {
    position: absolute;
    right: 8px;
    bottom: 8px;
    display: inline-flex;
  }

  // 圆形渐变图标按钮，视觉风格与会话页 ChatComposer 的发送键保持一致
  .send-icon {
    width: 30px;
    height: 30px;
    padding: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    font-size: 16px;
    color: #fff;
    background: $agent-gradient;
    cursor: pointer;
    @include transition(all);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(107, 124, 255, 0.4);
    }

    &:active:not(:disabled) {
      transform: scale(0.92);
    }

    &:disabled {
      color: #b8bfd1;
      background: #e8ebf3;
      cursor: not-allowed;
    }

    // 加载中切为"停止"按钮：淡紫底 + 主色图标，视觉上与会话页停止键一致
    &.stop-btn {
      color: $agent-accent;
      background: rgba(107, 124, 255, 0.12);
      box-shadow: none;

      &:hover:not(:disabled) {
        background: rgba(107, 124, 255, 0.2);
        box-shadow: none;
      }
    }
  }
}

// 思考气泡里三个依次跳动的圆点
.thinking-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  i {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: $agent-accent;
    animation: thinking-bounce 1.2s infinite ease-in-out;

    &:nth-child(2) { animation-delay: 0.15s; }
    &:nth-child(3) { animation-delay: 0.3s; }
  }
}

@keyframes thinking-bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
  30% { transform: translateY(-4px); opacity: 1; }
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  margin: $gap-sm 0;

  .stat {
    padding: 8px 4px;
    border-radius: $radius-sm;
    background: #f7f8fc;
    text-align: center;

    span {
      display: block;
      font-size: 11px;
      color: $agent-text-muted;
    }

    b {
      font-size: 13px;
      color: $text-primary;
    }
  }
}

.state-section {
  margin-top: $gap-md;

  h4 {
    margin: 0 0 6px;
    font-size: 12px;
    color: $text-primary;
  }

  .fact-line,
  .log-line {
    margin: 2px 0;
    font-size: 12px;
    line-height: 1.6;
    color: $text-regular;
    word-break: break-all;
  }

  .muted,
  .summary-text {
    margin: 0;
    font-size: 12px;
    line-height: 1.7;
    color: $agent-text-muted;
  }

  .state-code {
    margin: 0;
    padding: 8px 10px;
    border-radius: $radius-sm;
    background: #f7f8fc;
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 11px;
    color: $text-regular;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
