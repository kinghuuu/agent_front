<template>
  <div>
    <!-- 运行表单 -->
    <div class="run-form">
      <div class="mode-row">
        <span class="form-label">抽取方案：</span>
        <el-radio-group v-model="mode">
          <el-radio-button value="naive">① 口头要求（反面教材）</el-radio-button>
          <el-radio-button value="json_mode">② JSON Mode</el-radio-button>
          <el-radio-button value="json_schema">③ Pydantic Schema</el-radio-button>
        </el-radio-group>
      </div>
      <el-alert class="mode-tip" :title="modeInfo[mode]" type="info" :closable="false" show-icon />

      <div class="preset-row">
        <span class="preset-label">快捷输入：</span>
        <el-tag
          v-for="q in presets"
          :key="q"
          class="preset-tag"
          effect="plain"
          @click="text = q"
        >
          {{ q }}
        </el-tag>
      </div>

      <el-input
        v-model="text"
        type="textarea"
        :rows="3"
        placeholder="输入一段客户原话，例如：我是李雷，联系 13911112222，买的杯子碎了，必须退款！很急！"
      />

      <div class="form-row">
        <div class="form-item">
          <span class="form-label">失败重试次数</span>
          <el-input-number v-model="maxRetries" :min="0" :max="3" />
          <span class="form-hint">解析失败时把"错误现场"回填进消息再重试</span>
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
        <el-button type="primary" :loading="loading" @click="handleRun">
          {{ loading ? '抽取中...' : '开始抽取' }}
        </el-button>
      </div>
    </div>

    <!-- 尝试轨迹 -->
    <div v-if="result" class="trace">
      <el-alert
        v-if="!result.success"
        type="error"
        :closable="false"
        show-icon
        title="连续重试后仍未拿到合法结果——这正是没有'合同'（Schema）约束时的真实世界，程序宁缺毋滥，绝不编造"
      />

      <h3 class="trace-title">尝试轨迹（观察"失败现场回填"如何让模型自我修正）</h3>
      <el-timeline>
        <el-timeline-item
          v-for="a in result.attempts"
          :key="a.attempt"
          :type="a.error ? 'danger' : 'success'"
          :timestamp="`Attempt ${a.attempt}`"
          placement="top"
        >
          <div class="attempt-head">
            <el-tag size="small" effect="plain">输出约束：{{ a.response_format }}</el-tag>
            <el-tag v-if="a.error" size="small" type="danger" effect="plain">解析/校验失败</el-tag>
            <el-tag v-else size="small" type="success" effect="plain">通过</el-tag>
          </div>
          <el-alert
            v-if="a.note"
            class="attempt-note"
            :title="a.note"
            type="warning"
            :closable="false"
            show-icon
          />
          <pre class="attempt-raw">{{ a.raw_content }}</pre>
          <el-alert
            v-if="a.error"
            class="attempt-note"
            :title="a.error"
            type="error"
            :closable="false"
          />
        </el-timeline-item>
      </el-timeline>

      <!-- 最终工单 -->
      <div v-if="result.ticket" class="ticket-card">
        <h3 class="trace-title">抽取结果 <el-tag size="small" effect="plain">{{ result.model }}</el-tag></h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="客户姓名">{{ result.ticket.name }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ result.ticket.phone || '—' }}</el-descriptions-item>
          <el-descriptions-item label="意图分类">
            <el-tag size="small" type="primary">{{ result.ticket.intent }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="紧急程度">{{ result.ticket.urgency }} / 5</el-descriptions-item>
          <el-descriptions-item label="涉及商品" :span="2">
            <template v-if="result.ticket.items && result.ticket.items.length">
              <el-tag
                v-for="(item, i) in result.ticket.items"
                :key="i"
                size="small"
                effect="plain"
                class="item-tag"
              >
                {{ item.product }} × {{ item.quantity }}
              </el-tag>
            </template>
            <span v-else>—</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </div>
  </div>
</template>

<script setup>
// Day 02 结构化输出实验区：
// 输入客户原话 → 选择三级方案之一 → 后端抽取 → 前端展示尝试轨迹与最终工单
// 三级方案的核心差异：谁只保证"合法 JSON"，谁真正保证"字段/类型/取值范围"
import { onMounted, ref } from 'vue'
import { listChatModels, runStudyExtract } from '@/api/study'

// 三种方案的说明文案：切换单选时展示，帮助理解"为什么口头约定不是合同"
const modeInfo = {
  naive: '反面教材：只在 prompt 里口头要求"请输出 JSON"，无任何 API 级约束、不重试。模型爱加"好的，以下是 JSON："之类的废话，json.loads 直接崩。',
  json_mode: 'JSON Mode：response_format=json_object 从解码层保证合法 JSON；解析失败时把"错误输出 + 报错"回填进消息再重试。但只保证合法，不保证字段名/类型对。',
  json_schema: 'Pydantic Schema：prompt 里下发字段定义 + 服务端支持时用 json_schema 严格约束 + Pydantic 验收字段/类型/枚举/范围，失败同样回填重试。生产 Agent 的标准做法。'
}

// 预设输入覆盖不同意图与嵌套商品场景，方便对比 urgency 打分与 items 抽取效果
const presets = [
  '我叫王小明，手机 13800138000，我的订单还没发货，再不发货我就投诉了！',
  '我是李雷，联系 13911112222，买的杯子碎了，必须退款！很急！',
  '你好，想问一下你们这款衬衫有没有 XL 码',
  '上周买的蓝牙耳机左边不响，给我换一个吧',
  '帮我买了 3 盒茶叶和一个茶壶，物流太慢了，差评'
]

const mode = ref('json_schema')
const text = ref(presets[1])
const maxRetries = ref(2)
const modelId = ref(null)
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
  if (!text.value.trim()) return
  loading.value = true
  result.value = null
  try {
    result.value = await runStudyExtract({
      text: text.value.trim(),
      mode: mode.value,
      max_retries: maxRetries.value,
      model_config_id: modelId.value || undefined
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.run-form {
  .mode-row {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: $gap-sm;

    .form-label {
      font-size: 13px;
      color: $text-regular;
    }
  }

  .mode-tip {
    margin-bottom: $gap-md;
  }

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

  .attempt-head {
    display: flex;
    gap: 8px;
    margin-bottom: 6px;
  }

  .attempt-note {
    margin-top: 6px;
  }

  .attempt-raw {
    margin: 6px 0 0;
    padding: $gap-sm $gap-md;
    border-radius: $radius-md;
    background: #f7f8fc;
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 12px;
    line-height: 1.6;
    color: $text-regular;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .ticket-card {
    margin-top: $gap-md;
    padding: $gap-md $gap-lg;
    border-radius: $radius-md;
    background: $agent-assistant-bubble;

    .item-tag {
      margin-right: 6px;
    }
  }
}
</style>
