<template>
  <div class="composer" :class="{ disabled }">
    <el-input
      v-model="text"
      class="composer-input"
      type="textarea"
      resize="none"
      :autosize="{ minRows: 1, maxRows: 6 }"
      :disabled="disabled"
      placeholder="输入你想问的内容，Enter 发送，Shift + Enter 换行"
      @keydown="handleKeydown"
      @compositionstart="composing = true"
      @compositionend="composing = false"
    />

    <div class="composer-bar">
      <!-- 左侧：能力选择区（模型，后续的知识库等选择器也加在这里） -->
      <div class="composer-tools">
        <el-select
          v-model="selectedModelId"
          class="model-select"
          size="small"
          placeholder="选择模型"
          :loading="modelsLoading"
          :disabled="disabled"
          @change="$emit('model-change', $event)"
        >
          <el-option
            v-for="item in models"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          >
            <span class="option-name">{{ item.name }}</span>
            <span class="option-sub">{{ item.model_name }}</span>
          </el-option>
        </el-select>
      </div>

      <!-- 右侧：纯图标圆按钮（发送 / 停止生成），文案放在 tooltip 里 -->
      <el-tooltip v-if="streaming" content="停止生成" placement="top">
        <button class="round-btn stop-btn" type="button" @click="$emit('stop')">
          <el-icon><VideoPause /></el-icon>
        </button>
      </el-tooltip>
      <el-tooltip v-else content="发送" placement="top">
        <button
          class="round-btn send-btn"
          type="button"
          :disabled="disabled || !text.trim()"
          @click="submit"
        >
          <el-icon><Promotion /></el-icon>
        </button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup>
// 输入框：受控组件（v-model:draft / v-model:model-id 由页面持有），
// 负责回车发送、输入法保护、发送/停止按钮切换，以及模型等能力选择器
import { computed, ref } from "vue";

const props = defineProps({
  draft: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  streaming: { type: Boolean, default: false },
  models: { type: Array, default: () => [] },
  modelId: { type: Number, default: null },
  modelsLoading: { type: Boolean, default: false },
});

const emit = defineEmits([
  "update:draft",
  "update:modelId",
  "model-change",
  "send",
  "stop",
]);

// 中文输入法选词时按回车不能触发发送，用 composing 标记屏蔽
const composing = ref(false);

const text = computed({
  get: () => props.draft,
  set: (value) => emit("update:draft", value),
});

// 模型选择：对外仍是 v-model:model-id，选中后再额外抛 model-change 供页面做持久化
const selectedModelId = computed({
  get: () => props.modelId,
  set: (value) => emit("update:modelId", value),
});

// 提交：内容非空才发送，发送后由页面清空 draft
const submit = () => {
  const content = text.value.trim();
  if (!content || props.disabled || props.streaming) return;
  emit("send", content);
};

// Enter 发送、Shift + Enter 换行；输入法组合中不拦截
const handleKeydown = (event) => {
  if (
    event.key !== "Enter" ||
    event.shiftKey ||
    event.isComposing ||
    composing.value
  )
    return;
  event.preventDefault();
  submit();
};
</script>

<style scoped lang="scss">
.composer {
  border: 1px solid $agent-border;
  border-radius: 18px;
  background: #fff;
  padding: 8px 10px 8px 14px;
  box-shadow: 0 2px 10px rgba(31, 45, 61, 0.04);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;

  &:hover {
    border-color: #dfe3ee;
  }

  &:focus-within {
    border-color: rgba(107, 124, 255, 0.55);
    box-shadow: 0 6px 22px rgba(107, 124, 255, 0.14);
  }

  &.disabled {
    background: $agent-panel-bg;
  }
}

.composer-input {
  :deep(.el-textarea__inner) {
    border: none;
    box-shadow: none;
    padding: 6px 2px;
    font-size: 15px;
    line-height: 1.7;
    color: $text-primary;
    background: transparent;

    &::placeholder {
      color: #a8afc4;
    }
  }
}

.composer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $gap-md;
  margin-top: 2px;

  .composer-tools {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  // 模型选择做成"无边框小胶囊"，弱化成辅助控件
  .model-select {
    width: 168px;

    :deep(.el-select__wrapper) {
      min-height: 26px;
      padding: 2px 8px;
      background: $agent-panel-bg;
      border-radius: 9px;
      box-shadow: none;
      transition:
        background-color 0.2s ease,
        box-shadow 0.2s ease;

      &:hover {
        background: #eef0f8;
      }

      &.is-focused {
        background: #fff;
        box-shadow: 0 0 0 1px rgba(107, 124, 255, 0.45) inset;
      }
    }

    :deep(.el-select__placeholder) {
      font-size: 12px;
      color: $agent-text-muted;
    }

    :deep(.el-select__selected-item) {
      font-size: 13px;
    }
  }

  .option-name {
    margin-right: $gap-sm;
  }

  .option-sub {
    font-size: 12px;
    color: $text-secondary;
  }
}

// 圆形图标按钮：发送用主题渐变，停止用淡紫底
.round-btn {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  font-size: 17px;
  cursor: pointer;
  @include transition(all);

  &:active {
    transform: scale(0.94);
  }

  &.send-btn {
    color: #fff;
    background: $agent-gradient;
    box-shadow: 0 4px 12px rgba(107, 124, 255, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(107, 124, 255, 0.38);
    }

    &:disabled {
      color: #b8bfd1;
      background: #e8ebf3;
      box-shadow: none;
      cursor: not-allowed;
    }
  }

  &.stop-btn {
    color: $agent-accent;
    background: rgba(107, 124, 255, 0.12);

    &:hover {
      background: rgba(107, 124, 255, 0.2);
      transform: translateY(-1px);
    }
  }
}
</style>
