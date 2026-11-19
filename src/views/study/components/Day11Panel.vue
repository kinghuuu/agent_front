<template>
  <div class="day11">
    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="Checkpointer 是运行时行为：每跑完一个超步自动存一帧；thread_id 相同就续跑，interrupt() 让图停在帧边界等人——进程可以死，存档活着"
    />

    <!-- 顶部：快照四要素 + 折叠的概念表 -->
    <div class="card-block">
      <div class="block-head">
        <h4>StateSnapshot 四要素（课程 1.3）</h4>
        <el-tag size="small" effect="plain">
          langgraph {{ mapping?.langgraph_version || '…' }} ·
          checkpoint-sqlite {{ mapping?.checkpoint_sqlite_version || '…' }}
        </el-tag>
      </div>
      <el-table :data="mapping?.snapshot_fields || []" size="small" empty-text="加载中…">
        <el-table-column prop="field" label="字段" width="120" />
        <el-table-column prop="what" label="是什么" min-width="240" />
        <el-table-column prop="use" label="用来干什么" min-width="280" show-overflow-tooltip />
      </el-table>

      <el-collapse class="mt">
        <el-collapse-item title="两套暂停机制对照（课程 1.7，面试常考）" name="pause">
          <el-table :data="mapping?.pause_mechanisms || []" size="small">
            <el-table-column prop="dim" label="维度" width="120" />
            <el-table-column prop="dynamic" label="动态中断 interrupt()" min-width="220" />
            <el-table-column prop="static" label="静态断点 interrupt_before" min-width="220" />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="存档器选型：接口一致，换存档器不改节点代码（课程 1.9）" name="savers">
          <el-table :data="mapping?.savers || []" size="small">
            <el-table-column prop="saver" label="存档器" width="220" />
            <el-table-column prop="package" label="包" min-width="220" />
            <el-table-column prop="life" label="寿命" width="140" />
            <el-table-column prop="use" label="用途" min-width="240" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item :title="`六个坑（第 4 节，${pitfalls.length} 条）`" name="pitfalls">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="50" />
            <el-table-column prop="title" label="坑" min-width="200" />
            <el-table-column prop="symptom" label="现象" min-width="220" show-overflow-tooltip />
            <el-table-column prop="fix" label="修法" min-width="260" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="model-bar">
      <span class="label">模型</span>
      <el-select v-model="modelId" placeholder="默认模型" size="small" clearable style="width: 200px">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="muted">①②④⑤ 会真实调用模型；③ 是纯本地重放实验（不花 token）</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 存档与续跑 -->
      <el-tab-pane label="① 存档与续跑" name="basic">
        <div class="card-block">
          <div class="block-head">
            <h4>课程 01：三个实验一次跑完</h4>
            <el-button type="primary" size="small" :loading="basicLoading" @click="doBasic">
              跑三实验
            </el-button>
          </div>
          <p class="hint">
            实验 1 的第二轮只带一条新消息、不传 <code>turns</code>——若最终
            <code>turns=2</code> 且模型记得第一轮，就证明状态活在存档帧里，不是 Python 变量。
          </p>
        </div>

        <template v-if="basicResult">
          <div class="card-block">
            <div class="block-head">
              <h4>实验 1 · 同 thread 续跑</h4>
              <div class="meta-row">
                <el-tag size="small" type="success" effect="plain">turns = {{ basicResult.turns }}</el-tag>
                <el-tag size="small" effect="plain">messages = {{ basicResult.messages_count }}</el-tag>
                <el-tag size="small" effect="plain">{{ basicResult.thread_id }}</el-tag>
                <el-tag size="small" effect="plain">{{ basicResult.model }} · {{ basicResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <p class="line"><span class="muted">第一轮：</span>{{ basicResult.first_reply }}</p>
            <p class="line mt"><span class="muted">第二轮（只带新消息）：</span>{{ basicResult.second_reply }}</p>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>实验 2 · 跨 thread 隔离</h4>
              <el-tag size="small" effect="plain">{{ basicResult.other_thread_id }}</el-tag>
            </div>
            <p class="line">{{ basicResult.isolated_reply }}</p>
            <p class="hint">换了 thread_id 就"失忆"——隔离是按 thread_id 划的，不是按用户。</p>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>实验 3 · get_state 读最近一帧</h4>
              <el-tag size="small" effect="plain">next = {{ formatNext(basicResult.snapshot.next) }}</el-tag>
            </div>
            <el-descriptions :column="1" size="small" border>
              <el-descriptions-item label="values">
                <span class="mono">{{ shortJson(basicResult.snapshot.values) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="next">{{ formatNext(basicResult.snapshot.next) }}</el-descriptions-item>
              <el-descriptions-item label="tasks">
                <span class="mono">{{ shortJson(basicResult.snapshot.tasks) }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="created_at">{{ shortTime(basicResult.snapshot.created_at) }}</el-descriptions-item>
              <el-descriptions-item label="checkpoint_id">
                <span class="mono">{{ basicResult.snapshot.checkpoint_id }}</span>
              </el-descriptions-item>
            </el-descriptions>
            <p class="hint">next 非空 = 图卡在这里；跑完时 next 是空元组。动态中断的载荷在 tasks[0].interrupts 里。</p>
          </div>

          <div class="card-block">
            <h4>历史帧：一超步一帧，帧帧成链（新的在前）</h4>
            <Day11Frames :frames="basicResult.frames" />
          </div>

          <Day10Graph title="记忆型图（一超步一帧）" :structure="basicResult.graph" />
        </template>

        <!-- 交互续聊：同 thread_id 跨请求读档 -->
        <div class="card-block">
          <div class="block-head">
            <h4>交互续跑：同一 thread_id 跨请求读档</h4>
            <div class="meta-row">
              <el-tag size="small" effect="plain">{{ chatThreadId || '（尚未创建）' }}</el-tag>
              <el-switch v-model="chatReset" size="small" active-text="发送前重置会话" />
            </div>
          </div>
          <el-input
            v-model="chatMessage"
            type="textarea"
            :rows="2"
            placeholder="第一轮自我介绍，第二轮追问——两轮之间服务端没有保存任何 Python 变量"
          />
          <div class="row-actions mt">
            <el-button type="primary" size="small" :loading="chatLoading" @click="doChat">
              发送
            </el-button>
            <span class="muted">第一次不传 thread_id（后端生成），之后一直带同一个；重置会先删掉该 thread 的存档</span>
          </div>

          <template v-if="chatResult">
            <pre class="code-block mt">{{ chatResult.reply }}</pre>
            <div class="meta-row mt">
              <el-tag size="small" effect="plain">turns = {{ chatResult.turns }}</el-tag>
              <el-tag size="small" effect="plain">messages = {{ chatResult.messages_count }}</el-tag>
              <el-tag v-if="chatResult.is_new_thread" size="small" type="info" effect="plain">新会话</el-tag>
              <el-tag size="small" effect="plain">{{ chatResult.model }} · {{ chatResult.elapsed_ms }}ms</el-tag>
            </div>
            <el-collapse class="mt">
              <el-collapse-item :title="`快照与历史帧（${chatResult.frames.length} 帧）`" name="chat-frames">
                <el-descriptions :column="1" size="small" border>
                  <el-descriptions-item label="values">
                    <span class="mono">{{ shortJson(chatResult.snapshot.values) }}</span>
                  </el-descriptions-item>
                  <el-descriptions-item label="next">{{ formatNext(chatResult.snapshot.next) }}</el-descriptions-item>
                  <el-descriptions-item label="created_at">{{ shortTime(chatResult.snapshot.created_at) }}</el-descriptions-item>
                </el-descriptions>
                <Day11Frames class="mt" :frames="chatResult.frames" />
              </el-collapse-item>
            </el-collapse>
          </template>
        </div>
      </el-tab-pane>

      <!-- ② 确认门 -->
      <el-tab-pane label="② 确认门（interrupt）" name="approval">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.approval || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="approvalQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="approvalQuestion" type="textarea" :rows="2" placeholder="明确要求退款，模型才会调用敏感工具" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="approvalLoading"
              :disabled="!approvalQuestion.trim()"
              @click="doStartApproval"
            >
              发起（会停在 approval）
            </el-button>
            <span class="muted">命中 refund_order 就 interrupt；图冻结在超步边界，state 已存档</span>
          </div>
        </div>

        <template v-if="approvalStart">
          <div class="card-block">
            <div class="block-head">
              <h4>暂停现场</h4>
              <div class="meta-row">
                <el-tag size="small" :type="approvalStart.paused ? 'warning' : 'success'" effect="plain">
                  {{ approvalStart.paused ? '已暂停' : '未暂停' }}
                </el-tag>
                <el-tag size="small" effect="plain">next = {{ formatNext(approvalStart.next) }}</el-tag>
                <el-tag size="small" effect="plain">{{ approvalStart.model }} · {{ approvalStart.elapsed_ms }}ms</el-tag>
              </div>
            </div>

            <template v-if="approvalStart.paused">
              <el-alert
                type="warning"
                :closable="false"
                :title="approvalStart.interrupt?.prompt || 'interrupt 已发出，等待人工决定'"
              />
              <pre class="code-block mt">{{ JSON.stringify(approvalStart.interrupt, null, 2) }}</pre>
              <el-descriptions class="mt" :column="1" size="small" border>
                <el-descriptions-item label="created_at">{{ shortTime(approvalStart.snapshot.created_at) }}</el-descriptions-item>
                <el-descriptions-item label="checkpoint_id">
                  <span class="mono">{{ approvalStart.snapshot.checkpoint_id }}</span>
                </el-descriptions-item>
                <el-descriptions-item label="thread_id">
                  <span class="mono">{{ approvalStart.thread_id }}</span>
                </el-descriptions-item>
              </el-descriptions>

              <div class="decision-row mt">
                <el-radio-group v-model="approvalDecision" size="small">
                  <el-radio-button value="approve">同意</el-radio-button>
                  <el-radio-button value="reject">拒绝</el-radio-button>
                  <el-radio-button value="patch">改参数放行</el-radio-button>
                </el-radio-group>
                <span v-if="approvalDecision === 'patch'" class="patch-row">
                  <span class="muted">退款金额</span>
                  <el-input-number v-model="approvalAmount" size="small" :min="1" :max="99999" />
                </span>
                <el-button type="primary" size="small" :loading="resumeLoading" @click="doResume">
                  恢复 Command(resume=...)
                </el-button>
              </div>
              <p class="hint">
                恢复时 approval 节点会从头重放——所以这个节点里只有一个 interrupt，零副作用。
              </p>
            </template>
            <p v-else class="line">
              {{ approvalStart.answer || '模型没有调用敏感工具，直接给答案了' }}
            </p>
          </div>
        </template>

        <template v-if="approvalResult">
          <div class="card-block">
            <div class="block-head">
              <h4>恢复结果</h4>
              <div class="meta-row">
                <el-tag size="small" :type="approvalResult.approved ? 'success' : 'danger'" effect="plain">
                  {{ approvalResult.approved ? '已放行' : '已拦截' }}
                </el-tag>
                <el-tag size="small" effect="plain">next = {{ formatNext(approvalResult.next) }}</el-tag>
                <el-tag
                  v-if="Object.keys(approvalResult.patched_args || {}).length"
                  size="small"
                  type="warning"
                  effect="plain"
                >
                  人工改参 {{ shortJson(approvalResult.patched_args) }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ approvalResult.model }} · {{ approvalResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <pre class="code-block">{{ approvalResult.final_answer }}</pre>
            <el-table class="mt" :data="approvalResult.tool_results" size="small">
              <el-table-column prop="tool" label="工具" width="150" />
              <el-table-column label="结果" min-width="280">
                <template #default="{ row }">
                  <span :class="row.blocked ? 'blocked' : 'line'">{{ row.content }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.blocked ? 'danger' : 'success'" effect="plain">
                    {{ row.blocked ? '拦截' : '执行' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <p class="hint">{{ approvalResult.note }}</p>
          </div>
        </template>

        <div class="card-block">
          <div class="block-head">
            <h4>练习 3 · 审批队列与超时自动驳回</h4>
            <div class="meta-row">
              <el-button size="small" @click="loadPending">刷新队列</el-button>
              <el-button size="small" type="danger" plain :loading="expireLoading" @click="doExpire">
                模拟超时自动驳回
              </el-button>
            </div>
          </div>
          <el-table :data="pending" size="small" empty-text="没有待审批的会话（先发起一次）">
            <el-table-column prop="thread_id" label="thread_id" min-width="140" />
            <el-table-column prop="question" label="问题" min-width="220" show-overflow-tooltip />
            <el-table-column prop="tool" label="工具" width="130" />
            <el-table-column label="参数" width="180">
              <template #default="{ row }">
                <span class="mono">{{ shortJson(row.args) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="已等待" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.wait_seconds >= 86400 ? 'danger' : 'info'" effect="plain">
                  {{ row.wait_seconds }}s
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <p class="hint">
            演示按钮把「等待超过 0 秒」都视为超时（等价于生产里 cron 传 86400）；自动驳回同样是
            <code>Command(resume=False)</code>。
          </p>

          <template v-if="expireResult">
            <el-alert
              class="mt"
              type="warning"
              :closable="false"
              :title="`已自动驳回 ${expireResult.expired.length} 个，剩余 ${expireResult.remaining} 个`"
            />
            <div v-for="item in expireResult.expired" :key="item.thread_id" class="expired">
              <el-tag size="small" effect="plain">{{ item.thread_id }} · 等待 {{ item.waited_seconds }}s</el-tag>
              <pre class="code-block mt">{{ item.answer }}</pre>
            </div>
            <p class="hint">{{ expireResult.note }}</p>
          </template>
        </div>
      </el-tab-pane>

      <!-- ③ 节点重放 -->
      <el-tab-pane label="③ 节点重放（坑 1）" name="replay">
        <div class="card-block">
          <div class="block-head">
            <h4>副作用写在 interrupt 之前 vs 之后</h4>
            <el-button type="primary" size="small" :loading="replayLoading" @click="doReplay">
              跑对照实验（不花 token）
            </el-button>
          </div>
          <p class="hint">
            恢复时被 interrupt 的节点会<b>从头重放</b>：interrupt 之前的代码再跑一遍。
            这个实验用本地计数代替真实扣款，观察"暂停前 / 恢复后"各执行了几次。
          </p>
        </div>

        <template v-if="replayResult">
          <div v-for="item in replayResult.experiments" :key="item.key" class="card-block">
            <div class="block-head">
              <h4>{{ item.title }}</h4>
              <div class="meta-row">
                <el-tag size="small" :type="item.after_resume > 1 ? 'danger' : 'success'" effect="plain">
                  暂停前 {{ item.before_resume }} 次 / 恢复后 {{ item.after_resume }} 次
                </el-tag>
              </div>
            </div>
            <p class="hint">{{ item.verdict }}</p>
          </div>

          <div class="card-block">
            <h4>三条铁律</h4>
            <ul class="rule-list">
              <li v-for="rule in replayResult.rules" :key="rule">{{ rule }}</li>
            </ul>
            <p class="hint">{{ replayResult.note }}</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ 时间旅行 -->
      <el-tab-pane label="④ 时间旅行" name="travel">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.time_travel || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="travelTopic = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <div class="form-grid">
            <div class="field">
              <span class="muted">第一次运行的主题</span>
              <el-input v-model="travelTopic" size="small" />
            </div>
            <div class="field">
              <span class="muted">从 answer 之前那一帧改写成的主题</span>
              <el-input v-model="travelNewTopic" size="small" />
            </div>
          </div>
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="travelLoading"
              :disabled="!travelTopic.trim() || !travelNewTopic.trim()"
              @click="doTravel"
            >
              翻历史 → 改参数 → 重跑
            </el-button>
            <span class="muted">get_state_history 选帧 → update_state 分叉 → invoke(None)</span>
          </div>
        </div>

        <template v-if="travelResult">
          <div class="card-block">
            <div class="block-head">
              <h4>两个答案</h4>
              <div class="meta-row">
                <el-tag size="small" :type="travelResult.original_preserved ? 'success' : 'danger'" effect="plain">
                  原历史{{ travelResult.original_preserved ? '仍保留' : '丢失' }}
                </el-tag>
                <el-tag size="small" effect="plain">分叉点 {{ travelResult.fork_checkpoint_id.slice(0, 8) }}…</el-tag>
                <el-tag size="small" effect="plain">{{ travelResult.model }} · {{ travelResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <p class="line"><span class="muted">原始（{{ travelTopic }}）：</span>{{ travelResult.original_answer }}</p>
            <p class="line mt"><span class="muted">改写后（{{ travelNewTopic }}）：</span>{{ travelResult.new_answer }}</p>
            <p class="hint">{{ travelResult.note }}</p>
          </div>

          <div class="card-block">
            <h4>分叉前的历史帧</h4>
            <Day11Frames :frames="travelResult.frames_before" />
          </div>
          <div class="card-block">
            <h4>分叉后：新旧两条链的帧都在</h4>
            <Day11Frames :frames="travelResult.frames_after" />
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ SQLite 重启 -->
      <el-tab-pane label="⑤ SQLite 重启续跑" name="sqlite">
        <div class="card-block">
          <div class="block-head">
            <h4>落盘存档：换连接 ≈ 换进程</h4>
            <div class="meta-row">
              <el-input v-model="sqliteThread" size="small" style="width: 180px" placeholder="thread_id" />
              <el-switch v-model="sqliteReset" size="small" active-text="先删除该 thread" />
            </div>
          </div>
          <div class="row-actions">
            <el-button type="primary" size="small" :loading="sqliteLoading" @click="doSqlite('first')">
              第一轮：写入
            </el-button>
            <el-button size="small" :loading="sqliteLoading" @click="doSqlite('resume')">
              模拟重启后继续
            </el-button>
            <span class="muted">
              每次请求都重开 SQLite 连接并重新编译图；历史从文件读，不在进程内存里
            </span>
          </div>
          <p class="hint">
            真正重启后端后再点「模拟重启后继续」也能接上——这就是 MemorySaver 做不到的事；
            生产多副本再换成 PostgresSaver，接口不变。
          </p>
        </div>

        <template v-if="sqliteResult">
          <div class="card-block">
            <div class="block-head">
              <h4>{{ sqliteResult.mode === 'first' ? '第一轮' : '重启后续跑' }}</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">turns = {{ sqliteResult.turns }}</el-tag>
                <el-tag size="small" effect="plain">messages = {{ sqliteResult.messages_count }}</el-tag>
                <el-tag size="small" effect="plain">{{ sqliteResult.db_size_kb }} KB</el-tag>
                <el-tag size="small" effect="plain">{{ sqliteResult.model }} · {{ sqliteResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <pre class="code-block">{{ sqliteResult.reply }}</pre>
            <p class="hint mono">{{ sqliteResult.db_path }}</p>
            <p class="hint">{{ sqliteResult.note }}</p>
          </div>

          <div class="card-block">
            <h4>文件里的历史帧</h4>
            <Day11Frames :frames="sqliteResult.frames" />
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 11 实验台：Checkpointer 与人机协同——存档续跑 / 确认门 / 节点重放 / 时间旅行 / SQLite 重启
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  chatDay11,
  expireDay11Approvals,
  getDay11Mapping,
  listChatModels,
  listDay11Pending,
  resumeDay11Approval,
  runDay11Basic,
  runDay11Replay,
  runDay11Sqlite,
  runDay11TimeTravel,
  startDay11Approval
} from '@/api/study'
import Day10Graph from './Day10Graph.vue'
import Day11Frames from './Day11Frames.vue'

const mapping = ref(null)
const models = ref([])
const modelId = ref(null)
const subTab = ref('basic')

// ① 存档三实验 + 交互续跑
const basicLoading = ref(false)
const basicResult = ref(null)
const chatThreadId = ref('')
const chatMessage = ref('我叫小胡，最喜欢的数字是 7')
const chatReset = ref(false)
const chatLoading = ref(false)
const chatResult = ref(null)

// ② 确认门
const approvalQuestion = ref('订单 A1001 不想要了，请直接帮我退款 299 元')
const approvalLoading = ref(false)
const approvalStart = ref(null)
const resumeLoading = ref(false)
const approvalResult = ref(null)
const approvalDecision = ref('approve')
const approvalAmount = ref(199)
const pending = ref([])
const expireLoading = ref(false)
const expireResult = ref(null)

// ③ 节点重放
const replayLoading = ref(false)
const replayResult = ref(null)

// ④ 时间旅行
const travelTopic = ref('RAG')
const travelNewTopic = ref('MCP 协议')
const travelLoading = ref(false)
const travelResult = ref(null)

// ⑤ SQLite
const sqliteThread = ref('sqlite-user-42')
const sqliteReset = ref(false)
const sqliteLoading = ref(false)
const sqliteResult = ref(null)

const pitfalls = computed(() => mapping.value?.pitfalls || [])

// 长 JSON 一行显示：表格里只露出开头
const shortJson = (value, limit = 120) => {
  const text = JSON.stringify(value ?? {})
  return text && text.length > limit ? `${text.slice(0, limit)}…` : text
}

// ISO 时间截到秒
const shortTime = (value) => (value ? String(value).slice(0, 19).replace('T', ' ') : '')

// next 为空 = 图已跑完；非空 = 卡在这些节点
const formatNext = (next) => (next && next.length ? next.join(' → ') : '（已跑完）')

// ① 课程 01 三个实验
const doBasic = async () => {
  basicLoading.value = true
  try {
    basicResult.value = await runDay11Basic({ model_config_id: modelId.value || undefined })
  } finally {
    basicLoading.value = false
  }
}

// ① 交互续跑：首次不传 thread_id，之后固定同一个
const doChat = async () => {
  const message = chatMessage.value.trim()
  if (!message) {
    ElMessage.warning('先写一句话')
    return
  }
  chatLoading.value = true
  try {
    const result = await chatDay11({
      message,
      thread_id: chatThreadId.value || undefined,
      reset: chatReset.value,
      model_config_id: modelId.value || undefined
    })
    chatResult.value = result
    chatThreadId.value = result.thread_id
    chatReset.value = false
    chatMessage.value = ''
  } finally {
    chatLoading.value = false
  }
}

// ② 发起审批：命中敏感工具后图会冻结
const doStartApproval = async () => {
  approvalLoading.value = true
  approvalResult.value = null
  expireResult.value = null
  try {
    approvalStart.value = await startDay11Approval({
      question: approvalQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
    if (approvalStart.value.paused) await loadPending()
  } finally {
    approvalLoading.value = false
  }
}

// ② 恢复：true / false / 改过的参数对象
const doResume = async () => {
  if (!approvalStart.value?.thread_id) return
  const decision =
    approvalDecision.value === 'approve'
      ? true
      : approvalDecision.value === 'reject'
        ? false
        : { amount: approvalAmount.value }
  resumeLoading.value = true
  try {
    approvalResult.value = await resumeDay11Approval({
      thread_id: approvalStart.value.thread_id,
      decision,
      model_config_id: modelId.value || undefined
    })
    approvalStart.value = null // 暂停现场已被消费
    await loadPending()
  } finally {
    resumeLoading.value = false
  }
}

// ② 待审批队列
const loadPending = async () => {
  try {
    pending.value = await listDay11Pending()
  } catch {
    // 队列加载失败不阻塞主流程
  }
}

// ② 练习 3：把所有待审批视为超时并自动驳回
const doExpire = async () => {
  expireLoading.value = true
  try {
    expireResult.value = await expireDay11Approvals({
      max_age_seconds: 0,
      model_config_id: modelId.value || undefined
    })
    approvalStart.value = null
    await loadPending()
  } finally {
    expireLoading.value = false
  }
}

// ③ 重放实验（纯本地）
const doReplay = async () => {
  replayLoading.value = true
  try {
    replayResult.value = await runDay11Replay()
  } finally {
    replayLoading.value = false
  }
}

// ④ 时间旅行
const doTravel = async () => {
  travelLoading.value = true
  try {
    travelResult.value = await runDay11TimeTravel({
      topic: travelTopic.value.trim(),
      new_topic: travelNewTopic.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    travelLoading.value = false
  }
}

// ⑤ SQLite：first 写入 / resume 换连接续跑
const doSqlite = async (mode) => {
  sqliteLoading.value = true
  try {
    sqliteResult.value = await runDay11Sqlite({
      mode,
      thread_id: sqliteThread.value.trim() || 'sqlite-user-42',
      reset: sqliteReset.value,
      model_config_id: modelId.value || undefined
    })
    sqliteReset.value = false
  } finally {
    sqliteLoading.value = false
  }
}

onMounted(async () => {
  try {
    mapping.value = await getDay11Mapping()
  } catch {
    // 概念表加载失败不阻塞实验区
  }
  try {
    models.value = await listChatModels()
  } catch {
    // 模型列表失败时后端会给出明确错误
  }
})
</script>

<style lang="scss" scoped>
.day11 {
  .tip {
    margin-bottom: $gap-sm;
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
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: $gap-sm;

    h4 {
      margin: 0;
    }
  }

  .model-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: $gap-sm;

    .label {
      font-size: 12px;
      color: $text-regular;
    }
  }

  .muted {
    font-size: 12px;
    color: $agent-text-muted;
  }

  .hint {
    margin: $gap-sm 0 0;
    font-size: 12px;
    line-height: 1.7;
    color: $agent-text-muted;

    b {
      color: $agent-accent;
    }

    code {
      padding: 0 3px;
      border-radius: 3px;
      background: #f2f3fa;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 11px;
    }
  }

  .mono {
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 11px;
    word-break: break-all;
  }

  .mt {
    margin-top: 8px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 10px;
    align-items: end;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .decision-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
  }

  .patch-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .row-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
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

  .meta-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .line {
    margin: 0;
    font-size: 12px;
    line-height: 1.7;
    color: $text-regular;
    word-break: break-all;
  }

  .blocked {
    font-size: 12px;
    line-height: 1.7;
    color: $danger-color;
  }

  .expired {
    margin-top: 8px;
  }

  .rule-list {
    margin: $gap-sm 0 0;
    padding-left: 18px;
    font-size: 12px;
    line-height: 1.8;
    color: $agent-text-muted;
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
    max-height: 320px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
</style>
