<template>
  <div class="day13">
    <el-alert
      class="tip"
      type="info"
      :closable="false"
      show-icon
      title="流式不只是打字机：它同时是可观测性窗口。四种 stream_mode 是分层的，一个超步可以同时吐出状态级 / 节点级 / token 级 / 自定义四层事件"
    />

    <!-- 顶部：四模式表 + 折叠概念 -->
    <div class="card-block">
      <div class="block-head">
        <h4>stream_mode 五种取值（课程 2.1）</h4>
        <el-tag size="small" effect="plain">langgraph {{ mapping?.langgraph_version || '…' }}</el-tag>
      </div>
      <el-table :data="mapping?.stream_modes || []" size="small" empty-text="加载中…">
        <el-table-column prop="mode" label="模式" width="100" />
        <el-table-column prop="emits" label="吐出什么" min-width="240" show-overflow-tooltip />
        <el-table-column prop="granularity" label="粒度" width="80" />
        <el-table-column prop="usage" label="典型用途" min-width="260" show-overflow-tooltip />
        <el-table-column prop="shape" label="数据形态" min-width="180" show-overflow-tooltip />
      </el-table>

      <el-collapse class="mt">
        <el-collapse-item title="invoke / stream / astream_events 怎么选（课程 2.3）" name="api">
          <el-table :data="mapping?.api_choices || []" size="small">
            <el-table-column prop="api" label="API" width="220" />
            <el-table-column prop="job" label="用途" min-width="220" />
            <el-table-column prop="when" label="什么时候用" min-width="200" />
            <el-table-column prop="note" label="备注" min-width="260" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item
          :title="`interrupt + 流式同开：暂停信号到底在哪（${mapping?.interrupt_rules?.length || 0} 条）`"
          name="interrupt"
        >
          <el-table :data="mapping?.interrupt_rules || []" size="small">
            <el-table-column prop="point" label="要点" width="220" />
            <el-table-column prop="detail" label="说明" min-width="420" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="生产 SSE 三件套 + 四类事件协议（课程 3.5）" name="sse">
          <el-table :data="mapping?.sse_rules || []" size="small">
            <el-table-column prop="rule" label="规矩" width="180" />
            <el-table-column prop="why" label="为什么" min-width="320" show-overflow-tooltip />
            <el-table-column prop="how" label="怎么写" min-width="260" show-overflow-tooltip />
          </el-table>
          <el-table class="mt" :data="mapping?.event_protocol || []" size="small">
            <el-table-column prop="type" label="事件 type" width="130" />
            <el-table-column prop="payload" label="载荷" width="200" />
            <el-table-column prop="front" label="前端动作" min-width="320" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item :title="`五个常见坑（第 5 节，${pitfalls.length} 条）`" name="pitfalls">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="46" />
            <el-table-column prop="title" label="坑" width="190" />
            <el-table-column prop="symptom" label="现象" min-width="240" show-overflow-tooltip />
            <el-table-column prop="fix" label="修法" min-width="320" show-overflow-tooltip />
          </el-table>
        </el-collapse-item>
        <el-collapse-item title="今日必掌握清单（第 8 节）" name="checklist">
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
      <span class="muted">①②③⑤ 会真实调用模型；④ 是确定性实验（不花 token）</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 四模式对照 -->
      <el-tab-pane label="① 四模式对照" name="modes">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.modes || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="modesQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="modesQuestion" type="textarea" :rows="2" placeholder="同一句话会被三种模式分别订阅一遍" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="modesLoading"
              :disabled="!modesQuestion.trim()"
              @click="doModes"
            >
              跑四种模式
            </el-button>
            <span class="muted">跑 3 趟图（约 6 次 LLM 调用）：messages 与多模式共用第三趟，省一半调用</span>
          </div>
        </div>

        <template v-if="modesResult">
          <div class="card-block">
            <div class="block-head">
              <h4>事件统计：同一条流程，不同粒度的观察窗口</h4>
              <div class="meta-row">
                <el-tag v-for="item in modesResult.mode_stats" :key="item.mode" size="small" effect="plain">
                  {{ item.mode }} · {{ item.events }} 条 · {{ item.elapsed_ms }}ms
                </el-tag>
                <el-tag size="small" effect="plain">{{ modesResult.model }} · {{ modesResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>

            <div class="grid-2 mt">
              <div class="sub-card">
                <h5>values：每个超步后的完整 state</h5>
                <el-table :data="modesResult.values" size="small">
                  <el-table-column prop="index" label="#" width="46" />
                  <el-table-column prop="messages_count" label="消息数" width="76" />
                  <el-table-column prop="next" label="next" width="96" />
                  <el-table-column prop="last" label="最后一条（截断）" show-overflow-tooltip />
                </el-table>
                <p class="hint">第一条就有数据（初始 state 也吐一次）——适合调试重放。</p>
              </div>

              <div class="sub-card">
                <h5>updates：节点返回的增量</h5>
                <el-table :data="modesResult.updates" size="small">
                  <el-table-column prop="node" label="节点" width="110" />
                  <el-table-column label="增量键" width="150">
                    <template #default="{ row }">
                      <span class="mono">{{ (row.keys || []).join(', ') }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="digest" label="干了什么" show-overflow-tooltip />
                </el-table>
                <p class="hint">主管只改 next、专家只改 messages——这是判断"系统在干嘛"的最快信号。</p>
              </div>

              <div class="sub-card">
                <div class="block-head">
                  <h5>messages：token 流（按节点分流）</h5>
                  <div class="meta-row">
                    <el-tag size="small" effect="plain">可见 {{ visibleTokens.length }}</el-tag>
                    <el-tag size="small" type="warning" effect="plain">过滤主管 {{ modesResult.filtered_tokens }}</el-tag>
                  </div>
                </div>
                <div class="row-actions">
                  <el-button size="small" text type="primary" @click="replayModes">
                    打字机回放
                  </el-button>
                  <el-button size="small" text :disabled="!replaying" @click="stopReplay">停止</el-button>
                </div>
                <pre class="code-block mt">{{ modesReplay || visibleText }}</pre>
                <p class="hint">
                  metadata['langgraph_node'] 决定 token 归谁；主管的结构化 token 是 JSON 碎片，必须过滤。
                </p>
              </div>

              <div class="sub-card">
                <div class="block-head">
                  <h5>多模式：(mode, payload) 二元组</h5>
                  <el-tag size="small" effect="plain">{{ modesResult.multi.length }} 条</el-tag>
                </div>
                <div class="event-list">
                  <div v-for="item in modesResult.multi.slice(0, 40)" :key="item.index" class="event-row">
                    <el-tag size="small" :type="item.mode === 'messages' ? 'success' : 'info'" effect="plain">
                      {{ item.mode }}
                    </el-tag>
                    <span class="mono">{{ item.node }}</span>
                    <span class="line">{{ item.content }}</span>
                  </div>
                  <p v-if="modesResult.multi.length > 40" class="muted">
                    仅显示前 40 条（共 {{ modesResult.multi.length }} 条）
                  </p>
                </div>
                <p class="hint">模式改成列表后，解包必须从 <code>for chunk</code> 改成 <code>for (mode, chunk)</code>。</p>
              </div>
            </div>

            <ul class="rule-list mt">
              <li v-for="item in modesResult.takeaways" :key="item">{{ item }}</li>
            </ul>
            <p class="hint">{{ modesResult.note }}</p>
          </div>

          <Day10Graph title="最小图：supervisor（吐 JSON）→ expert（吐自然语言）" :structure="modesResult.graph" />
        </template>
      </el-tab-pane>

      <!-- ② 多 Agent token 分流 -->
      <el-tab-pane label="② 多 Agent token 分流" name="token">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.token || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="tokenQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="tokenQuestion" type="textarea" :rows="2" placeholder="主管 + researcher + writer 一起吐 token，看它们怎么各回各家" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="tokenLoading"
              :disabled="!tokenQuestion.trim()"
              @click="doToken"
            >
              跑多 Agent 流式
            </el-button>
            <span class="muted">每个专家一个气泡，token 只流进自己的气泡；主管的 JSON 全部过滤</span>
          </div>
        </div>

        <template v-if="tokenResult">
          <div class="card-block">
            <div class="block-head">
              <h4>气泡分流结果</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">首 token {{ tokenResult.first_token_ms }}ms</el-tag>
                <el-tag size="small" effect="plain">主管派单 {{ tokenResult.dispatches.length }} 次</el-tag>
                <el-tag size="small" type="warning" effect="plain">
                  过滤主管 token {{ tokenResult.filtered.tokens }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ tokenResult.model }} · {{ tokenResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>

            <div class="row-actions mt">
              <el-button size="small" text type="primary" @click="playBubbles(tokenResult.bubbles)">逐泡重放</el-button>
              <el-button size="small" text :disabled="!replaying" @click="stopReplay">停止</el-button>
            </div>

            <div v-for="(bubble, index) in tokenResult.bubbles" :key="index" class="bubble">
              <div class="block-head">
                <h4>{{ bubble.node }}</h4>
                <div class="meta-row">
                  <el-tag size="small" effect="plain">{{ bubble.tokens }} token</el-tag>
                  <el-tag size="small" effect="plain">+{{ bubble.first_offset_ms }}ms 起</el-tag>
                </div>
              </div>
              <pre class="code-block">{{ bubbleReplay[index] !== undefined ? bubbleReplay[index] : bubble.text }}</pre>
            </div>

            <el-collapse class="mt">
              <el-collapse-item
                :title="`被过滤掉的主管 token：${tokenResult.filtered.tokens} 条 / ${tokenResult.filtered.chars} 字符（点开看乱码长什么样）`"
                name="filtered"
              >
                <pre class="code-block">{{ tokenResult.filtered.sample || '（本次没有产生可见的 JSON 片段）' }}</pre>
                <p class="hint">{{ tokenResult.filter_rule }}</p>
              </el-collapse-item>
            </el-collapse>

            <div class="mt">
              <h5>主管派单时间线（来自 updates 流）</h5>
              <div class="event-list">
                <div v-for="(item, index) in tokenResult.dispatches" :key="index" class="event-row">
                  <el-tag size="small" type="primary" effect="plain">dispatch</el-tag>
                  <span class="mono">+{{ item.offset_ms }}ms</span>
                  <span class="line">→ {{ item.next }}</span>
                </div>
              </div>
            </div>
            <p class="hint">{{ tokenResult.note }}</p>
          </div>

          <Day10Graph title="主管路由 → 专家 → 回主管复命 → FINISH" :structure="tokenResult.graph" />
        </template>
      </el-tab-pane>

      <!-- ③ custom 工具进度 -->
      <el-tab-pane label="③ custom 工具进度" name="custom">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.custom || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="customQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="customQuestion" type="textarea" :rows="2" placeholder="回答前会先检索文档库，工具内部逐条上报进度" />
          <div class="row-actions mt">
            <el-button
              type="primary"
              size="small"
              :loading="customLoading"
              :disabled="!customQuestion.trim()"
              @click="doCustom"
            >
              跑工具进度流
            </el-button>
            <span class="muted">工具执行本来是黑盒：get_stream_writer() 让它边跑边说话</span>
          </div>
        </div>

        <template v-if="customResult">
          <div class="card-block">
            <div class="block-head">
              <h4>检索进度（custom 事件）</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">{{ customResult.progress.length }} 条进度</el-tag>
                <el-tag size="small" effect="plain">首 token {{ customResult.first_token_ms }}ms</el-tag>
                <el-tag size="small" effect="plain">{{ customResult.model }} · {{ customResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <div class="event-list">
              <div v-for="(item, index) in customResult.progress" :key="index" class="event-row">
                <el-tag size="small" type="warning" effect="plain">custom</el-tag>
                <span class="mono">+{{ item.offset_ms }}ms</span>
                <span class="line">
                  {{ item.stage }}
                  <template v-if="item.query">｜query={{ item.query }}</template>
                  <template v-if="item.doc">｜{{ item.doc }}</template>
                  <template v-if="item.total !== undefined">｜共 {{ item.total }} 条</template>
                </span>
              </div>
            </div>
            <p class="hint">{{ customResult.protocol_note }}</p>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>token 输出（messages 事件）</h4>
              <el-button size="small" text type="primary" @click="replayCustom">
                打字机回放
              </el-button>
            </div>
            <pre class="code-block">{{ customReplay || customText }}</pre>
            <p class="hint">{{ customResult.note }}</p>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>最终回答</h4>
              <el-tag size="small" effect="plain">{{ customResult.tool_results.length }} 次工具返回</el-tag>
            </div>
            <pre class="code-block">{{ customResult.final_answer }}</pre>
            <el-table class="mt" :data="customResult.tool_results" size="small" max-height="240">
              <el-table-column prop="node" label="节点" width="90" />
              <el-table-column label="观察结果" min-width="420">
                <template #default="{ row }">
                  <span class="line">{{ row.content }}</span>
                </template>
              </el-table-column>
              <el-table-column label="偏移" width="90">
                <template #default="{ row }">+{{ row.offset_ms }}ms</template>
              </el-table-column>
            </el-table>
          </div>

          <Day10Graph title="文档助手：agent ⇄ tools（工具内上报进度）" :structure="customResult.graph" />
        </template>
      </el-tab-pane>

      <!-- ④ interrupt + 流式 -->
      <el-tab-pane label="④ interrupt + 流式（今天的坑）" name="interrupt">
        <div class="card-block">
          <div class="row-actions">
            <span class="field-inline">
              <span class="muted">退款金额</span>
              <el-input-number v-model="interruptAmount" size="small" :min="1" :max="99999" />
            </span>
            <el-radio-group v-model="interruptDecision" size="small">
              <el-radio-button value="approve">放行</el-radio-button>
              <el-radio-button value="reject">驳回</el-radio-button>
              <el-radio-button value="patch">改金额放行</el-radio-button>
            </el-radio-group>
            <span v-if="interruptDecision === 'patch'" class="field-inline">
              <span class="muted">改成</span>
              <el-input-number v-model="interruptPatch" size="small" :min="1" :max="99999" />
            </span>
            <el-switch v-model="interruptResume" size="small" active-text="演示 resume 续跑" />
          </div>
          <div class="row-actions mt">
            <el-button type="primary" size="small" :loading="interruptLoading" @click="doInterrupt">
              跑对照实验
            </el-button>
            <span class="muted">不调用模型：退款节点只做 interrupt + 记账，结果完全确定</span>
          </div>
        </div>

        <template v-if="interruptResult">
          <div class="grid-2">
            <div class="sub-card danger-card">
              <div class="block-head">
                <h5>❌ 只订 messages</h5>
                <div class="meta-row">
                  <el-tag size="small" type="danger" effect="plain">{{ interruptResult.messages_only.event_count }} 条事件</el-tag>
                  <el-tag size="small" :type="interruptResult.messages_only.paused ? 'warning' : 'success'" effect="plain">
                    {{ interruptResult.messages_only.paused ? '图已暂停' : '未暂停' }}
                  </el-tag>
                  <el-tag size="small" type="danger" effect="plain">
                    interrupt_seen = {{ interruptResult.messages_only.interrupt_seen }}
                  </el-tag>
                </div>
              </div>
              <el-alert type="error" :closable="false" :title="interruptResult.messages_only.verdict" />
              <p class="hint">
                next = {{ (interruptResult.messages_only.next || []).join(' → ') || '（空）' }}；
                前端还在等 token，审批框永远不会弹出来。
              </p>
            </div>

            <div class="sub-card ok-card">
              <div class="block-head">
                <h5>✅ messages + updates</h5>
                <div class="meta-row">
                  <el-tag size="small" type="success" effect="plain">{{ interruptResult.with_updates.event_count }} 条事件</el-tag>
                  <el-tag size="small" :type="interruptResult.with_updates.paused ? 'warning' : 'success'" effect="plain">
                    {{ interruptResult.with_updates.paused ? '已暂停（等审批）' : '未暂停' }}
                  </el-tag>
                  <el-tag size="small" type="success" effect="plain">
                    interrupt_seen = {{ interruptResult.with_updates.interrupt_seen }}
                  </el-tag>
                </div>
              </div>
              <el-alert type="success" :closable="false" :title="interruptResult.with_updates.verdict" />
              <pre class="code-block mt">{{ JSON.stringify(interruptResult.with_updates.interrupt, null, 2) }}</pre>
            </div>
          </div>

          <div class="card-block">
            <h4>双订阅收到的事件序列</h4>
            <el-table :data="interruptResult.with_updates.events" size="small">
              <el-table-column prop="seq" label="#" width="46" />
              <el-table-column prop="mode" label="来源" width="100" />
              <el-table-column prop="node" label="节点" width="150" />
              <el-table-column prop="kind" label="类型" width="100" />
              <el-table-column label="内容" min-width="380">
                <template #default="{ row }">
                  <span class="line">{{ typeof row.content === 'string' ? row.content : JSON.stringify(row.content) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="偏移" width="90">
                <template #default="{ row }">+{{ row.offset_ms }}ms</template>
              </el-table-column>
            </el-table>
          </div>

          <div v-if="interruptResult.resume" class="card-block">
            <div class="block-head">
              <h4>resume 续跑（Command(resume=...)）</h4>
              <div class="meta-row">
                <el-tag size="small" :type="interruptResult.resume.paused ? 'warning' : 'success'" effect="plain">
                  {{ interruptResult.resume.paused ? '仍暂停' : '已跑完' }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ interruptResult.resume.events.length }} 条事件</el-tag>
              </div>
            </div>
            <pre class="code-block">{{ interruptResult.resume.final_answer }}</pre>
            <el-table class="mt" :data="interruptResult.refunds" size="small" empty-text="没有退款流水（被驳回）">
              <el-table-column prop="amount" label="金额" width="100" />
              <el-table-column label="人工改过金额" width="130">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.patched ? 'warning' : 'info'" effect="plain">
                    {{ row.patched ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="note" label="审批备注" min-width="200" />
            </el-table>
            <p class="hint">节点被重放过，但它里面只有 interrupt，副作用写在 resume 之后——所以只扣一次款。</p>
          </div>

          <div class="card-block">
            <h4>四条铁律</h4>
            <ul class="rule-list">
              <li v-for="item in interruptResult.rules" :key="item">{{ item }}</li>
            </ul>
            <p class="hint">{{ interruptResult.note }}</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ SSE 实测 -->
      <el-tab-pane label="⑤ SSE 实测（真流式）" name="sse">
        <div class="card-block">
          <div class="preset-row">
            <el-tag
              v-for="item in mapping?.presets?.sse || []"
              :key="item"
              class="preset"
              effect="plain"
              @click="sseQuestion = item"
            >
              {{ item }}
            </el-tag>
          </div>
          <el-input v-model="sseQuestion" type="textarea" :rows="2" placeholder="浏览器用 EventSource 直连 /day13/sse/chat，逐帧收 token" />
          <div class="row-actions mt">
            <el-button type="primary" size="small" :loading="sseRunning" :disabled="!sseQuestion.trim()" @click="doSse">
              开始流式
            </el-button>
            <el-button size="small" :disabled="!sseRunning" @click="stopSse()">停止</el-button>
            <span class="muted">真·网络流：帧尾 \n\n + ensure_ascii=False + X-Accel-Buffering: no</span>
          </div>
        </div>

        <div class="card-block">
          <div class="block-head">
            <h4>实时输出</h4>
            <div class="meta-row">
              <el-tag size="small" effect="plain">已收事件 {{ sseFrames }}</el-tag>
              <el-tag v-if="sseFirstToken !== null" size="small" type="success" effect="plain">
                首 token {{ sseFirstToken }}ms
              </el-tag>
              <el-tag v-if="sseRunning" size="small" type="warning" effect="plain">streaming…</el-tag>
              <el-tag v-if="sseStats" size="small" effect="plain">
                {{ sseStats.chars }} 字符 / {{ sseStats.elapsed_ms }}ms
              </el-tag>
            </div>
          </div>
          <pre class="code-block live">{{ sseText }}<span v-if="sseRunning" class="cursor">▌</span></pre>
          <p class="hint">
            EventSource 收到每个 <code>data: {json}</code> 就触发一次 onmessage；done 帧之后由页面主动 close()。
          </p>
        </div>

        <div class="card-block">
          <div class="block-head">
            <h4>事件日志（表格只留前 60 行；token 抽样记录）</h4>
            <el-tag size="small" effect="plain">累计 {{ sseFrames }} 个事件</el-tag>
          </div>
          <el-table :data="sseLog" size="small" max-height="320" empty-text="点「开始流式」后这里会逐帧长出来">
            <el-table-column label="偏移" width="90">
              <template #default="{ row }">+{{ row.ms }}ms</template>
            </el-table-column>
            <el-table-column label="type" width="110">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="{ token: 'success', node_start: 'info', done: 'primary', error: 'danger' }[row.type] || 'info'"
                  effect="plain"
                >
                  {{ row.type }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="内容" min-width="380">
              <template #default="{ row }">
                <span class="mono">{{ row.detail }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 13 实验台：流式输出——四模式对照 / 多 Agent token 分流 / custom 工具进度 / interrupt + 流式 / SSE 实测
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDay13Mapping,
  listChatModels,
  openDay13Sse,
  runDay13CustomStream,
  runDay13InterruptStream,
  runDay13Modes,
  runDay13TokenStream
} from '@/api/study'
import Day10Graph from './Day10Graph.vue'

const mapping = ref(null)
const models = ref([])
const modelId = ref(null)
const subTab = ref('modes')

// ① 四模式对照
const modesQuestion = ref('用一句话解释什么是 RAG')
const modesLoading = ref(false)
const modesResult = ref(null)
const modesReplay = ref('')

// ② 多 Agent token 分流
const tokenQuestion = ref('对比一下向量检索和 BM25 的优劣')
const tokenLoading = ref(false)
const tokenResult = ref(null)
const bubbleReplay = ref([])

// ③ custom 工具进度
const customQuestion = ref('LangGraph 的断点续跑是怎么实现的？')
const customLoading = ref(false)
const customResult = ref(null)
const customReplay = ref('')

// ④ interrupt + 流式
const interruptAmount = ref(199)
const interruptDecision = ref('approve')
const interruptPatch = ref(150)
const interruptResume = ref(true)
const interruptLoading = ref(false)
const interruptResult = ref(null)

// ⑤ SSE 实测
const sseQuestion = ref('用三句话介绍一下 SSE 流式输出')
const sseRunning = ref(false)
const sseText = ref('')
const sseLog = ref([])
const sseFrames = ref(0)
const sseFirstToken = ref(null)
const sseStats = ref(null)
let sse = null
let sseStart = 0

// 打字机回放：replaySeq 当世代号，新回放一开始旧循环就自动作废
const replaying = ref(false)
let replaySeq = 0

const pitfalls = computed(() => mapping.value?.pitfalls || [])
// messages 流里除掉主管的 JSON 碎片，就是用户真正该看到的 token
const visibleTokens = computed(() =>
  (modesResult.value?.messages || []).filter((row) => row.node !== 'supervisor')
)
const visibleText = computed(() => visibleTokens.value.map((row) => row.content).join(''))
const customText = computed(() => (customResult.value?.tokens || []).map((row) => row.content).join(''))

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// 停止所有回放（切换结果 / 卸载时都要调）
const stopReplay = () => {
  replaySeq += 1
  replaying.value = false
}

// 逐字回放一段 token 序列：每 2 个字符 16ms，视觉上接近真实流式
const playText = async (rows, target) => {
  const seq = (replaySeq += 1)
  replaying.value = true
  target.value = ''
  const text = (rows || []).map((row) => row.content || '').join('')
  for (let index = 0; index < text.length; index += 2) {
    if (seq !== replaySeq) return
    target.value = text.slice(0, index + 2)
    await sleep(16)
  }
  if (seq === replaySeq) replaying.value = false
}

// 模板里的两个回放入口：模板拿到的是解包后的值，不能直接传 ref，所以包一层
const replayModes = () => playText(visibleTokens.value, modesReplay)
const replayCustom = () => playText(customResult.value?.tokens || [], customReplay)

// 逐泡回放：同一个气泡的 token 连续吐出，模拟"不同专家依次说话"
const playBubbles = async (bubbles) => {
  const seq = (replaySeq += 1)
  replaying.value = true
  bubbleReplay.value = (bubbles || []).map(() => '')
  for (let index = 0; index < (bubbles || []).length; index += 1) {
    const text = bubbles[index].text || ''
    for (let pos = 0; pos < text.length; pos += 2) {
      if (seq !== replaySeq) return
      bubbleReplay.value[index] = text.slice(0, pos + 2)
      await sleep(14)
    }
  }
  if (seq === replaySeq) replaying.value = false
}

// ① 四模式对照：一次请求拿全部现场
const doModes = async () => {
  modesLoading.value = true
  stopReplay()
  modesReplay.value = ''
  try {
    modesResult.value = await runDay13Modes({
      question: modesQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    modesLoading.value = false
  }
}

// ② 多 Agent token 分流
const doToken = async () => {
  tokenLoading.value = true
  stopReplay()
  bubbleReplay.value = []
  try {
    tokenResult.value = await runDay13TokenStream({
      question: tokenQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    tokenLoading.value = false
  }
}

// ③ custom 工具进度
const doCustom = async () => {
  customLoading.value = true
  stopReplay()
  customReplay.value = ''
  try {
    customResult.value = await runDay13CustomStream({
      question: customQuestion.value.trim(),
      model_config_id: modelId.value || undefined
    })
  } finally {
    customLoading.value = false
  }
}

// ④ interrupt + 流式：decision 三种形态与 Day 11/12 保持一致
const doInterrupt = async () => {
  const decision =
    interruptDecision.value === 'approve'
      ? true
      : interruptDecision.value === 'reject'
        ? false
        : { approved: true, amount: interruptPatch.value }
  interruptLoading.value = true
  try {
    interruptResult.value = await runDay13InterruptStream({
      amount: interruptAmount.value,
      decision,
      with_resume: interruptResume.value
    })
  } finally {
    interruptLoading.value = false
  }
}

// ⑤ SSE：EventSource 逐帧消费，done 之后主动关闭
const doSse = () => {
  stopSse()
  sseText.value = ''
  sseLog.value = []
  sseFrames.value = 0
  sseFirstToken.value = null
  sseStats.value = null
  sseRunning.value = true
  sseStart = performance.now()
  let tokenFrames = 0

  sse = openDay13Sse(
    { question: sseQuestion.value.trim(), model_config_id: modelId.value || undefined },
    {
      onNodeStart: (data) => {
        sseFrames.value += 1
        pushSseLog('node_start', data.node)
      },
      onToken: (data) => {
        tokenFrames += 1
        sseFrames.value += 1
        if (sseFirstToken.value === null) sseFirstToken.value = Math.round(performance.now() - sseStart)
        sseText.value += data.content
        // 每 10 个 token 记一行，避免日志表被几百帧撑爆（帧数本身仍然全量计数）
        if (tokenFrames % 10 === 1) pushSseLog('token', `${data.node}｜${sseText.value.slice(-24)}`)
      },
      onDone: (data) => {
        sseStats.value = data
        sseFrames.value += 1
        pushSseLog('done', `${data.chars} 字符 / 首 token ${data.first_token_ms}ms`)
        stopSse()
      },
      onError: (data) => {
        sseFrames.value += 1
        pushSseLog('error', data.message)
        ElMessage.error(data.message)
        stopSse()
      }
    }
  )
}

// 记一帧日志（表格只留前 60 行；帧数由调用方累加，token 会被抽样记录）
const pushSseLog = (type, detail) => {
  if (sseLog.value.length >= 60) return
  sseLog.value.push({ ms: Math.round(performance.now() - sseStart), type, detail: String(detail) })
}

// 关闭 EventSource（重复调用安全）
const stopSse = () => {
  if (sse) {
    sse.close()
    sse = null
  }
  sseRunning.value = false
}

onMounted(async () => {
  try {
    mapping.value = await getDay13Mapping()
  } catch {
    // 概念表加载失败不阻塞实验区
  }
  try {
    models.value = await listChatModels()
  } catch {
    // 模型列表失败时后端会给出明确错误
  }
})

// 离开页面时把回放定时器和 SSE 连接都收掉，避免后台继续跑
onUnmounted(() => {
  stopReplay()
  stopSse()
})
</script>

<style lang="scss" scoped>
.day13 {
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

  .grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    gap: 10px;
  }

  .sub-card {
    padding: 10px 12px;
    border: 1px solid #eceef6;
    border-radius: $radius-sm;
    background: #fbfcff;

    &.danger-card {
      border-color: #f5c6c6;
      background: #fff8f8;
    }

    &.ok-card {
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

  .field-inline {
    display: inline-flex;
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

    &.live {
      min-height: 96px;
      background: #1f2233;
      color: #e6e8f2;
    }
  }

  // 流式光标：一块竖条，闪一下表示"还在生成"
  .cursor {
    display: inline-block;
    margin-left: 2px;
    animation: blink 1s step-end infinite;
  }

  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
}
</style>
