<template>
  <div class="day07">
    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="画像注入，文档检索，事实走工具：三块知识、三条管道，别混成一个 RAG"
    />

    <!-- 用户 ID 由长期记忆与问答共用：画像按 user_id 组织 -->
    <div class="user-bar">
      <span class="label">用户 ID</span>
      <el-input v-model="userId" size="small" style="width: 180px" @change="loadMemory" />
      <el-tag size="small" effect="plain">长期记忆按它隔离，跨会话可召回</el-tag>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 长期记忆 -->
      <el-tab-pane label="① 长期记忆（画像）" name="memory">
        <div class="two-col">
          <div class="card-block">
            <h4>写入事实（同 key 覆盖）</h4>
            <el-input v-model="memKey" size="small" placeholder="key，如 dietary" class="mb" />
            <el-input v-model="memValue" size="small" placeholder="value，如 不吃香菜" class="mb" />
            <el-input-number
              v-model="memSourceTurn"
              size="small"
              :min="1"
              :controls="false"
              placeholder="来源轮次（可选）"
              class="mb full"
            />
            <div class="row-actions">
              <el-button type="primary" size="small" :loading="savingMem" @click="saveMemory">
                写入 / 覆盖
              </el-button>
              <el-button size="small" @click="fillMemoryPreset">填入示例</el-button>
            </div>
            <p class="hint">
              同一 key 再写一次是<strong>覆盖</strong>而不是新增——记忆要跟着用户最新说法走。
            </p>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>事实列表（{{ facts.length }} 条）</h4>
              <el-button v-if="facts.length" link type="danger" size="small" @click="clearAll">
                清空全部
              </el-button>
            </div>
            <el-table :data="facts" size="small" empty-text="暂无记忆">
              <el-table-column prop="key" label="key" width="130" />
              <el-table-column prop="value" label="value" show-overflow-tooltip />
              <el-table-column prop="updated_at" label="更新于" width="130" />
              <el-table-column label="" width="60">
                <template #default="{ row }">
                  <el-button link type="danger" size="small" @click="removeFact(row.key)">
                    遗忘
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <div class="card-block">
          <h4>会话开头注入 system 的画像文本</h4>
          <pre class="code-block">{{ profile?.prompt || '（暂无记忆）' }}</pre>
        </div>

        <div v-if="conflicts.length" class="card-block conflict">
          <h4>同义键冲突（可能自相矛盾）</h4>
          <p v-for="(c, i) in conflicts" :key="i" class="conflict-line">
            {{ c.keys.join(' / ') }}：{{ c.values.join('，') }} → {{ c.suggestion }}
          </p>
        </div>
      </el-tab-pane>

      <!-- ② 知识库 -->
      <el-tab-pane label="② 知识库（RAG）" name="knowledge">
        <div class="card-block">
          <h4>录入文档（按 Markdown 标题切块）</h4>
          <div class="form-grid">
            <el-input v-model="docForm.doc_id" size="small" placeholder="doc_id（重复则整篇重建）" />
            <el-input v-model="docForm.title" size="small" placeholder="文档标题" />
            <el-input v-model="docForm.version" size="small" placeholder="版本，如 2026-10 版" />
            <el-input-number v-model="docForm.chunk_size" size="small" :min="100" :max="2000" :step="50" />
            <el-input-number v-model="docForm.overlap" size="small" :min="0" :max="500" :step="10" />
          </div>
          <el-input v-model="docForm.content" type="textarea" :rows="8" class="mb mt" />
          <div class="row-actions">
            <el-button type="primary" size="small" :loading="indexing" @click="indexDocument">
              建立索引
            </el-button>
            <el-button size="small" @click="applyPresetDoc">填入示例文档</el-button>
          </div>
        </div>

        <div class="card-block">
          <h4>已建索引的文档（{{ docs.length }} 篇）</h4>
          <el-table :data="docs" size="small" empty-text="还没有文档，先录入一篇">
            <el-table-column prop="doc_id" label="doc_id" width="150" />
            <el-table-column prop="doc_title" label="标题" show-overflow-tooltip />
            <el-table-column prop="doc_version" label="版本" width="120" />
            <el-table-column prop="chunks" label="块数" width="70" />
            <el-table-column label="" width="60">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="removeDoc(row.doc_id)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- ③ 检索测试 -->
      <el-tab-pane label="③ 检索测试" name="search">
        <div class="card-block">
          <div class="search-bar">
            <el-input
              v-model="searchQuery"
              size="small"
              placeholder="查询语句，如 XR-500 Pro 保修多久"
              @keyup.enter="doSearch"
            />
            <el-input v-model="searchDocId" size="small" placeholder="只搜某文档（可空）" style="width: 180px" />
            <el-button type="primary" size="small" :loading="searching" @click="doSearch">检索</el-button>
          </div>
          <div class="alpha-row">
            <span>向量路权重 α = {{ searchAlpha }}（其余给 BM25）</span>
            <el-slider v-model="searchAlpha" :min="0" :max="1" :step="0.1" size="small" />
          </div>
        </div>

        <div v-for="(hit, i) in hits" :key="i" class="hit-card">
          <div class="hit-head">
            <el-tag size="small" type="info">#{{ i + 1 }}</el-tag>
            <strong>{{ hit.doc_title }}</strong>
            <span class="muted">{{ hit.doc_version || '' }} · {{ hit.section || '（无章节）' }} · 块{{ hit.chunk_index }}</span>
          </div>
          <p class="hit-content">{{ hit.content }}</p>
          <div class="hit-meta">
            <span>RRF {{ hit.rrf }}</span>
            <span>向量 #{{ hit.vec_rank }}（{{ hit.vec_score }}）</span>
            <span>BM25 #{{ hit.bm25_rank }}（{{ hit.bm25_score }}）</span>
            <el-tag size="small" effect="plain">{{ hit.embedding_source }}</el-tag>
          </div>
        </div>
        <el-empty v-if="!hits.length" description="输入查询后展示混合检索结果" :image-size="60" />
      </el-tab-pane>

      <!-- ④ 组装问答 -->
      <el-tab-pane label="④ 组装问答" name="chat">
        <div class="card-block">
          <div class="preset-row">
            <el-tag v-for="q in presets" :key="q" class="preset" effect="plain" @click="question = q">
              {{ q }}
            </el-tag>
          </div>
          <div class="ask-bar">
            <el-input
              v-model="question"
              type="textarea"
              :rows="2"
              placeholder="问一句需要画像 / 文档 / 工具协作的问题"
              @keydown.enter.exact.prevent="ask"
            />
            <el-button type="primary" :loading="asking" :disabled="!question.trim()" @click="ask">
              提问
            </el-button>
          </div>
        </div>

        <template v-if="chatResult">
          <div class="card-block">
            <h4>最终回答</h4>
            <MarkdownContent :content="chatResult.answer" />
            <div class="meta-row">
              <el-tag size="small" effect="plain">停止原因：{{ chatResult.run.stop_reason }}</el-tag>
              <el-tag size="small" effect="plain">循环步数：{{ chatResult.pipeline.loop_steps }}</el-tag>
              <el-tag size="small" effect="plain">工具调用：{{ chatResult.pipeline.tool_calls }}</el-tag>
              <el-tag size="small" effect="plain">命中块：{{ chatResult.pipeline.retrieved_chunks }}</el-tag>
              <el-tag size="small" effect="plain">画像事实：{{ chatResult.pipeline.profile_facts }}</el-tag>
              <el-tag v-if="chatResult.rewritten_query !== question" size="small" type="warning" effect="plain">
                改写后：{{ chatResult.rewritten_query }}
              </el-tag>
            </div>
          </div>

          <div v-if="chatResult.conflicts.length" class="card-block conflict">
            <h4>冲突裁决提示</h4>
            <p v-for="(c, i) in chatResult.conflicts" :key="i" class="conflict-line">
              {{ c.type }}：用户 {{ c.user_values }} / 资料 {{ c.doc_values }} → {{ c.hint }}
            </p>
          </div>

          <div class="card-block">
            <h4>检索命中（带来源标注）</h4>
            <div v-for="(hit, i) in chatResult.hits" :key="i" class="hit-card inner">
              <div class="hit-head">
                <strong>{{ hit.doc_title }}</strong>
                <span class="muted">{{ hit.section || '' }} · 块{{ hit.chunk_index }}</span>
              </div>
              <p class="hit-content">{{ hit.content }}</p>
            </div>
            <p v-if="!chatResult.hits.length" class="muted">本轮没有检索到资料（Answer 应如实说明）</p>
          </div>

          <div class="card-block">
            <h4>工具调用轨迹（事实类管道）</h4>
            <el-timeline v-if="chatResult.run.steps.length">
              <el-timeline-item
                v-for="(step, i) in chatResult.run.steps"
                :key="i"
                :timestamp="`第 ${step.step} 步`"
              >
                <div v-if="step.tool_calls.length">
                  <div v-for="(call, j) in step.tool_calls" :key="j" class="tool-call">
                    <el-tag size="small">{{ call.name }}</el-tag>
                    <span class="muted">{{ call.duration_ms }}ms</span>
                    <el-tag v-if="call.is_error" size="small" type="danger">{{ call.error_type }}</el-tag>
                    <p class="tool-result">{{ call.result }}</p>
                  </div>
                </div>
                <span v-else class="muted">直接回答：{{ step.content }}</span>
              </el-timeline-item>
            </el-timeline>
            <p v-else class="muted">本轮未调用工具</p>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 07 实验台：长期记忆（画像）/ RAG 知识库 / 混合检索 / 三管道组装问答
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  chatStudyDay07,
  clearStudyMemory,
  deleteStudyDoc,
  forgetStudyMemory,
  getStudyMemory,
  listStudyDocs,
  searchStudyKnowledge,
  upsertStudyDoc,
  writeStudyMemory
} from '@/api/study'
import MarkdownContent from '@/components/MarkdownContent.vue'

