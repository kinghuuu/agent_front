<template>
  <div class="day15">
    <el-alert
      class="tip"
      type="warning"
      :closable="false"
      show-icon
      title="Agent 的 bug 大多不是异常，而是「软失败」：流程跑完、不报错，答案却错了。可观测性就是让每一次运行都能被回放"
    />

    <!-- 概念区 -->
    <div class="card-block">
      <h4>传统应用 vs Agent：为什么 grep 日志不够用了（课程 1.1）</h4>
      <el-table :data="mapping?.failure_modes || []" size="small" empty-text="加载中…">
        <el-table-column prop="dimension" label="维度" width="120" />
        <el-table-column label="传统 Web 服务" min-width="240">
          <template #default="{ row }">
            <span class="line">{{ row.web }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Agent" min-width="340">
          <template #default="{ row }">
            <span class="line">{{ row.agent }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="card-block">
      <div class="block-head">
        <h4>可观测性三大件（课程 1.2）</h4>
        <div class="meta-row">
          <el-tag size="small" effect="plain">langsmith {{ versions.langsmith }}</el-tag>
          <el-tag size="small" effect="plain">langfuse {{ versions.langfuse }}</el-tag>
          <el-tag size="small" effect="plain">langgraph {{ versions.langgraph }}</el-tag>
        </div>
      </div>
      <el-table :data="mapping?.pillars || []" size="small">
        <el-table-column prop="pillar" label="三大件" width="150" />
        <el-table-column prop="traditional" label="传统含义" width="150" />
        <el-table-column prop="agent" label="Agent 语境下是什么" min-width="380">
          <template #default="{ row }">
            <span class="line">{{ row.agent }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="今天从哪来" width="220" />
      </el-table>
      <p class="hint">关系是层层推导的：Trace 是原料 → Metrics 从 Trace 聚合 → 告警与优化决策从 Metrics 来。</p>
    </div>

    <div class="card-block">
      <el-collapse>
        <el-collapse-item title="两条技术路线怎么选（课程 1.3）" name="routes">
          <el-table :data="mapping?.routes || []" size="small">
            <el-table-column prop="route" label="路线" width="120" />
            <el-table-column prop="examples" label="代表" min-width="220" />
            <el-table-column prop="pros" label="优点" min-width="240" />
            <el-table-column prop="cons" label="缺点" min-width="240" />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="trace 的八字段数据模型 + 指标定义" name="fields">
          <el-table :data="mapping?.trace_fields || []" size="small">
            <el-table-column prop="field" label="字段" width="130" />
            <el-table-column prop="meaning" label="含义" min-width="320" />
            <el-table-column prop="example" label="示例" min-width="180" />
          </el-table>
          <el-table class="mt" :data="mapping?.metric_defs || []" size="small">
            <el-table-column prop="metric" label="指标" width="160" />
            <el-table-column prop="how" label="怎么算" min-width="240" />
            <el-table-column prop="why" label="为什么看它" min-width="340" />
          </el-table>
          <p class="hint">记住这八个字段，任何 APM 平台（LangSmith / Langfuse / Jaeger）你都能看懂它的 trace 树。</p>
        </el-collapse-item>
        <el-collapse-item :title="`五个常见的坑（第 4 节，${pitfalls.length} 条）`" name="pitfalls">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="46" />
            <el-table-column prop="title" label="坑" width="220" />
            <el-table-column prop="symptom" label="现象" min-width="260" />
            <el-table-column prop="fix" label="修法" min-width="320" />
          </el-table>
          <p class="hint">坑 2（PII 脱敏）与坑 4（并发串线）在 ③ 自建 Trace 里有可验证的现场。</p>
        </el-collapse-item>
        <el-collapse-item title="速查表 + 今日必掌握清单" name="cheat">
          <el-table :data="mapping?.cheatsheet || []" size="small">
            <el-table-column prop="topic" label="需求" width="150" />
            <el-table-column prop="content" label="做法 / 关键 API" min-width="460">
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

    <!-- 平台就绪状态 -->
    <div class="card-block">
      <div class="block-head">
        <h4>平台就绪状态（只读环境变量，接口不会替你改）</h4>
        <el-button size="small" text :loading="mappingLoading" @click="loadMapping">刷新</el-button>
      </div>
      <div class="grid-2">
        <div v-for="key in ['langsmith', 'langfuse']" :key="key" class="sub-card" :class="platform[key]?.configured ? 'ok' : 'bad'">
          <div class="block-head">
            <h5>{{ platform[key]?.name }}</h5>
            <el-tag size="small" :type="platform[key]?.configured ? 'success' : 'info'" effect="plain">
              {{ platform[key]?.configured ? '已配置' : '未配置' }}
            </el-tag>
          </div>
          <p class="hint">
            包装状态：{{ platform[key]?.installed ? '已安装' : '未安装' }} ·
            仪表盘：{{ platform[key]?.dashboard }}
          </p>
          <p v-if="platform[key]?.missing?.length" class="mono">缺：{{ platform[key].missing.join('、') }}</p>
          <p class="hint">{{ platform[key]?.install_hint }}</p>
        </div>
      </div>
      <p class="hint">{{ mapping?.install_hint }}</p>
    </div>

    <div class="model-bar">
      <span class="label">模型</span>
      <el-select v-model="modelId" placeholder="默认模型" size="small" clearable style="width: 200px">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="muted">①②③④ 都会真实调用模型；⑤ 只读本地 trace 文件</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 自建回调 -->
      <el-tab-pane label="① 回调追踪" name="callback">
        <div class="card-block">
          <div class="row-actions">
            <el-input v-model="callbackQuestion" size="small" style="max-width: 360px" placeholder="要问 Agent 的问题" />
            <el-input v-model="callbackUserId" size="small" style="width: 120px" placeholder="user_id" />
            <el-button type="primary" size="small" :loading="callbackLoading" @click="doCallback">跑一次并抓轨迹</el-button>
          </div>
          <p class="hint">
            config 里的 callbacks 就是所有平台的注入点；tags / metadata 会随 run 上报，是平台上的筛选维度。
          </p>
        </div>

        <template v-if="callback">
          <div class="card-block">
            <div class="block-head">
              <h4>调用树（parent_run_id 还原）</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">LLM {{ callback.llm_calls }} 次</el-tag>
                <el-tag size="small" effect="plain">工具 {{ callback.tool_calls }} 次</el-tag>
                <el-tag size="small" effect="plain">tokens {{ callback.total_tokens }}</el-tag>
                <el-tag size="small" effect="plain">{{ callback.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <el-table :data="flattenTree(callback.tree)" size="small" row-key="span_id">
              <el-table-column label="节点" min-width="240">
                <template #default="{ row }">
                  <span :style="{ paddingLeft: `${row.depth * 16}px` }" class="mono">
                    {{ row.depth ? '└─ ' : '' }}{{ row.name }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="kind" label="类型" width="80" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.status === 'ok' ? 'success' : 'danger'" effect="plain">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="耗时" width="100">
                <template #default="{ row }">{{ row.duration_ms }}ms</template>
              </el-table-column>
              <el-table-column label="关键属性" min-width="320">
                <template #default="{ row }">
                  <span class="line">{{ attrPreview(row) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="grid-2">
            <div class="card-block">
              <h4>时间轴</h4>
              <div class="event-list">
                <div v-for="(row, index) in callback.timeline" :key="index" class="event-row">
                  <el-tag size="small" effect="plain">{{ row.offset_ms }}ms</el-tag>
                  <el-tag size="small" :type="row.status === 'ok' ? 'success' : 'danger'" effect="plain">
                    {{ row.kind }}
                  </el-tag>
                  <span class="mono">{{ row.name }}</span>
                  <span class="line">{{ row.detail }}</span>
                </div>
              </div>
            </div>
            <div class="card-block">
              <h4>最终回答</h4>
              <p class="line">{{ callback.answer }}</p>
              <div class="chips">
                <el-tag v-for="tag in callback.tags" :key="tag" size="small" effect="plain">#{{ tag }}</el-tag>
              </div>
              <pre class="code-block mt">{{ JSON.stringify(callback.metadata, null, 2) }}</pre>
              <p class="hint">{{ callback.note }}</p>
            </div>
          </div>

          <div class="card-block">
            <el-collapse>
              <el-collapse-item title="原始回调事件（LLM 输入预览 / token / 工具参数与返回）" name="events">
                <pre class="code-block">{{ JSON.stringify(callback.events, null, 2) }}</pre>
              </el-collapse-item>
            </el-collapse>
          </div>
        </template>
      </el-tab-pane>

      <!-- ② 平台接入 -->
      <el-tab-pane label="② 平台接入" name="platform">
        <div class="card-block">
          <div class="row-actions">
            <el-radio-group v-model="provider" size="small">
              <el-radio-button value="langsmith">LangSmith</el-radio-button>
              <el-radio-button value="langfuse">Langfuse</el-radio-button>
            </el-radio-group>
            <el-input v-model="platformQuestion" size="small" style="max-width: 340px" placeholder="要问 Agent 的问题" />
            <el-switch v-if="provider === 'langfuse'" v-model="platformFeedback" size="small" active-text="回填点赞 score" />
            <el-button type="primary" size="small" :loading="platformLoading" @click="doPlatform">运行</el-button>
          </div>
          <p class="hint">
            LangSmith 零代码：三个环境变量即可；Langfuse 多一个能力——把用户反馈（score）回填到 trace 上，
            这是明天评估集的地基。
          </p>
        </div>

        <div v-if="platformResult" class="card-block">
          <div class="block-head">
            <h4>{{ platformResult.provider }} · {{ platformResult.configured ? '已上报' : '未配置' }}</h4>
            <div class="meta-row">
              <el-tag size="small" :type="platformResult.configured ? 'success' : 'info'" effect="plain">
                {{ platformResult.configured ? 'configured' : 'not configured' }}
              </el-tag>
              <el-tag v-if="platformResult.trace_id" size="small" effect="plain">trace {{ platformResult.trace_id }}</el-tag>
              <el-tag v-if="platformResult.model" size="small" effect="plain">{{ platformResult.model }}</el-tag>
            </div>
          </div>

          <template v-if="platformResult.configured">
            <p class="line">{{ platformResult.answer }}</p>
            <div class="chips mt">
              <el-tag v-for="tag in platformResult.tags" :key="tag" size="small" effect="plain">#{{ tag }}</el-tag>
            </div>
            <pre class="code-block mt">{{ JSON.stringify(platformResult.metadata, null, 2) }}</pre>
          </template>
          <template v-else>
            <p class="hint">没有配置 key 时不会跑模型，也就不会白花 token：</p>
            <ul class="rule-list">
              <li v-for="(item, index) in platformResult.instructions" :key="index" class="mono">{{ item }}</li>
            </ul>
            <p v-if="platformResult.missing?.length" class="hint">当前缺少：{{ platformResult.missing.join('、') }}</p>
          </template>

          <ul class="rule-list">
            <li v-for="(note, index) in platformResult.notes" :key="index">{{ note }}</li>
          </ul>
          <p v-if="platformResult.run_info && Object.keys(platformResult.run_info).length" class="mono">
            run_info: {{ JSON.stringify(platformResult.run_info) }}
          </p>
        </div>
      </el-tab-pane>

      <!-- ③ 自建 Trace -->
      <el-tab-pane label="③ 自建 Trace" name="own">
        <div class="card-block">
          <div class="row-actions">
            <el-input v-model="ownQuestion" size="small" style="max-width: 320px" placeholder="要问 Agent 的问题" />
            <el-input v-model="ownUserId" size="small" style="width: 110px" placeholder="user_id" />
            <span class="muted">max_steps</span>
            <el-input-number v-model="ownMaxSteps" :min="2" :max="10" size="small" style="width: 100px" />
            <span class="muted">并发数</span>
            <el-input-number v-model="ownConcurrency" :min="1" :max="5" size="small" style="width: 100px" />
            <el-button type="primary" size="small" :loading="ownLoading" @click="doOwnTrace">跑一次并落盘</el-button>
          </div>
          <p class="hint">
            手写 while 循环 + span 上下文管理器：每轮 LLM、每次工具调用各一层，
            跑完直接回放成树并聚合指标——这就是所有平台 trace 的原始形态。
          </p>
        </div>

        <template v-if="ownResult">
          <div class="card-block">
            <div class="block-head">
              <h4>本次 trace：{{ ownResult.trace_id }}</h4>
              <div class="meta-row">
                <el-tag size="small" :type="ownResult.stop_reason === 'normal' ? 'success' : 'warning'" effect="plain">
                  {{ ownResult.stop_reason }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ ownResult.elapsed_ms }}ms</el-tag>
                <el-tag size="small" effect="plain">{{ ownResult.model }}</el-tag>
              </div>
            </div>
            <div class="metric-grid">
              <div v-for="row in ownMetricRows" :key="row.label" class="metric-card">
                <span class="metric-label">{{ row.label }}</span>
                <span class="metric-value">{{ row.value }}</span>
              </div>
            </div>
            <p class="line mt">{{ ownResult.answer }}</p>
            <p class="hint mono">落盘：{{ ownResult.file }}</p>
          </div>

          <div class="card-block">
            <h4>回放成树（八字段 → parent_id 建树）</h4>
            <el-table :data="flattenTree(ownResult.tree)" size="small" row-key="span_id">
              <el-table-column label="节点" min-width="240">
                <template #default="{ row }">
                  <span :style="{ paddingLeft: `${row.depth * 16}px` }" class="mono">
                    {{ row.depth ? '└─ ' : '' }}{{ row.name }}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="kind" label="类型" width="80" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.status === 'ok' ? 'success' : 'danger'" effect="plain">
                    {{ row.status }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="耗时" width="100">
                <template #default="{ row }">{{ row.duration_ms }}ms</template>
              </el-table-column>
              <el-table-column label="属性（token / 工具原文 / 终止原因）" min-width="360">
                <template #default="{ row }">
                  <span class="line">{{ attrPreview(row) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="grid-2">
            <div class="card-block">
              <div class="block-head">
                <h4>并发不串线（坑 4 的反面证据）</h4>
                <el-tag size="small" :type="ownResult.concurrency.ok ? 'success' : 'danger'" effect="plain">
                  {{ ownResult.concurrency.ok ? '通过' : '串线了' }}
                </el-tag>
              </div>
              <el-table :data="ownResult.concurrency.traces" size="small">
                <el-table-column prop="worker" label="worker" width="80" />
                <el-table-column prop="trace_id" label="trace_id" width="150" />
                <el-table-column prop="spans" label="span 数" width="90" />
                <el-table-column label="父子正确" width="100">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.parent_ok ? 'success' : 'danger'" effect="plain">
                      {{ row.parent_ok ? '是' : '否' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
              <p class="hint">{{ ownResult.concurrency.note }}</p>
            </div>
            <div class="card-block">
              <h4>全局指标（traces.jsonl 全量聚合）</h4>
              <div class="metric-grid">
                <div v-for="row in globalMetricRows" :key="row.label" class="metric-card">
                  <span class="metric-label">{{ row.label }}</span>
                  <span class="metric-value">{{ row.value }}</span>
                </div>
              </div>
              <p class="hint">{{ ownResult.note }}</p>
            </div>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ 全链路 -->
      <el-tab-pane label="④ 全链路（MCP）" name="full">
        <div class="card-block">
          <div class="row-actions">
            <el-input v-model="fullQuestion" size="small" style="max-width: 340px" placeholder="要问 Agent 的问题" />
            <el-button type="primary" size="small" :loading="fullLoading" @click="doFullStack">跑一次全链路</el-button>
          </div>
          <p class="hint">
            LangGraph 侧有 trace、MCP Server 侧没有。客户端把 trace_id 当工具参数传过去，
            两边各写各的 JSONL，排查时按 id 一拼就是完整链路。
          </p>
        </div>

        <template v-if="fullResult">
          <div class="card-block">
            <div class="block-head">
              <h4>trace {{ fullResult.trace_id }}</h4>
              <div class="meta-row">
                <el-tag size="small" :type="fullResult.matched ? 'success' : 'warning'" effect="plain">
                  {{ fullResult.matched ? '两侧已对齐' : '服务端没收到 trace_id' }}
                </el-tag>
                <el-tag size="small" :type="fullResult.terminated_normally ? 'success' : 'warning'" effect="plain">
                  {{ fullResult.termination }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ fullResult.elapsed_ms }}ms</el-tag>
                <el-tag size="small" effect="plain">tokens {{ fullResult.input_tokens }}/{{ fullResult.output_tokens }}</el-tag>
              </div>
            </div>
            <p class="line">{{ fullResult.answer }}</p>
            <p class="hint mono">客户端日志：{{ fullResult.files.business }}</p>
            <p class="hint mono">服务端 span：{{ fullResult.files.server }}</p>
          </div>

          <div class="card-block">
            <h4>合并时间轴（客户端 + 服务端）</h4>
            <div class="event-list">
              <div v-for="(row, index) in fullResult.merged" :key="index" class="event-row">
                <el-tag size="small" :type="row.side === 'client' ? 'primary' : 'warning'" effect="plain">
                  {{ row.side }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ row.offset_ms }}ms</el-tag>
                <span class="mono">{{ row.name }}</span>
                <span class="muted">{{ row.duration_ms }}ms · {{ row.status }}</span>
                <span class="line">{{ row.detail }}</span>
              </div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card-block">
              <h4>服务端 span（MCP Server 自己写的）</h4>
              <el-table :data="fullResult.server_spans" size="small" empty-text="没有收到 trace_id">
                <el-table-column prop="tool" label="工具" width="170" />
                <el-table-column prop="status" label="状态" width="90" />
                <el-table-column label="耗时" width="90">
                  <template #default="{ row }">{{ row.dur_ms }}ms</template>
                </el-table-column>
                <el-table-column label="参数" min-width="200">
                  <template #default="{ row }">
                    <span class="mono">{{ JSON.stringify(row.args) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div class="card-block">
              <h4>客户端业务记录</h4>
              <pre class="code-block">{{ JSON.stringify(fullResult.business, null, 2) }}</pre>
              <ul class="rule-list">
                <li v-for="(note, index) in fullResult.notes" :key="index">{{ note }}</li>
              </ul>
            </div>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ 回放与反馈 -->
      <el-tab-pane label="⑤ 回放与反馈" name="replay">
        <div class="card-block">
          <div class="row-actions">
            <el-button type="primary" size="small" :loading="tracesLoading" @click="loadTraces">加载最近 trace</el-button>
            <span class="muted">读 traces.jsonl 与 feedback.jsonl，不调模型</span>
          </div>
        </div>

        <template v-if="traces">
          <div class="grid-2">
            <div class="card-block">
              <h4>全局指标</h4>
              <div class="metric-grid">
                <div v-for="row in replayMetricRows" :key="row.label" class="metric-card">
                  <span class="metric-label">{{ row.label }}</span>
                  <span class="metric-value">{{ row.value }}</span>
                </div>
              </div>
            </div>
            <div class="card-block">
              <h4>用户反馈（自建版 score）</h4>
              <div class="metric-grid">
                <div class="metric-card">
                  <span class="metric-label">点赞率</span>
                  <span class="metric-value">{{ (traces.feedback.like_rate * 100).toFixed(0) }}%</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">赞 / 踩</span>
                  <span class="metric-value">{{ traces.feedback.likes }} / {{ traces.feedback.dislikes }}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">反馈条数</span>
                  <span class="metric-value">{{ traces.feedback.total }}</span>
                </div>
              </div>
              <p class="hint">
                点踩是免费的真值标签：攒两周就是明天的评估集。观测 → 定位 → 修复 → 回归，闭环从这一步开始。
              </p>
            </div>
          </div>

          <div class="card-block">
            <h4>最近 {{ traces.traces.length }} 条 trace</h4>
            <el-empty v-if="!traces.traces.length" description="还没有 trace：先去 ③ 跑一次自建 Trace" />
            <el-collapse v-else>
              <el-collapse-item v-for="item in traces.traces" :key="item.trace_id" :name="item.trace_id">
                <template #title>
                  <div class="trace-title">
                    <el-tag size="small" effect="plain">{{ item.trace_id }}</el-tag>
                    <el-tag size="small" :type="item.termination === 'normal' ? 'success' : 'warning'" effect="plain">
                      {{ item.termination }}
                    </el-tag>
                    <span class="line">{{ item.question || '（无问题记录）' }}</span>
                    <span class="muted">
                      {{ item.metrics.traces }} trace · {{ item.metrics.total_tokens }} tok · {{ item.metrics.latency_p95_ms }}ms p95
                    </span>
                  </div>
                </template>

                <el-table :data="flattenTree(item.tree)" size="small" row-key="span_id">
                  <el-table-column label="节点" min-width="220">
                    <template #default="{ row }">
                      <span :style="{ paddingLeft: `${row.depth * 14}px` }" class="mono">
                        {{ row.depth ? '└─ ' : '' }}{{ row.name }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="kind" label="类型" width="80" />
                  <el-table-column label="状态" width="90">
                    <template #default="{ row }">
                      <el-tag size="small" :type="row.status === 'ok' ? 'success' : 'danger'" effect="plain">
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="耗时" width="100">
                    <template #default="{ row }">{{ row.duration_ms }}ms</template>
                  </el-table-column>
                  <el-table-column label="属性" min-width="300">
                    <template #default="{ row }">
                      <span class="line">{{ attrPreview(row) }}</span>
                    </template>
                  </el-table-column>
                </el-table>

                <div class="feedback-row">
                  <el-input
                    v-model="feedbackComment[item.trace_id]"
                    size="small"
                    style="max-width: 300px"
                    placeholder="失败备注（可选）"
                  />
                  <el-button size="small" type="success" plain @click="sendFeedback(item.trace_id, 1)">点赞</el-button>
                  <el-button size="small" type="danger" plain @click="sendFeedback(item.trace_id, -1)">点踩</el-button>
                  <span class="muted">反馈会写进 feedback.jsonl，用于 Day 16 建评估集</span>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 15 实验台：可观测性——回调追踪 / 平台接入 / 自建 trace + 指标 / MCP 跨进程全链路 / 回放与反馈
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDay15Mapping,
  listChatModels,
  listDay15Traces,
  runDay15Callback,
  runDay15FullStack,
  runDay15OwnTrace,
  runDay15Platform,
  submitDay15Feedback
} from '@/api/study'

const mapping = ref(null)
const mappingLoading = ref(false)
const models = ref([])
const modelId = ref(null)
const subTab = ref('callback')

const versions = computed(() => mapping.value?.versions || {})
const pitfalls = computed(() => mapping.value?.pitfalls || [])
const platform = computed(() => mapping.value?.platform || {})

// 把后端返回的树压平成带 depth 的行（表格比递归组件好维护）
const flattenTree = (nodes, depth = 0) => {
  const rows = []
  for (const node of nodes || []) {
    rows.push({ ...node, depth })
    rows.push(...flattenTree(node.children || [], depth + 1))
  }
  return rows
}

// 一行里塞最关键的属性：token / 工具输入输出 / 终止原因
const attrPreview = (row) => {
  const attrs = row.attributes || {}
  const bits = []
  if (attrs.model) bits.push(`model=${attrs.model}`)
  if (attrs.input_tokens != null || attrs.output_tokens != null) {
    bits.push(`tok=${attrs.input_tokens || 0}/${attrs.output_tokens || 0}`)
  }
  if (attrs.total_tokens) bits.push(`total=${attrs.total_tokens}`)
  if (attrs.question) bits.push(`Q=${attrs.question}`)
  if (attrs.termination) bits.push(`termination=${attrs.termination}`)
  if (attrs.steps != null) bits.push(`steps=${attrs.steps}`)
  if (attrs.tool) bits.push(`tool=${attrs.tool}`)
  if (attrs.input) bits.push(`in=${attrs.input}`)
  if (attrs.output) bits.push(`out=${attrs.output}`)
  if (attrs.error) bits.push(`error=${attrs.error}`)
  return bits.join(' · ') || JSON.stringify(attrs).slice(0, 140)
}

// ---------- ① 回调追踪 ----------
const callbackQuestion = ref('帮我报销昨天的午餐 45 元')
const callbackUserId = ref('u_889')
const callback = ref(null)
const callbackLoading = ref(false)

const doCallback = async () => {
  if (!callbackQuestion.value.trim()) {
    ElMessage.warning('先写一个问题')
    return
  }
  callbackLoading.value = true
  try {
    callback.value = await runDay15Callback({
      question: callbackQuestion.value.trim(),
      user_id: callbackUserId.value.trim() || 'u_889',
      model_config_id: modelId.value || undefined
    })
  } finally {
    callbackLoading.value = false
  }
}

// ---------- ② 平台接入 ----------
const provider = ref('langsmith')
const platformQuestion = ref('帮我报销昨天的午餐 45 元')
const platformFeedback = ref(true)
const platformResult = ref(null)
const platformLoading = ref(false)

const doPlatform = async () => {
  platformLoading.value = true
  try {
    platformResult.value = await runDay15Platform({
      provider: provider.value,
      question: platformQuestion.value.trim(),
      model_config_id: modelId.value || undefined,
      feedback: platformFeedback.value
    })
  } finally {
    platformLoading.value = false
  }
}

// ---------- ③ 自建 Trace ----------
const ownQuestion = ref('报销高铁票 237 元')
const ownUserId = ref('u_889')
const ownMaxSteps = ref(5)
const ownConcurrency = ref(3)
const ownResult = ref(null)
const ownLoading = ref(false)

const metricRows = (metrics) => {
  if (!metrics) return []
  const termination = Object.entries(metrics.termination || {})
    .map(([key, value]) => `${key}:${value}`)
    .join(' / ')
  return [
    { label: 'trace 数', value: metrics.traces },
    { label: 'p50 延迟', value: `${metrics.latency_p50_ms}ms` },
    { label: 'p95 延迟', value: `${metrics.latency_p95_ms}ms` },
    { label: '总 token', value: `${metrics.total_tokens}` },
    { label: '估算成本', value: `¥${metrics.cost_cny}` },
    { label: '工具错误率', value: `${(metrics.tool_error_rate * 100).toFixed(1)}%` },
    { label: '终止分布', value: termination || '—' }
  ]
}

const ownMetricRows = computed(() => metricRows(ownResult.value?.metrics))
const globalMetricRows = computed(() => metricRows(ownResult.value?.global_metrics))

const doOwnTrace = async () => {
  if (!ownQuestion.value.trim()) {
    ElMessage.warning('先写一个问题')
    return
  }
  ownLoading.value = true
  try {
    ownResult.value = await runDay15OwnTrace({
      question: ownQuestion.value.trim(),
      user_id: ownUserId.value.trim() || 'u_889',
      model_config_id: modelId.value || undefined,
      max_steps: ownMaxSteps.value,
      concurrency_runs: ownConcurrency.value
    })
  } finally {
    ownLoading.value = false
  }
}

// ---------- ④ 全链路 ----------
const fullQuestion = ref('报销昨天的晚餐 78 元')
const fullResult = ref(null)
const fullLoading = ref(false)

const doFullStack = async () => {
  fullLoading.value = true
  try {
    fullResult.value = await runDay15FullStack({
      question: fullQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    fullLoading.value = false
  }
}

// ---------- ⑤ 回放与反馈 ----------
const traces = ref(null)
const tracesLoading = ref(false)
const feedbackComment = ref({})

const replayMetricRows = computed(() => metricRows(traces.value?.metrics))

const loadTraces = async () => {
  tracesLoading.value = true
  try {
    traces.value = await listDay15Traces(5)
  } finally {
    tracesLoading.value = false
  }
}

const sendFeedback = async (traceId, value) => {
  const result = await submitDay15Feedback({
    trace_id: traceId,
    value,
    comment: feedbackComment.value[traceId] || ''
  })
  ElMessage.success(`已记录（点赞率 ${(result.summary.like_rate * 100).toFixed(0)}%）`)
  await loadTraces()
}

const loadMapping = async () => {
  mappingLoading.value = true
  try {
    mapping.value = await getDay15Mapping()
  } catch {
    // 概念表失败不阻塞实验区
  } finally {
    mappingLoading.value = false
  }
}

onMounted(async () => {
  await loadMapping()
  try {
    models.value = await listChatModels()
  } catch {
    // 模型列表失败时后端会给出明确错误
  }
})
</script>

<style lang="scss" scoped>
.day15 {
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

  .row-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
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

  .line {
    font-size: 12px;
    line-height: 1.7;
    color: $text-regular;
    word-break: break-all;
  }

  .metric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
  }

  .metric-card {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 8px 10px;
    border: 1px solid #eceef6;
    border-radius: $radius-sm;
    background: #fbfcff;

    .metric-label {
      font-size: 11px;
      color: $agent-text-muted;
    }

    .metric-value {
      font-size: 14px;
      font-weight: 600;
      color: $agent-accent;
      word-break: break-all;
    }
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

  .trace-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding-right: 12px;
  }

  .feedback-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    margin-top: $gap-sm;
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
