<template>
  <!-- 历史帧表格：get_state_history 的原始列表（新的在前），记录 checkpoint_id 与那一帧的 next -->
  <el-table :data="frames" size="small" empty-text="还没有历史帧">
    <el-table-column prop="index" label="帧" width="60" />
    <el-table-column label="next" width="150">
      <template #default="{ row }">
        <el-tag v-if="row.next && row.next.length" size="small" type="warning" effect="plain">
          {{ row.next.join(' → ') }}
        </el-tag>
        <span v-else class="muted">（已跑完）</span>
      </template>
    </el-table-column>
    <el-table-column label="state（除 messages）" min-width="200">
      <template #default="{ row }">
        <span class="mono">{{ shortJson(row.values) }}</span>
      </template>
    </el-table-column>
    <el-table-column prop="messages_count" label="消息数" width="80" />
    <el-table-column label="created_at" width="160">
      <template #default="{ row }">
        <span class="mono">{{ shortTime(row.created_at) }}</span>
      </template>
    </el-table-column>
  </el-table>
</template>

<script setup>
// 历史帧表格：时间旅行 / 快照观察共用，避免在每个实验区重复写同样的表格
defineProps({
  frames: { type: Array, default: () => [] }
})

// 长 JSON 一行显示：表格里只露出开头
const shortJson = (value) => {
  const text = JSON.stringify(value ?? {})
  return text && text.length > 90 ? `${text.slice(0, 90)}…` : text
}

// ISO 时间截到秒，表格里更好读
const shortTime = (value) => (value ? String(value).slice(0, 19).replace('T', ' ') : '')
</script>

<style lang="scss" scoped>
.mono {
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  font-size: 11px;
  word-break: break-all;
}

.muted {
  font-size: 12px;
  color: $agent-text-muted;
}
</style>