// 课程示例文档：三个二级标题，正好演示"按结构切块"
const PRESET_DOC = `## 退款政策（2026-10 版）

自签收之日起 30 天内可无理由退款，运费 10 元由买家承担。

## 会员权益

年卡会员退款免运费，且享 95 折优惠。

## XR-500 Pro 规格

XR-500 Pro 保修期为两年，电池保修一年。
`

// 预设问题覆盖三条管道：文档检索 / 画像 / 冲突 / 工具
const presets = [
  'XR-500 Pro 保修多久？退款要运费吗？',
  '我上次说的忌口是什么？',
  '客服说运费 8 元，这和我该付的一样吗？',
  '我的订单 O20260012 到哪了？'
]

const userId = ref('u001')
const subTab = ref('memory')

// 长期记忆
const profile = ref(null)
const facts = ref([])
const conflicts = ref([])
const memKey = ref('')
const memValue = ref('')
const memSourceTurn = ref(null)
const savingMem = ref(false)

// 知识库
const docs = ref([])
const indexing = ref(false)
const docForm = reactive({
  doc_id: 'policy_2026',
  title: '退款政策与规格手册',
  version: '2026-10 版',
  content: PRESET_DOC,
  chunk_size: 400,
  overlap: 60
})

// 检索测试
const searchQuery = ref('XR-500 Pro 保修多久')
const searchDocId = ref('')
const searchAlpha = ref(0.5)
const hits = ref([])
const searching = ref(false)

