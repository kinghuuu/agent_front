<template>
  <aside class="session-panel">
    <div class="panel-head">
      <el-button class="new-btn" type="primary" @click="$emit('create')">
        <el-icon class="btn-icon"><Plus /></el-icon>新建对话
      </el-button>
    </div>

    <div v-loading="loading" class="session-list">
      <div
        v-for="item in conversations"
        :key="item.id"
        class="session-item"
        :class="{ active: item.id === activeId }"
        @click="$emit('select', item.id)"
      >
        <div class="session-body">
          <div class="session-title">{{ item.title }}</div>
          <div class="session-time">{{ formatTime(item.updated_at) }}</div>
        </div>
        <div class="session-actions" @click.stop>
          <el-tooltip content="重命名" placement="top">
            <el-icon class="action-icon" @click="$emit('rename', item)"
              ><Edit
            /></el-icon>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-icon class="action-icon danger" @click="$emit('remove', item)">
              <Delete />
            </el-icon>
          </el-tooltip>
        </div>
      </div>

      <el-empty
        v-if="!loading && !conversations.length"
        description="还没有对话，点上面「新建对话」开始"
        :image-size="60"
      />
    </div>
  </aside>
</template>

<script setup>
// 会话侧边栏：展示会话列表，重命名/删除按钮只在悬停时出现（与豆包、千问的交互一致）
defineProps({
  conversations: { type: Array, default: () => [] },
  activeId: { type: Number, default: null },
  loading: { type: Boolean, default: false },
});

defineEmits(["create", "select", "rename", "remove"]);

// 会话时间展示：当天只显示时分，其它日期显示月/日
const formatTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
};
</script>

<style scoped lang="scss">
.session-panel {
  width: 260px;
  flex: 0 0 260px;
  display: flex;
  flex-direction: column;
  height: 100%;
  background: $agent-panel-bg;
  border-right: 1px solid $agent-border;
}

.panel-head {
  padding: $gap-md;
  border-bottom: 1px solid $agent-border;

  .panel-title {
    font-size: 12px;
    color: $agent-text-muted;
    letter-spacing: 1px;
    margin-bottom: $gap-sm;
  }

  .new-btn {
    width: 100%;
  }
}

.btn-icon {
  margin-right: 4px;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: $gap-sm;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: $radius-md;
  cursor: pointer;
  @include transition(background-color);

  &:hover {
    background: #eef0f8;
  }

  &.active {
    background: #fff;
    box-shadow: 0 1px 6px rgba(31, 45, 61, 0.08);
  }

  .session-body {
    flex: 1;
    min-width: 0;
  }

  .session-title {
    font-size: 14px;
    color: $text-primary;
    @include ellipsis;
  }

  .session-time {
    margin-top: 2px;
    font-size: 12px;
    color: $agent-text-muted;
  }

  .session-actions {
    display: none;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;

    .action-icon {
      color: $text-secondary;
      font-size: 14px;

      &:hover {
        color: $agent-accent;
      }

      &.danger:hover {
        color: $danger-color;
      }
    }
  }

  &:hover .session-actions {
    display: flex;
  }
}
</style>
