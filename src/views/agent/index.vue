<template>
  <div class="agent-page">
    <!-- 左侧：会话列表 -->
    <SessionSidebar
      :conversations="conversations"
      :active-id="activeConversation?.id ?? null"
      :loading="sessionsLoading"
      @create="startNewConversation"
      @select="openConversation"
      @rename="handleRename"
      @remove="handleDelete"
    />

    <!-- 右侧：对话区 -->
    <section class="chat-panel">
      <header class="chat-head">
        <div class="chat-title">
          <span class="title-text">{{ activeConversation?.title || '新对话' }}</span>
          <span v-if="sending" class="generating-ring" />
        </div>
      </header>

      <el-alert
        v-if="!modelsLoading && !models.length"
        class="model-alert"
        type="warning"
        :closable="false"
        show-icon
        title="还没有可用的 LLM 模型"
      >
        <template #default>
          请先到
          <router-link class="alert-link" to="/models">模型管理</router-link>
          添加并启用一个大模型，再回来对话。
        </template>
      </el-alert>

      <div ref="messageAreaRef" class="message-area">
        <!-- 空会话：欢迎页 + 示例问题 -->
        <div v-if="!messages.length" class="welcome">
          <h1 class="welcome-title">你好，我是你的智能体</h1>
          <p class="welcome-sub">
            支持多轮对话与流式输出，由「模型管理」中配置的大模型驱动
          </p>
          <div class="suggestions">
            <div
              v-for="item in suggestions"
              :key="item.title"
              class="suggestion"
              @click="handleSend(item.prompt)"
            >
              <div class="suggestion-title">{{ item.title }}</div>
              <div class="suggestion-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div v-else class="message-list">
          <MessageItem
            v-for="item in messages"
            :key="item.id"
            :message="item"
            @copy="handleCopy"
          />
        </div>
      </div>

      <footer class="composer-area">
        <div class="composer-inner">
          <ChatComposer
            v-model:draft="draft"
            v-model:model-id="modelId"
            :models="models"
            :models-loading="modelsLoading"
            :disabled="!models.length"
            :streaming="sending"
            @send="handleSend"
            @stop="handleStop"
            @model-change="handleModelChange"
          />
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
// 智能体对话页（参考豆包 / 千问的布局）：
// - 左侧会话列表，右侧对话区；输入框里带模型选择，选完即可发送
// - 发送走 SSE 流式接口：先本地插入"用户消息 + 空助手消息"，再按事件增量填充
// - 会话不在本地新建：点「新建对话」只是清空界面，发出第一条消息时才真正建会话
import { nextTick, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import SessionSidebar from './components/SessionSidebar.vue'
import MessageItem from './components/MessageItem.vue'
import ChatComposer from './components/ChatComposer.vue'
import {
  listConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  listAgentModels,
  streamChat
} from '@/api/agent'

const suggestions = [
  {
    title: '做个自我介绍',
    desc: '向我介绍一下你自己，并说明你能帮我做什么',
    prompt: '请做个自我介绍，说明你能帮我做什么。'
  },
  {
    title: '解释一个概念',
    desc: '用一个生活化的例子解释什么是 Agent',
    prompt: '用一个生活化的例子解释什么是 AI Agent。'
  },
  {
    title: '帮我润色文案',
    desc: '把口语化的表达改得更专业',
    prompt: '帮我把下面这段话改得更专业一些：这个功能挺好用的，就是有点慢。'
  },
  {
    title: '写一段代码',
    desc: '用 Python 实现一个快速排序',
    prompt: '用 Python 写一个快速排序，并解释它的时间复杂度。'
  }
]

const conversations = ref([])
const sessionsLoading = ref(false)
const activeConversation = ref(null) // null 表示"新对话"草稿
const messages = ref([])
const models = ref([])
const modelsLoading = ref(false)
const modelId = ref(null)
const draft = ref('')
const sending = ref(false)
const messageAreaRef = ref(null)
let abortController = null

// 加载可用模型；优先沿用当前会话绑定的模型，否则用默认（列表第一个）
const loadModels = async () => {
  modelsLoading.value = true
  try {
    models.value = (await listAgentModels()) || []
    const bound = activeConversation.value?.model_config_id
    const exists = models.value.some((item) => item.id === bound)
    modelId.value = exists ? bound : (models.value[0]?.id ?? null)
  } finally {
    modelsLoading.value = false
  }
}

// 加载会话列表（新建 / 删除 / 生成完成后都要刷新，保证标题与顺序最新）
const loadConversations = async () => {
  sessionsLoading.value = true
  try {
    conversations.value = (await listConversations()) || []
  } finally {
    sessionsLoading.value = false
  }
}

// 滚动到底部（新消息与流式增量时调用）
const scrollToBottom = async () => {
  await nextTick()
  const el = messageAreaRef.value
  if (el) el.scrollTop = el.scrollHeight
}

// 打开历史会话：拉详情，回填消息与模型
const openConversation = async (id) => {
  if (sending.value) {
    ElMessage.warning('正在生成回复，请先停止生成')
    return
  }
  const detail = await getConversation(id)
  activeConversation.value = detail
  messages.value = (detail.messages || []).map((item) => ({ ...item }))
  if (detail.model_config_id && models.value.some((m) => m.id === detail.model_config_id)) {
    modelId.value = detail.model_config_id
  }
  scrollToBottom()
}

// 新建对话：只清空界面，等第一条消息发出时才真正落库
const startNewConversation = () => {
  if (sending.value) {
    ElMessage.warning('正在生成回复，请先停止生成')
    return
  }
  activeConversation.value = null
  messages.value = []
  draft.value = ''
  modelId.value = models.value[0]?.id ?? null
}

// 确保当前有会话：草稿状态下先创建一条
const ensureConversation = async () => {
  if (activeConversation.value) return activeConversation.value
  const created = await createConversation({ model_config_id: modelId.value })
  activeConversation.value = created
  conversations.value.unshift(created)
  return created
}

// 发送消息：本地占位 → 流式接收 → 事件回填 → 刷新会话列表
const handleSend = async (content) => {
  const text = (content || '').trim()
  if (!text || sending.value) return
  if (!modelId.value) {
    ElMessage.warning('请先到「模型管理」添加并启用一个 LLM 模型')
    return
  }

  let conversation
  try {
    conversation = await ensureConversation()
  } catch {
    return
  }

  draft.value = ''
  // 用 reactive 包裹后再放进数组：否则后续增量更新不会触发视图刷新
  const localUser = reactive({ id: `u-${Date.now()}`, role: 'user', content: text, status: 'success' })
  const localAnswer = reactive({
    id: `a-${Date.now()}`,
    role: 'assistant',
    content: '',
    status: 'streaming'
  })
  messages.value.push(localUser, localAnswer)
  scrollToBottom()

  sending.value = true
  abortController = new AbortController()
  try {
    await streamChat(
      conversation.id,
      { content: text, model_config_id: modelId.value },
      {
        // 用户消息已落库：用后端返回的完整记录替换本地占位
        onStart: (event) => {
          if (event.user_message) Object.assign(localUser, event.user_message)
        },
        onDelta: (piece) => {
          localAnswer.content += piece
          scrollToBottom()
        },
        onDone: (message) => {
          if (message) Object.assign(localAnswer, message)
        },
        onError: (message) => {
          localAnswer.status = 'error'
          localAnswer.error_message = message
          ElMessage.error(message)
        }
      },
      abortController.signal
    )

    // 生成结束后刷新列表（标题可能由首条消息自动生成，排序也会变）
    await loadConversations()
    const latest = conversations.value.find((item) => item.id === conversation.id)
    if (latest && activeConversation.value) {
      activeConversation.value = { ...activeConversation.value, ...latest }
    }
  } catch (error) {
    // 主动停止会抛 AbortError：后端已保存部分内容，这里只更新界面状态
    if (error?.name === 'AbortError') {
      localAnswer.status = 'stopped'
      localAnswer.error_message = '已停止生成'
      loadConversations()
    } else {
      localAnswer.status = 'error'
      localAnswer.error_message = error?.message || '请求失败'
      ElMessage.error(error?.message || '请求失败')
    }
  } finally {
    sending.value = false
    abortController = null
  }
}

// 停止生成：中断 fetch 请求，后端收到取消后会保存已生成内容
const handleStop = () => {
  abortController?.abort()
}

// 切换模型：已有会话时把绑定关系一并保存，下次打开仍是这个模型
const handleModelChange = async (id) => {
  if (!activeConversation.value) return
  try {
    await updateConversation(activeConversation.value.id, { model_config_id: id })
    activeConversation.value.model_config_id = id
  } catch {
    // 错误提示由 request.js 拦截器统一弹出
  }
}

// 复制消息内容到剪贴板
const handleCopy = async (content) => {
  try {
    await navigator.clipboard.writeText(content)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择文本')
  }
}

// 重命名会话
const handleRename = async (item) => {
  try {
    const { value } = await ElMessageBox.prompt('请输入新的会话名称', '重命名', {
      inputValue: item.title,
      inputValidator: (val) => (val && val.trim() ? true : '名称不能为空'),
      confirmButtonText: '保存',
      cancelButtonText: '取消'
    })
    const updated = await updateConversation(item.id, { title: value.trim() })
    item.title = updated.title
    if (activeConversation.value?.id === item.id) {
      activeConversation.value.title = updated.title
    }
    ElMessage.success('已重命名')
  } catch {
    // 取消确认框时 promise 会 reject，忽略即可
  }
}

// 删除会话：二次确认 → 调接口 → 若删的是当前会话则回到新对话
const handleDelete = async (item) => {
  try {
    await ElMessageBox.confirm(`确定删除会话「${item.title}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消'
    })
  } catch {
    return
  }
  await deleteConversation(item.id)
  ElMessage.success('删除成功')
  if (activeConversation.value?.id === item.id) startNewConversation()
  await loadConversations()
}

onMounted(async () => {
  await Promise.all([loadModels(), loadConversations()])
})
</script>

<style scoped lang="scss">
.agent-page {
  display: flex;
  height: 100%;
  background: #fff;
}

.chat-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.chat-head {
  flex: 0 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $gap-md;
  padding: 0 $gap-lg;
  border-bottom: 1px solid $agent-border;

  .chat-title {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    min-width: 0;

    .title-text {
      font-size: 15px;
      font-weight: 600;
      @include ellipsis;
    }

    // 生成中：渐变"彗尾"转圈（conic-gradient + 环形遮罩，比双色描边顺滑）
    .generating-ring {
      flex: 0 0 auto;
      width: 15px;
      height: 15px;
      border-radius: 50%;
      background: conic-gradient(
        from 0deg,
        rgba(107, 124, 255, 0) 0deg,
        rgba(107, 124, 255, 0.2) 100deg,
        $agent-accent 250deg,
        #a06bff 340deg,
        rgba(160, 107, 255, 0) 360deg
      );
      -webkit-mask: radial-gradient(
        farthest-side,
        transparent calc(100% - 3px),
        #000 calc(100% - 3px)
      );
      mask: radial-gradient(
        farthest-side,
        transparent calc(100% - 3px),
        #000 calc(100% - 3px)
      );
      animation: agent-spin 0.9s linear infinite;
    }
  }
}

@keyframes agent-spin {
  to {
    transform: rotate(360deg);
  }
}

// 欢迎标题的渐变流动：只移动背景位置，文字本身不动
@keyframes welcome-flow {
  to {
    background-position: 300% 50%;
  }
}

// 尊重系统「减少动态效果」设置
@media (prefers-reduced-motion: reduce) {
  .welcome .welcome-title {
    animation: none;
  }
}

.model-alert {
  margin: $gap-md $gap-lg 0;
}

.alert-link {
  font-weight: 600;
}

// 滚动容器统一带左右内边距，内部各区块只做居中限宽，
// 这样消息列表 / 欢迎页 / 输入框的左右边界完全对齐
.message-area {
  flex: 1;
  padding: 0 $gap-lg;
  // 经典滚动条只占右侧宽度，会把内容居中轴整体左移半个滚动条宽度（与输入框错位）；
  // both-edges 在两侧对称预留滚动条槽，使居中轴始终与面板中线（即输入框）一致
  scrollbar-gutter: stable both-edges;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.welcome {
  max-width: $agent-content-width;
  margin: 0 auto;
  padding: 84px 0 0;
  text-align: center;

  // 标题用流动渐变文字（background-clip: text），慢速循环，不抢注意力
  .welcome-title {
    margin: 0 0 $gap-md;
    font-size: 32px;
    font-weight: 700;
    letter-spacing: 0.5px;
    background: linear-gradient(100deg, #5f74ff 0%, #8f6bff 30%, #ff7bd5 55%, #8f6bff 80%, #5f74ff 100%);
    background-size: 300% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    color: $agent-accent; // 不支持 background-clip 时兜底
    animation: welcome-flow 9s linear infinite;
  }

  .welcome-sub {
    margin: 0 0 $gap-lg * 1.5;
    font-size: 14px;
    color: $agent-text-muted;
  }
}

.suggestions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $gap-md;

  .suggestion {
    padding: 14px 16px;
    border: 1px solid $agent-border;
    border-radius: $radius-md + 2;
    text-align: left;
    cursor: pointer;
    @include transition(all);

    &:hover {
      border-color: $agent-accent;
      box-shadow: 0 6px 18px rgba(107, 124, 255, 0.12);
      transform: translateY(-1px);
    }

    .suggestion-title {
      font-size: 14px;
      font-weight: 600;
      color: $text-primary;
    }

    .suggestion-desc {
      margin-top: 4px;
      font-size: 12px;
      color: $agent-text-muted;
      @include ellipsis-lines(2);
    }
  }
}

.message-list {
  max-width: $agent-content-width;
  margin: 0 auto;
  padding: $gap-lg 0 $gap-sm;
  display: flex;
  flex-direction: column;
  gap: $gap-lg;
}

.composer-area {
  flex: 0 0 auto;
  padding: $gap-sm $gap-lg $gap-md;

  .composer-inner {
    max-width: $agent-content-width;
    margin: 0 auto;
  }
}
</style>
