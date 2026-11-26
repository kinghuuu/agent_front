<template>
  <div class="trace">
    <div v-for="(step, index) in steps" :key="index" class="trace-row" :class="step.kind">
      <el-tag size="small" :type="tagType(step.kind)" effect="plain">{{ step.kind }}</el-tag>
      <el-tag v-if="step.channel" size="small" :type="step.channel === 'local' ? 'warning' : 'success'" effect="plain">
        {{ step.channel }}
      </el-tag>
      <span class="name mono">{{ step.name }}</span>
      <span v-if="step.args" class="line mono">{{ JSON.stringify(step.args) }}</span>
      <span v-if="step.content" class="line">{{ step.content }}</span>
    </div>
    <p v-if="!steps || !steps.length" class="muted">（没有轨迹）</p>
  </div>
</template>

<script setup>
// Day 14 轨迹渲染：tool_call / tool_result / answer 三类 + mcp/local 来源标注
// MCP 工具和本地工具在 Agent 眼里没有区别，只能靠 channel 标出来——这正是解耦的证据。
defineProps({
  steps: { type: Array, default: () => [] }
})

const tagType = (kind) => ({ tool_call: 'primary', tool_result: 'success', answer: 'info' })[kind] || 'info'
</script>

<style lang="scss" scoped>
.trace {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 420px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.trace-row {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px;
  padding: 6px 8px;
  border-radius: $radius-sm;
  background: #f9fafd;

  &.tool_result {
    background: #f6fbf7;
  }

  &.answer {
    background: #f7f8ff;
  }
}

.name {
  font-weight: 600;
  color: $text-primary;
}

.line {
  font-size: 12px;
  line-height: 1.7;
  color: $text-regular;
  word-break: break-all;
}

.mono {
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  font-size: 11px;
}

.muted {
  font-size: 12px;
  color: $agent-text-muted;
}
</style>
