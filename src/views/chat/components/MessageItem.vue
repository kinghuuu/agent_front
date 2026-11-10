<template>
  <div class="message-item" :class="isUser ? 'is-user' : 'is-assistant'">
    <div class="message-main">
      <div class="bubble" :class="{ 'bubble-user': isUser }">
        <MarkdownContent :content="displayContent" />
        <div v-if="showError" class="error-tip">
          <el-icon><WarningFilled /></el-icon>{{ message.error_message || '生成失败' }}
        </div>
      </div>

      <div v-if="!isStreaming && message.content" class="message-actions">
        <el-tooltip content="复制" placement="top">
          <el-icon class="action-icon" @click="$emit('copy', message.content)">
            <CopyDocument />
          </el-icon>
        </el-tooltip>
        <span v-if="metaText" class="meta">{{ metaText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
// 单条消息气泡：用户消息靠右、助手消息靠左；正文交给公共组件 MarkdownContent 渲染
import { computed } from 'vue'
import MarkdownContent from '@/components/MarkdownContent.vue'

const props = defineProps({
  message: { type: Object, required: true }
})

defineEmits(['copy'])

const isUser = computed(() => props.message.role === 'user')
const isStreaming = computed(() => props.message.status === 'streaming')
const showError = computed(
  () => props.message.status === 'error' || props.message.status === 'stopped'
)

// 生成中在正文末尾追加一个闪烁光标字符（跟随最后一段文字，不会单独占一行）
const displayContent = computed(() => {
  const content = props.message.content || ''
  return isStreaming.value ? `${content} ▍` : content
})

// 助手消息右下角展示耗时与 token 用量（模型返回 usage 时才有）
const metaText = computed(() => {
  const msg = props.message
  if (isUser.value || isStreaming.value) return ''
  const items = []
  if (msg.latency_ms) items.push(`${(msg.latency_ms / 1000).toFixed(1)}s`)
  if (msg.completion_tokens) items.push(`${msg.completion_tokens} tokens`)
  return items.join(' · ')
})
</script>

<style scoped lang="scss">
.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  &.is-user {
    flex-direction: row-reverse;
  }
}

.message-main {
  max-width: 80%;
  min-width: 0;
}

.bubble {
  position: relative;
  padding: 12px 16px;
  border-radius: 14px;
  background: $agent-assistant-bubble;
  color: $text-primary;
  font-size: 15px;
  line-height: 1.75;
  word-break: break-word;

  &-user {
    background: $agent-user-bubble;
  }

  .error-tip {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 6px;
    font-size: 12px;
    color: $danger-color;
  }
}

.message-actions {
  display: flex;
  align-items: center;
  gap: $gap-sm;
  margin-top: 6px;
  height: 18px;
  opacity: 0;
  @include transition(opacity);

  .message-item:hover & {
    opacity: 1;
  }

  // 用户消息靠右，操作行也跟着贴右边
  .is-user & {
    justify-content: flex-end;
  }

  .action-icon {
    color: $text-secondary;
    font-size: 14px;
    cursor: pointer;

    &:hover {
      color: $agent-accent;
    }
  }

  .meta {
    font-size: 12px;
    color: $agent-text-muted;
  }
}
</style>