// 组装问答
const question = ref(presets[0])
const asking = ref(false)
const chatResult = ref(null)
const history = ref([])

// 加载画像：事实 + 注入文本 + 冲突提示
const loadMemory = async () => {
  if (!userId.value.trim()) return
  const data = await getStudyMemory(userId.value.trim())
  profile.value = data
  facts.value = data.facts
  conflicts.value = data.conflicts
}

// 写入事实：同 key 覆盖
const saveMemory = async () => {
  if (!memKey.value.trim() || !memValue.value.trim()) {
    ElMessage.warning('key 和 value 都要填')
    return
  }
  savingMem.value = true
  try {
    const result = await writeStudyMemory(userId.value.trim(), {
      key: memKey.value.trim(),
      value: memValue.value.trim(),
      source_turn: memSourceTurn.value || undefined
    })
    ElMessage.success(result.created ? '已新增' : '已覆盖同 key 的旧值')
    memKey.value = ''
    memValue.value = ''
    memSourceTurn.value = null
    await loadMemory()
  } finally {
    savingMem.value = false
  }
}

// 一键填入"先吃香菜、再改口不吃"的覆盖示例
const fillMemoryPreset = () => {
  memKey.value = 'dietary'
  memValue.value = '吃香菜'
  memSourceTurn.value = 3
}

// 遗忘一条事实
const removeFact = async (key) => {
  await forgetStudyMemory(userId.value.trim(), key)
  ElMessage.success('已遗忘')
  await loadMemory()
}

// 清空该用户全部记忆
const clearAll = async () => {
  await ElMessageBox.confirm(`确认清空用户 ${userId.value} 的全部长期记忆？`, '提示', {
    type: 'warning'
  })
  const result = await clearStudyMemory(userId.value.trim())
  ElMessage.success(`已清空 ${result.deleted} 条`)
  await loadMemory()
}

// 加载文档列表
const loadDocs = async () => {
  docs.value = await listStudyDocs()
}

// 建索引：切块 + 向量化（失败会自动回退本地哈希）
const indexDocument = async () => {
  if (!docForm.doc_id.trim() || !docForm.title.trim() || !docForm.content.trim()) {
    ElMessage.warning('doc_id / 标题 / 正文都要填')
    return
  }
  indexing.value = true
  try {
    const result = await upsertStudyDoc({
      doc_id: docForm.doc_id.trim(),
      title: docForm.title.trim(),
      content: docForm.content,
      version: docForm.version || undefined,
      chunk_size: docForm.chunk_size,
      overlap: docForm.overlap
    })
    ElMessage.success(`已切 ${result.chunks} 块，向量来源：${result.embedding_source}`)
    await loadDocs()
  } finally {
    indexing.value = false
  }
}

