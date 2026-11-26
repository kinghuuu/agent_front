<template>
  <div class="day14">
    <el-alert
      class="tip"
      type="success"
      :closable="false"
      show-icon
      title="MCP 不是『又一个工具框架』：它只把「工具怎么被发现、怎么被传输、怎么被调用」标准化。模型怎么选工具，仍然是 Day 03 的 Function Calling"
    />

    <!-- 概念区 -->
    <div class="card-block">
      <div class="block-head">
        <h4>为什么非有 MCP 不可（课程 1.1：M×N → M+N）</h4>
        <div class="meta-row">
          <el-tag size="small" effect="plain">mcp {{ versions.mcp }}</el-tag>
          <el-tag size="small" effect="plain">adapters {{ versions['langchain-mcp-adapters'] }}</el-tag>
          <el-tag size="small" effect="plain">langgraph {{ versions.langgraph }}</el-tag>
        </div>
      </div>
      <div class="grid-2">
        <div class="sub-card bad">
          <h5>没有统一协议：M×N 套集成</h5>
          <p class="mono">{{ mapping?.mxn?.problem }}</p>
          <ul class="rule-list">
            <li v-for="item in mapping?.mxn?.pain_points || []" :key="item">{{ item }}</li>
          </ul>
        </div>
        <div class="sub-card ok">
          <h5>有 MCP：M+N</h5>
          <p class="mono">{{ mapping?.mxn?.solution }}</p>
          <p class="hint">{{ mapping?.mxn?.value }}</p>
        </div>
      </div>
    </div>

    <div class="card-block">
      <h4>FC 与 MCP 的分工（最容易混的一件事）</h4>
      <el-table :data="mapping?.fc_vs_mcp || []" size="small" empty-text="加载中…">
        <el-table-column prop="dimension" label="维度" width="120" />
        <el-table-column label="Function Calling（Day 03）" min-width="230">
          <template #default="{ row }">
            <span class="line">{{ row.fc }}</span>
          </template>
        </el-table-column>
        <el-table-column label="MCP（今天）" min-width="280">
          <template #default="{ row }">
            <span class="line">{{ row.mcp }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card-block">
      <h4>架构三角色 + 两种传输（课程 1.3）</h4>
      <el-table :data="mapping?.roles || []" size="small">
        <el-table-column prop="role" label="角色" width="90" />
        <el-table-column prop="who" label="是谁" min-width="220" />
        <el-table-column prop="duty" label="负责什么" min-width="320" />
      </el-table>
      <el-table class="mt" :data="mapping?.transports || []" size="small">
        <el-table-column prop="transport" label="传输" width="150" />
        <el-table-column prop="scene" label="场景" min-width="240" />
        <el-table-column prop="launch" label="谁拉起" width="170" />
        <el-table-column prop="lifecycle" label="生命周期" min-width="190" />
        <el-table-column prop="config" label="配置写法" width="170" />
      </el-table>
      <p class="hint">
        stdio 不是常驻服务：客户端每开一个会话就 spawn 一个子进程；要团队共享就得换成 streamable-http。
      </p>
    </div>

    <div class="card-block">
      <el-collapse>
        <el-collapse-item title="Server 的三种原语（Tools / Resources / Prompts）" name="primitives">
          <el-table :data="mapping?.primitives || []" size="small">
            <el-table-column prop="primitive" label="原语" width="190" />
            <el-table-column prop="decorator" label="装饰器" width="200" />
            <el-table-column prop="job" label="干什么" min-width="240" />
            <el-table-column prop="maps_to" label="对应已学的" min-width="240" />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="迁移对照：Day 03 进程内 → Day 14 MCP Server" name="migration">
          <el-table :data="mapping?.migration || []" size="small">
            <el-table-column prop="day03" label="Day 03（进程内）" min-width="220" />
            <el-table-column prop="day14" label="Day 14（MCP Server）" min-width="240" />
            <el-table-column prop="why" label="为什么这么改" min-width="240" />
          </el-table>
        </el-collapse-item>
        <el-collapse-item :title="`五个常见坑（第 4 节，${pitfalls.length} 条）`" name="pitfalls">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="46" />
            <el-table-column prop="title" label="坑" width="200" />
            <el-table-column prop="symptom" label="现象" min-width="260" />
            <el-table-column prop="fix" label="修法" min-width="320" />
          </el-table>
          <p class="hint">第 1 条坑有专门的现场实验：见「⑤ HTTP 服务与 stdout 坑」。</p>
        </el-collapse-item>
        <el-collapse-item title="速查表 + 今日必掌握清单" name="cheat">
          <el-table :data="mapping?.cheatsheet || []" size="small">
            <el-table-column prop="topic" label="主题" width="140" />
            <el-table-column prop="content" label="内容" min-width="480">
              <template #default="{ row }">
                <span class="line">{{ row.content }}</span>
              </template>
            </el-table-column>
          </el-table>
          <ul class="rule-list">
            <li v-for="item in mapping?.checklist || []" :key="item">{{ item }}</li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="model-bar">
      <span class="label">模型</span>
      <el-select v-model="modelId" placeholder="默认模型" size="small" clearable style="width: 200px">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="muted">①②⑤ 不调模型；③④ 会真实调用模型</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 工具发现 -->
      <el-tab-pane label="① 工具发现" name="discover">
        <div class="card-block">
          <div class="row-actions">
            <el-button type="primary" size="small" :loading="discoverLoading" @click="doDiscover">
              拉起两个 stdio Server
            </el-button>
            <span class="muted">真实 spawn 子进程：initialize → tools/list → resources/list → get_tools()</span>
          </div>
        </div>

        <template v-if="discover">
          <div class="card-block">
            <div class="block-head">
              <h4>握手现场</h4>
              <div class="meta-row">
                <el-tag size="small" type="warning" effect="plain">spawn {{ discover.spawn_count }} 个子进程</el-tag>
                <el-tag size="small" effect="plain">共 {{ discover.total_tools }} 个工具</el-tag>
                <el-tag size="small" effect="plain">{{ discover.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <div class="event-list">
              <div v-for="(step, index) in discover.handshake" :key="index" class="event-row">
                <el-tag size="small" type="primary" effect="plain">{{ index + 1 }}</el-tag>
                <span class="mono">{{ step.step }}</span>
                <span class="line">{{ step.detail }}</span>
              </div>
            </div>
            <p class="hint">{{ discover.bridge_note }}</p>
            <p class="hint">{{ discover.note }}</p>
          </div>

          <div v-for="server in discover.servers" :key="server.key" class="card-block">
            <div class="block-head">
              <h4>{{ server.key }} · {{ server.script }}</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">协议会话 {{ server.session_ms }}ms</el-tag>
                <el-tag size="small" effect="plain">adapter {{ server.adapted_ms }}ms</el-tag>
              </div>
            </div>

            <h5>协议视角：tools/list 的原始 inputSchema</h5>
            <el-table :data="server.tools" size="small">
              <el-table-column prop="name" label="工具" width="150" />
              <el-table-column label="参数（* 必填）" width="230">
                <template #default="{ row }">
                  <el-tag
                    v-for="param in row.params"
                    :key="param.name"
                    size="small"
                    :type="param.required ? 'danger' : 'info'"
                    effect="plain"
                    class="param-tag"
                  >
                    {{ param.name }}:{{ param.type }}{{ param.required ? '*' : '' }}
                  </el-tag>
                  <span v-if="!row.params.length" class="muted">（无参数）</span>
                </template>
              </el-table-column>
              <el-table-column label="description（docstring 原样透传）" min-width="340">
                <template #default="{ row }">
                  <span class="line">{{ row.description }}</span>
                </template>
              </el-table-column>
            </el-table>

            <div class="grid-2 mt">
              <div class="sub-card">
                <h5>Resources（宿主直读，不占模型注意力）</h5>
                <div v-if="server.resources.length" class="event-list">
                  <div v-for="item in server.resources" :key="item.uri" class="event-row">
                    <span class="mono">{{ item.uri }}</span>
                    <span class="line">{{ item.description || item.name }}</span>
                  </div>
                </div>
                <p v-else class="muted">这个 Server 没注册资源（只读工具也能跑）</p>
              </div>
              <div class="sub-card">
                <h5>Prompts（用户选择触发）</h5>
                <div v-if="server.prompts.length" class="event-list">
                  <div v-for="item in server.prompts" :key="item.name" class="event-row">
                    <span class="mono">{{ item.name }}</span>
                    <span class="line">
                      {{ item.description }}
                      <template v-if="item.arguments.length">｜参数：{{ item.arguments.join(', ') }}</template>
                    </span>
                  </div>
                </div>
                <p v-else class="muted">这个 Server 没注册提示词模板</p>
              </div>
            </div>

            <h5 class="mt">LangChain 视角：get_tools() 转换后（模型真正看到的）</h5>
            <div class="chips">
              <el-tag v-for="tool in server.adapted" :key="tool.name" size="small" type="success" effect="plain">
                {{ tool.name }}({{ tool.params.map((p) => p.name).join(', ') }})
              </el-tag>
            </div>
            <p class="hint">{{ server.note }}</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ② 直接调用 -->
      <el-tab-pane label="② 直接调用 tools/call" name="call">
        <div class="card-block">
          <h4>不经过模型，直接问 Server：这就是 tools/call 帧</h4>
          <div class="row-actions mt">
            <el-select v-model="callServer" size="small" style="width: 150px" @change="onCallServerChange">
              <el-option label="docs（只读检索）" value="docs" />
              <el-option label="crm（读写）" value="crm" />
            </el-select>
            <el-select v-model="callTool" size="small" style="width: 200px">
              <el-option v-for="name in toolOptions[callServer] || []" :key="name" :label="name" :value="name" />
            </el-select>
            <el-button type="primary" size="small" :loading="callLoading" @click="doCall">发 tools/call</el-button>
          </div>

          <div class="preset-row mt">
            <el-tag
              v-for="preset in callPresets"
              :key="preset.label"
              class="preset"
              effect="plain"
              @click="applyPreset(preset)"
            >
              {{ preset.label }}
            </el-tag>
          </div>

          <el-input
            v-model="callArguments"
            class="mt"
            type="textarea"
            :rows="3"
            placeholder='{"customer_id": "C001", "amount": 100}'
          />
          <p class="hint">参数就是 MCP tools/call 里的 arguments 对象；写错 JSON 会当场提示，不会打到后端。</p>
        </div>

        <div v-if="callResult" class="card-block">
          <div class="block-head">
            <h4>调用结果</h4>
            <div class="meta-row">
              <el-tag size="small" effect="plain">{{ callResult.server }} / {{ callResult.tool }}</el-tag>
              <el-tag size="small" :type="callResult.is_error ? 'danger' : 'success'" effect="plain">
                isError = {{ callResult.is_error }}
              </el-tag>
              <el-tag size="small" effect="plain">{{ callResult.elapsed_ms }}ms</el-tag>
            </div>
          </div>
          <pre class="code-block">{{ callResult.content.join('\n') }}</pre>
          <p class="hint">{{ callResult.note }}</p>
          <p class="hint">
            注意 isError 是 false：扣款失败属「业务校验」，Server 把它写成文本结果返回——这行文字就是模型下一轮的
            prompt，它会据此改道（看 ④ 的转人工）。
          </p>
        </div>

        <div v-if="!callResult" class="card-block">
          <p class="hint">建议按顺序点三个预设：正常扣款 100 → 余额不足 5000 → 金额非法 -1，看 Server 怎么分档回答。</p>
        </div>
      </el-tab-pane>

      <!-- ③ Agent 端到端 -->
      <el-tab-pane label="③ Agent 横跨两个 Server" name="agent">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.agent || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="agentQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="agentQuestion" type="textarea" :rows="2" placeholder="一个问题横跨 CRM 与文档库" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="agentLoading"
              :disabled="!agentQuestion.trim()"
              @click="doAgent"
            >
              跑 Agent
            </el-button>
            <span class="muted">get_tools() 把两个子进程的工具抹平成同一个列表交给 create_agent</span>
          </div>
        </div>

        <template v-if="agentResult">
          <div class="card-block">
            <div class="block-head">
              <h4>工具清单（来源已标注）</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">发现耗时 {{ agentResult.discovery_ms }}ms</el-tag>
                <el-tag size="small" effect="plain">调用 {{ agentResult.tool_call_count }} 次</el-tag>
                <el-tag size="small" effect="plain">{{ agentResult.model }} · {{ agentResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <div class="chips">
              <el-tag v-for="tool in agentResult.tools" :key="tool.name" size="small" effect="plain">
                {{ tool.name }} ｜ {{ tool.server }}
              </el-tag>
            </div>
            <Day14Trace class="mt" :steps="agentResult.steps" />
            <p class="hint">{{ agentResult.note }}</p>
          </div>

          <div class="card-block">
            <h4>最终回答</h4>
            <pre class="code-block">{{ agentResult.answer }}</pre>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ 混装 + 转人工 -->
      <el-tab-pane label="④ 混装 + 转人工" name="mixed">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.mixed || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="mixedQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input
            v-model="mixedQuestion"
            type="textarea"
            :rows="2"
            placeholder="扣款金额超过余额时会走本地 escalate_to_human"
          />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="mixedLoading"
              :disabled="!mixedQuestion.trim()"
              @click="doMixed"
            >
              跑混装实验
            </el-button>
            <span class="muted">MCP 工具 + 本地 @tool 混装，token 仍然走 messages 流</span>
          </div>
        </div>

        <template v-if="mixedResult">
          <div class="card-block">
            <div class="block-head">
              <h4>结果</h4>
              <div class="meta-row">
                <el-tag size="small" :type="mixedResult.escalated ? 'warning' : 'info'" effect="plain">
                  {{ mixedResult.escalated ? '已转人工 ✓' : '未转人工' }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ mixedResult.tools.length }} 个工具</el-tag>
                <el-tag size="small" effect="plain">{{ mixedResult.model }} · {{ mixedResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <div class="chips">
              <el-tag
                v-for="tool in mixedResult.tools"
                :key="tool.name"
                size="small"
                :type="tool.server === 'local' ? 'warning' : 'success'"
                effect="plain"
              >
                {{ tool.name }} ｜ {{ tool.server }}
              </el-tag>
            </div>
            <Day14Trace class="mt" :steps="mixedResult.steps" />
            <p class="hint">{{ mixedResult.note }}</p>
          </div>

          <div class="card-block">
            <h4>token 气泡（messages 流）</h4>
            <div v-for="(bubble, index) in mixedResult.bubbles" :key="index" class="bubble">
              <div class="block-head">
                <h5>{{ bubble.node }}</h5>
                <el-tag size="small" effect="plain">{{ bubble.tokens }} token</el-tag>
              </div>
              <pre class="code-block">{{ bubble.text }}</pre>
            </div>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>updates 流：每一步落在哪个节点</h4>
              <el-tag size="small" effect="plain">{{ mixedResult.updates.length }} 个超步</el-tag>
            </div>
            <div class="event-list">
              <div v-for="(item, index) in mixedResult.updates" :key="index" class="event-row">
                <el-tag size="small" type="info" effect="plain">updates</el-tag>
                <span class="mono">+{{ item.offset_ms }}ms</span>
                <span class="line">{{ item.node }} ｜ {{ item.keys.join(', ') }}</span>
              </div>
            </div>
          </div>

          <div class="card-block">
            <h4>最终回答</h4>
            <pre class="code-block">{{ mixedResult.final_answer }}</pre>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ HTTP 与 stdout 坑 -->
      <el-tab-pane label="⑤ HTTP 服务与 stdout 坑" name="deploy">
        <div class="card-block">
          <div class="block-head">
            <h4>streamable-http：把 Server 变成共享服务（课程 04）</h4>
            <el-button type="primary" size="small" :loading="httpLoading" @click="doHttp">
              起一个临时 HTTP Server
            </el-button>
          </div>
          <div class="row-actions">
            <span class="muted">topic</span>
            <el-input v-model="httpTopic" size="small" style="width: 160px" />
            <span class="muted">后台线程 + 随机端口，调用完立刻 should_exit —— 不会占住 15401</span>
          </div>

          <template v-if="httpResult">
            <div class="meta-row mt">
              <el-tag size="small" effect="plain">{{ httpResult.url }}</el-tag>
              <el-tag size="small" effect="plain">启动 {{ httpResult.startup_ms }}ms</el-tag>
              <el-tag size="small" :type="httpResult.stopped ? 'success' : 'danger'" effect="plain">
                {{ httpResult.stopped ? '已关闭' : '仍在运行' }}
              </el-tag>
              <el-tag size="small" effect="plain">{{ httpResult.elapsed_ms }}ms</el-tag>
            </div>
            <div class="chips mt">
              <el-tag v-for="tool in httpResult.tools" :key="tool.name" size="small" effect="plain">
                {{ tool.name }} ｜ {{ tool.server }}
              </el-tag>
            </div>
            <pre class="code-block mt">{{ httpResult.content.join('\n') }}</pre>
            <ul class="rule-list">
              <li v-for="note in httpResult.notes" :key="note">{{ note }}</li>
            </ul>
          </template>
        </div>

        <div class="card-block">
          <div class="block-head">
            <h4>坑 1 现场：往 stdout 写一个字，协议就死（课程第 4 节）</h4>
            <div class="row-actions">
              <el-select v-model="noisyMode" size="small" style="width: 130px">
                <el-option label="all（三种）" value="all" />
                <el-option label="print" value="print" />
                <el-option label="fd_line" value="fd_line" />
                <el-option label="fd（半行）" value="fd" />
              </el-select>
              <el-select v-model="noisyRepeat" size="small" style="width: 110px">
                <el-option :value="1" label="跑 1 次" />
                <el-option :value="2" label="跑 2 次" />
                <el-option :value="3" label="跑 3 次" />
              </el-select>
              <el-button type="danger" size="small" plain :loading="noisyLoading" @click="doNoisy">制造事故</el-button>
            </div>
          </div>
          <p class="hint">
            三种形态的差别只在「写哪、带不带换行」：带换行的垃圾行客户端可能跳过，半行文本会粘住 JSON 帧 —— 必然挂死。
          </p>

          <template v-if="noisyResult">
            <div class="grid-2 mt">
              <div
                v-for="item in noisyResult.cases"
                :key="item.mode"
                class="sub-card"
                :class="item.ok_runs === 0 ? 'bad' : 'ok'"
              >
                <div class="block-head">
                  <h5>{{ item.mode }}</h5>
                  <div class="meta-row">
                    <el-tag size="small" :type="item.ok_runs === item.repeat ? 'success' : 'danger'" effect="plain">
                      存活 {{ item.ok_runs }}/{{ item.repeat }}
                    </el-tag>
                    <el-tag size="small" :type="item.stable ? 'info' : 'warning'" effect="plain">
                      {{ item.stable ? '结果稳定' : '时好时坏' }}
                    </el-tag>
                  </div>
                </div>
                <p class="line">{{ item.verdict }}</p>
                <pre v-if="item.error" class="code-block">{{ item.error }}</pre>
                <pre v-else class="code-block">{{ (item.call || []).join('\n') }}</pre>
                <p class="hint">耗时：{{ item.elapsed_ms }}ms</p>
              </div>
            </div>
            <p class="hint">{{ noisyResult.explain }}</p>
            <p class="hint">{{ noisyResult.sdk_note }}</p>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 14 实验台：MCP 协议——工具发现 / tools/call / 跨 Server 的 Agent / 混装转人工 / HTTP 共享服务 / stdout 坑
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  callDay14Tool,
  getDay14Mapping,
  listChatModels,
  runDay14Agent,
  runDay14Discover,
  runDay14Http,
  runDay14Mixed,
  runDay14Noisy
} from '@/api/study'
import Day14Trace from './Day14Trace.vue'

const mapping = ref(null)
const models = ref([])
const modelId = ref(null)
const subTab = ref('discover')

const versions = computed(() => mapping.value?.versions || {})
const pitfalls = computed(() => mapping.value?.pitfalls || [])

// ① 工具发现
const discover = ref(null)
const discoverLoading = ref(false)

const doDiscover = async () => {
  discoverLoading.value = true
  try {
    discover.value = await runDay14Discover({})
  } finally {
    discoverLoading.value = false
  }
}

// ② 直接调用
const toolOptions = { docs: ['search_docs'], crm: ['get_customer', 'deduct_balance'] }
const callServer = ref('crm')
const callTool = ref('deduct_balance')
const callArguments = ref('{\n  "customer_id": "C001",\n  "amount": 100\n}')
const callResult = ref(null)
const callLoading = ref(false)

// 五个预设覆盖课程第 3 节的三条轨迹：成功 / 业务失败 / 参数非法
const callPresets = [
  { label: '正常扣款 100', server: 'crm', tool: 'deduct_balance', args: { customer_id: 'C001', amount: 100 } },
  { label: '余额不足 5000', server: 'crm', tool: 'deduct_balance', args: { customer_id: 'C001', amount: 5000 } },
  { label: '金额非法 -1', server: 'crm', tool: 'deduct_balance', args: { customer_id: 'C001', amount: -1 } },
  { label: '客户不存在 C999', server: 'crm', tool: 'get_customer', args: { customer_id: 'C999' } },
  { label: '文档检索', server: 'docs', tool: 'search_docs', args: { query: 'Checkpointer 断点续跑' } }
]

const onCallServerChange = () => {
  callTool.value = (toolOptions[callServer.value] || [])[0] || ''
}

const applyPreset = (preset) => {
  callServer.value = preset.server
  callTool.value = preset.tool
  callArguments.value = JSON.stringify(preset.args, null, 2)
}

const doCall = async () => {
  let args
  try {
    args = JSON.parse(callArguments.value || '{}')
  } catch {
    ElMessage.error('参数不是合法 JSON')
    return
  }
  if (typeof args !== 'object' || Array.isArray(args) || args === null) {
    ElMessage.error('参数必须是 JSON 对象')
    return
  }
  callLoading.value = true
  try {
    callResult.value = await callDay14Tool({
      server: callServer.value,
      tool: callTool.value,
      arguments: args
    })
  } finally {
    callLoading.value = false
  }
}

// ③ Agent 横跨两个 Server
const agentQuestion = ref('查一下客户 C001 的信息，然后看看文档库里 Checkpointer 是什么')
const agentResult = ref(null)
const agentLoading = ref(false)

const doAgent = async () => {
  agentLoading.value = true
  try {
    agentResult.value = await runDay14Agent({
      question: agentQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    agentLoading.value = false
  }
}

// ④ 混装 + 转人工
const mixedQuestion = ref('给客户 C001 扣款 5000 元')
const mixedResult = ref(null)
const mixedLoading = ref(false)

const doMixed = async () => {
  mixedLoading.value = true
  try {
    mixedResult.value = await runDay14Mixed({
      question: mixedQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    mixedLoading.value = false
  }
}

// ⑤ HTTP 服务 + stdout 坑
const httpTopic = ref('本周')
const httpResult = ref(null)
const httpLoading = ref(false)

const doHttp = async () => {
  httpLoading.value = true
  try {
    httpResult.value = await runDay14Http({ topic: httpTopic.value.trim() || '本周' })
  } finally {
    httpLoading.value = false
  }
}

const noisyMode = ref('all')
const noisyRepeat = ref(1)
const noisyResult = ref(null)
const noisyLoading = ref(false)

const doNoisy = async () => {
  noisyLoading.value = true
  try {
    noisyResult.value = await runDay14Noisy({ mode: noisyMode.value, repeat: noisyRepeat.value, timeout_seconds: 6 })
  } finally {
    noisyLoading.value = false
  }
}

onMounted(async () => {
  try {
    mapping.value = await getDay14Mapping()
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
.day14 {
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

    h5 {
      margin: 0;
      font-size: 12px;
      font-weight: 600;
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
  }

  .mono {
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 11px;
    word-break: break-all;
  }

  .mt {
    margin-top: 8px;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 10px;
  }

  .sub-card {
    padding: 10px 12px;
    border: 1px solid #eceef6;
    border-radius: $radius-sm;
    background: #fbfcff;

    &.bad {
      border-color: #f5c6c6;
      background: #fff8f8;
    }

    &.ok {
      border-color: #bfe3c8;
      background: #f8fffa;
    }
  }

  .bubble {
    padding: 8px 12px;
    margin-top: 8px;
    border: 1px solid #e8e9f0;
    border-radius: $radius-sm;
    background: #fbfcff;
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

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .param-tag {
    margin: 0 4px 4px 0;
  }

  .line {
    font-size: 12px;
    line-height: 1.7;
    color: $text-regular;
    word-break: break-all;
  }

  .event-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 320px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }

  .event-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 8px;
    padding: 6px 8px;
    border-radius: $radius-sm;
    background: #f9fafd;
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