// 填入课程示例文档
const applyPresetDoc = () => {
  docForm.doc_id = 'policy_2026'
  docForm.title = '退款政策与规格手册'
  docForm.version = '2026-10 版'
  docForm.content = PRESET_DOC
}

// 删除整篇文档
const removeDoc = async (docId) => {
  await ElMessageBox.confirm(`确认删除文档 ${docId} 的全部块？`, '提示', { type: 'warning' })
  const result = await deleteStudyDoc(docId)
  ElMessage.success(`已删除 ${result.deleted} 块`)
  await loadDocs()
}

// 混合检索（只检索不生成，便于观察两路排名）
const doSearch = async () => {
  if (!searchQuery.value.trim()) return
  searching.value = true
  try {
    hits.value = await searchStudyKnowledge({
      query: searchQuery.value.trim(),
      top_k: 3,
      alpha: searchAlpha.value,
      doc_id: searchDocId.value.trim() || undefined
    })
  } finally {
    searching.value = false
  }
}

// 三管道问答：画像注入 + RAG 检索 + 工具实时数据
const ask = async () => {
  const text = question.value.trim()
  if (!text || asking.value) return
  asking.value = true
  try {
    const result = await chatStudyDay07({
      user_id: userId.value.trim(),
      message: text,
      history: history.value.slice(-6),
      alpha: searchAlpha.value,
      top_k: 3,
      budget_profile: 'auto'
    })
    chatResult.value = result
    history.value.push(
      { role: 'user', content: text },
      { role: 'assistant', content: result.answer }
    )
    if (history.value.length > 12) history.value = history.value.slice(-12)
  } finally {
    asking.value = false
  }
}

onMounted(async () => {
  await loadMemory()
  await loadDocs()
})
</script>

<style lang="scss" scoped>
.day07 {
  .tip {
    margin-bottom: $gap-sm;
  }

  .user-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: $gap-sm;

    .label {
      font-size: 12px;
      color: $text-regular;
    }
  }

  .two-col {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
    gap: $gap-md;

    @media (max-width: 900px) {
      grid-template-columns: 1fr;
    }
  }

  .card-block {
    padding: $gap-md;
    margin-bottom: $gap-md;
    border: 1px solid #e8e9f0;
    border-radius: $radius-md;
    background: #fff;

    h4 {
      margin: 0 0 $gap-sm;
      font-size: 13px;
      color: $text-primary;
    }
  }

  .block-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: $gap-sm;

    h4 {
      margin: 0;
    }
  }

  .conflict {
    border-color: #f5dab1;
    background: #fffbf5;
  }

  .conflict-line {
    margin: 4px 0;
    font-size: 12px;
    line-height: 1.7;
    color: #a05a00;
  }

  .hint {
    margin: $gap-sm 0 0;
    font-size: 12px;
    line-height: 1.7;
    color: $agent-text-muted;
  }

  .muted {
    font-size: 12px;
    color: $agent-text-muted;
  }

  .mb {
    margin-bottom: 8px;
  }

  .mt {
    margin-top: 8px;
  }

  .full {
    width: 100%;
  }

  .row-actions {
    display: flex;
    gap: 8px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 8px;
  }

  .code-block {
    margin: 0;
    padding: 10px 12px;
    border-radius: $radius-sm;
    background: #f7f8fc;
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 11px;
    line-height: 1.8;
    color: $text-regular;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .search-bar {
    display: flex;
    gap: 8px;
  }

  .alpha-row {
    margin-top: $gap-sm;
    font-size: 12px;
    color: $text-regular;
  }

  .hit-card {
    padding: $gap-sm $gap-md;
    margin-bottom: $gap-sm;
    border: 1px solid #e8e9f0;
    border-radius: $radius-md;
    background: #fff;

    &.inner {
      padding: $gap-sm;
      margin-bottom: 8px;
      background: #fafbfe;
    }
  }

  .hit-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
    margin-bottom: 6px;
    font-size: 12px;
    color: $text-primary;
  }

  .hit-content {
    margin: 0 0 6px;
    font-size: 12px;
    line-height: 1.8;
    color: $text-regular;
    white-space: pre-wrap;
  }

  .hit-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    font-size: 11px;
    color: $agent-text-muted;
  }

  .preset-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-bottom: $gap-sm;

    .preset {
      cursor: pointer;
      font-size: 11px;
    }
  }

  .ask-bar {
    display: flex;
    align-items: flex-end;
    gap: 8px;
  }

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: $gap-sm;
  }

  .tool-call {
    margin-bottom: 8px;

    .tool-result {
      margin: 4px 0 0;
      font-size: 11px;
      line-height: 1.7;
      color: $agent-text-muted;
      word-break: break-all;
    }
  }
}
</style>
