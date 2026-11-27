<template>
  <div class="day20">
    <el-alert
      class="tip"
      type="error"
      :closable="false"
      show-icon
      title="昨天解决「不出事」（架构正确），今天解决「出了事也像没出事一样」（故障正确）：失败被预期、被分类、被编排"
    />

    <!-- 概念区 -->
    <div class="card-block">
      <h4>第一步：先分类，再行动（2.1）</h4>
      <el-table :data="mapping?.error_classes || []" size="small" empty-text="加载中…">
        <el-table-column prop="no" label="#" width="42" />
        <el-table-column prop="cls" label="类别" width="120" />
        <el-table-column prop="action" label="动作" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="actionType(row.action)" effect="plain">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="examples" label="例子" min-width="260" />
        <el-table-column prop="why" label="理由" min-width="320">
          <template #default="{ row }">
            <span class="line">{{ row.why }}</span>
          </template>
        </el-table-column>
      </el-table>
      <p class="hint">
        429 有两副面孔：它同时是「瞬态可重试」和「需要降速」的信号。Day 19 你是限流的发起方，
        今天站在被限流的一侧——不尊重
        <code>Retry-After</code> 的重试风暴会让限流更狠。
      </p>
    </div>

    <div class="card-block">
      <el-collapse>
        <el-collapse-item title="重试三要素 / 降级阶梯 / 退出时序（§2–§4）" name="concepts">
          <el-table :data="mapping?.retry_rules || []" size="small">
            <el-table-column prop="no" label="#" width="42" />
            <el-table-column prop="element" label="要素" width="110" />
            <el-table-column prop="formula" label="公式" width="300" />
            <el-table-column prop="why" label="为什么" min-width="360">
              <template #default="{ row }">
                <span class="line">{{ row.why }}</span>
              </template>
            </el-table-column>
          </el-table>

          <el-table class="mt" :data="mapping?.ladder_levels || []" size="small">
            <el-table-column prop="level" label="级别" width="60" />
            <el-table-column prop="model" label="谁在答" width="180" />
            <el-table-column prop="trigger" label="触发条件" width="180" />
            <el-table-column prop="sacrifice" label="牺牲了什么" min-width="340">
              <template #default="{ row }">
                <span class="line">{{ row.sacrifice }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="degraded" label="degraded" width="90" />
          </el-table>

          <el-table class="mt" :data="mapping?.shutdown_steps || []" size="small">
            <el-table-column prop="no" label="" width="42" />
            <el-table-column prop="stage" label="步骤" width="110" />
            <el-table-column prop="detail" label="做什么" min-width="360">
              <template #default="{ row }">
                <span class="line">{{ row.detail }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="if_skipped" label="不做会怎样" min-width="320">
              <template #default="{ row }">
                <span class="line">{{ row.if_skipped }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>

        <el-collapse-item title="三道天花板 / SLO 最小集 / 告警三原则（§5–§6）" name="ops">
          <el-table :data="mapping?.capacity_ceilings || []" size="small">
            <el-table-column prop="name" label="天花板" width="110" />
            <el-table-column prop="formula" label="怎么算" min-width="280" />
            <el-table-column prop="source" label="数据来自" width="160" />
            <el-table-column prop="why" label="为什么容易漏" min-width="320">
              <template #default="{ row }">
                <span class="line">{{ row.why }}</span>
              </template>
            </el-table-column>
          </el-table>
          <el-table class="mt" :data="mapping?.slo_table || []" size="small">
            <el-table-column prop="sli" label="SLI" width="160" />
            <el-table-column prop="slo" label="SLO" width="180" />
            <el-table-column prop="source" label="数据来源" width="220" />
            <el-table-column prop="why" label="为什么重要" min-width="320">
              <template #default="{ row }">
                <span class="line">{{ row.why }}</span>
              </template>
            </el-table-column>
          </el-table>
          <el-table class="mt" :data="mapping?.alert_principles || []" size="small">
            <el-table-column prop="no" label="#" width="42" />
            <el-table-column prop="name" label="原则" width="180" />
            <el-table-column prop="detail" label="怎么做" min-width="340">
              <template #default="{ row }">
                <span class="line">{{ row.detail }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="why" label="为什么" min-width="300">
              <template #default="{ row }">
                <span class="line">{{ row.why }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-collapse-item>

        <el-collapse-item :title="`坑 / 速查表 / 演练红线（第 8 节，${pitfalls.length} 条坑）`" name="cheatsheet">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="42" />
            <el-table-column prop="title" label="坑" width="200" />
            <el-table-column prop="symptom" label="现象" min-width="320">
              <template #default="{ row }">
                <span class="line">{{ row.symptom }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="fix" label="修法" min-width="340">
              <template #default="{ row }">
                <span class="line">{{ row.fix }}</span>
              </template>
            </el-table-column>
          </el-table>
          <el-table class="mt" :data="mapping?.cheatsheet || []" size="small">
            <el-table-column prop="topic" label="问题" width="160" />
            <el-table-column prop="content" label="方案" min-width="340">
              <template #default="{ row }">
                <span class="line">{{ row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="key" label="关键点" min-width="300">
              <template #default="{ row }">
                <span class="line">{{ row.key }}</span>
              </template>
            </el-table-column>
          </el-table>
          <div class="two-col mt">
            <div>
              <h5>演练红线</h5>
              <ul class="rule-list">
                <li v-for="item in mapping?.chaos_redlines || []" :key="item">{{ item }}</li>
              </ul>
            </div>
            <div>
              <h5>告警 runbook（没有它的告警等于没有告警）</h5>
              <div v-for="(items, key) in mapping?.runbooks || {}" :key="key">
                <el-tag size="small" effect="plain">{{ key }}</el-tag>
                <ul class="rule-list">
                  <li v-for="item in items" :key="item">{{ item }}</li>
                </ul>
              </div>
              <p class="hint mono">依赖：{{ versionText }}</p>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 故障分层与重试 -->
      <el-tab-pane label="① 分类与重试" name="retry">
        <div class="card-block">
          <div class="form-grid">
            <div class="field">
              <span class="label">异常场景</span>
              <el-select v-model="retryForm.scenario" size="small" style="width: 200px">
                <el-option label="瞬态（超时 / 5xx）" value="transient" />
                <el-option label="429 限流" value="rate_limit" />
                <el-option label="确定性（400 / 401）" value="permanent" />
                <el-option label="解析失败（回填 prompt）" value="invalid_output" />
                <el-option label="未知异常" value="unknown" />
              </el-select>
            </div>
            <div class="field">
              <span class="label">前几次失败</span>
              <el-input-number v-model="retryForm.fail_times" :min="0" :max="6" size="small" />
            </div>
            <div class="field">
              <span class="label">重试上限</span>
              <el-input-number v-model="retryForm.max_attempts" :min="1" :max="6" size="small" />
            </div>
            <div class="field">
              <span class="label">退避基数（ms）</span>
              <el-input-number v-model="retryForm.base_ms" :min="50" :max="5000" :step="50" size="small" />
            </div>
            <div class="field">
              <span class="label">等待上限（ms）</span>
              <el-input-number v-model="retryForm.cap_ms" :min="500" :max="60000" :step="500" size="small" />
            </div>
            <div class="field">
              <span class="label">Retry-After（ms）</span>
              <el-input-number v-model="retryForm.retry_after_ms" :min="0" :max="60000" :step="500" size="small" />
            </div>
            <div class="field">
              <span class="label">run 已用调用</span>
              <el-input-number v-model="retryForm.llm_calls" :min="0" :max="100" size="small" />
            </div>
            <div class="field">
              <span class="label">run 已耗时（s）</span>
              <el-input-number v-model="retryForm.elapsed_s" :min="0" :max="600" size="small" />
            </div>
            <div class="field">
              <span class="label">随机种子</span>
              <el-input-number v-model="retryForm.seed" :min="0" :max="9999" size="small" />
            </div>
            <div class="field">
              <el-button type="primary" size="small" :loading="retryLoading" @click="doRetry">跑重试实验</el-button>
            </div>
          </div>
          <p class="hint">
            等待是<b>模拟</b>的（只累加毫秒，不真 sleep）：既能看退避曲线，又不会让页面盯上几十秒。
          </p>
        </div>

        <template v-if="retry">
          <div class="card-block">
            <div class="block-head">
              <h5>分类结论</h5>
              <el-tag size="small" :type="actionType(retry.classification.action)" effect="dark">
                {{ retry.classification.action }}
              </el-tag>
            </div>
            <el-descriptions :column="2" size="small" border>
              <el-descriptions-item label="异常类型">{{ retry.classification.type }}</el-descriptions-item>
              <el-descriptions-item label="最终出口">
                <el-tag size="small" :type="retry.summary.final === 'ok' ? 'success' : retry.summary.final === 'fail' ? 'danger' : 'warning'">
                  {{ retry.summary.final }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="说明" :span="2">{{ retry.classification.why }}</el-descriptions-item>
            </el-descriptions>

            <el-table class="mt" :data="retry.timeline" size="small">
              <el-table-column prop="attempt" label="第几次" width="80" />
              <el-table-column label="结果" width="80">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.outcome === 'ok' ? 'success' : 'danger'" effect="plain">
                    {{ row.outcome }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="wait_ms" label="等待(ms)" width="90" />
              <el-table-column prop="retry_after_ms" label="Retry-After" width="110" />
              <el-table-column prop="detail" label="发生了什么" min-width="300">
                <template #default="{ row }">
                  <span class="line">{{ row.detail }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="prompt_patch" label="prompt 回填" min-width="280">
                <template #default="{ row }">
                  <span class="line">{{ row.prompt_patch || '—' }}</span>
                </template>
              </el-table-column>
            </el-table>

            <el-alert
              class="mt"
              :type="retry.budget.within_budget ? 'success' : 'error'"
              :closable="false"
              show-icon
              :title="`run 级总预算：调用 ${retry.budget.llm_calls_used}/${retry.budget.max_llm_calls}，墙钟 ${retry.budget.wall_seconds_used}s/${retry.budget.max_wall_seconds}s → ${retry.budget.within_budget ? '在预算内' : '已越界，必须走降级'}`"
            />
            <p class="hint">{{ retry.summary.final_note }}｜{{ retry.budget.note }}</p>
          </div>

          <div class="two-col">
            <div class="card-block">
              <div class="block-head">
                <h5>裸重试（同步脉冲）</h5>
                <el-tag size="small" type="danger" effect="plain">峰值占比 {{ retry.pulse.sync.peak_share }}</el-tag>
              </div>
              <el-table :data="retry.pulse.sync.buckets" size="small" max-height="200">
                <el-table-column prop="range" label="等待区间" />
                <el-table-column prop="count" label="run 数" width="90" />
              </el-table>
              <p class="hint">50 个并发 run 全部落在同一个毫秒：提供商一抖，你的重试就是第二波 DDoS。</p>
            </div>
            <div class="card-block">
              <div class="block-head">
                <h5>带抖动（被摊开）</h5>
                <el-tag size="small" type="success" effect="plain">
                  峰值占比 {{ retry.pulse.jittered.peak_share }} / 宽度 {{ retry.pulse.jittered.spread_ms }}ms
                </el-tag>
              </div>
              <el-table :data="retry.pulse.jittered.buckets" size="small" max-height="200">
                <el-table-column prop="range" label="等待区间" />
                <el-table-column prop="count" label="run 数" width="90" />
              </el-table>
              <p class="hint">{{ retry.pulse.note }}</p>
            </div>
          </div>

          <div class="card-block">
            <h4>要点</h4>
            <ul class="rule-list">
              <li v-for="item in retry.notes" :key="item">{{ item }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ② 降级阶梯 -->
      <el-tab-pane label="② 降级阶梯" name="ladder">
        <div class="card-block">
          <div class="form-grid">
            <div class="field wide">
              <span class="label">用户问题</span>
              <el-input v-model="ladderForm.query" size="small" />
            </div>
            <div class="field">
              <span class="label">主模型已恢复</span>
              <el-switch v-model="ladderForm.primary_ok" />
            </div>
            <div class="field">
              <span class="label">主模型失败次数</span>
              <el-input-number v-model="ladderForm.primary_fail_times" :min="1" :max="6" size="small" />
            </div>
            <div class="field">
              <span class="label">备模型可用</span>
              <el-switch v-model="ladderForm.fallback_ok" />
            </div>
            <div class="field">
              <span class="label">备模型支持 FC</span>
              <el-switch v-model="ladderForm.fallback_supports_tools" />
            </div>
            <div class="field">
              <span class="label">本次需要工具</span>
              <el-switch v-model="ladderForm.needs_tools" />
            </div>
            <div class="field">
              <span class="label">缓存命中</span>
              <el-switch v-model="ladderForm.cache_hit" />
            </div>
            <div class="field">
              <span class="label">探活阈值（连续成功）</span>
              <el-input-number v-model="ladderForm.recover_after" :min="1" :max="6" size="small" />
            </div>
            <div class="field">
              <span class="label">探活序列（1 成功 / 0 失败）</span>
              <el-input v-model="probeText" size="small" style="width: 200px" />
            </div>
            <div class="field">
              <el-button type="primary" size="small" :loading="ladderLoading" @click="doLadder">跑降级阶梯</el-button>
            </div>
          </div>
          <p class="hint">
            纯逻辑（不调模型）：主路 / 备路 / 缓存是否可用都是参数，同一个降级链可以反复复现，不花一分钱 token。
          </p>
        </div>

        <template v-if="ladder">
          <div class="card-block">
            <h4>逐级尝试</h4>
            <el-table :data="ladder.attempts" size="small">
              <el-table-column prop="level" label="级别" width="70" />
              <el-table-column prop="model" label="谁" width="140" />
              <el-table-column label="结果" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.result === 'ok' ? 'success' : row.result === 'skipped' ? 'warning' : 'danger'" effect="plain">
                    {{ row.result }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="detail" label="说明" min-width="420">
                <template #default="{ row }">
                  <span class="line">{{ row.detail }}</span>
                </template>
              </el-table-column>
            </el-table>

            <el-alert
              class="mt"
              :type="ladder.final.degraded ? 'warning' : 'success'"
              :closable="false"
              show-icon
              :title="`最终交付：L${ladder.final.level}｜degraded=${ladder.final.degraded}｜reason=${ladder.final.reason || '—'}`"
            >
              {{ ladder.final.answer }}
            </el-alert>
          </div>

          <div class="two-col">
            <div class="card-block">
              <div class="block-head">
                <h5>缓存铁律</h5>
                <el-tag size="small" :type="ladder.cache.written ? 'success' : 'danger'" effect="plain">
                  {{ ladder.cache.written ? '已写入' : '拒绝写入' }}
                </el-tag>
              </div>
              <p class="line">{{ ladder.cache.rule }}</p>
              <p class="hint">缓存内容：{{ ladder.cache.store.length ? ladder.cache.store.join(' / ') : '（空）' }}</p>
              <p class="hint">{{ ladder.cache.second_query }}</p>
            </div>
            <div class="card-block">
              <h5>探活窗口（防乒乓）</h5>
              <el-table :data="ladder.probe" size="small" max-height="240">
                <el-table-column prop="step" label="第几次" width="80" />
                <el-table-column label="主路" width="80">
                  <template #default="{ row }">{{ row.primary_ok ? '成功' : '失败' }}</template>
                </el-table-column>
                <el-table-column prop="consec_ok" label="连续成功" width="90" />
                <el-table-column label="当前" width="90">
                  <template #default="{ row }">
                    <el-tag size="small" :type="row.degraded ? 'warning' : 'success'" effect="plain">
                      {{ row.degraded ? '降级' : 'L0' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="note" label="说明" min-width="140" />
              </el-table>
            </div>
          </div>

          <div class="card-block">
            <h4>要点</h4>
            <ul class="rule-list">
              <li v-for="item in ladder.notes" :key="item">{{ item }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ③ 优雅退出 -->
      <el-tab-pane label="③ 优雅退出" name="shutdown">
        <div class="card-block">
          <div class="form-grid">
            <div class="field">
              <span class="label">drain 窗口（s）</span>
              <el-input-number v-model="shutdownForm.grace_seconds" :min="1" :max="120" size="small" />
            </div>
            <div class="field">
              <span class="label">preStop sleep（s）</span>
              <el-input-number v-model="shutdownForm.prestop_sleep_s" :min="0" :max="60" size="small" />
            </div>
            <div class="field">
              <span class="label">规则传播延迟（s）</span>
              <el-input-number v-model="shutdownForm.lb_propagation_s" :min="0" :max="60" size="small" />
            </div>
            <div class="field">
              <span class="label">SIGTERM 后新请求</span>
              <el-input-number v-model="shutdownForm.new_requests" :min="0" :max="50" size="small" />
            </div>
            <div class="field">
              <span class="label">flush trace</span>
              <el-switch v-model="shutdownForm.flush_trace" />
            </div>
            <div class="field">
              <el-button type="primary" size="small" :loading="shutdownLoading" @click="doShutdown">
                发一次 SIGTERM
              </el-button>
            </div>
          </div>

          <h5 class="mt">在途 run 清单</h5>
          <el-table :data="shutdownForm.runs" size="small">
            <el-table-column label="run_id" width="140">
              <template #default="{ row }">
                <el-input v-model="row.run_id" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="还要跑（s）" width="160">
              <template #default="{ row }">
                <el-input-number v-model="row.remaining_s" :min="0" :max="600" size="small" />
              </template>
            </el-table-column>
            <el-table-column label="有 checkpointer" width="150">
              <template #default="{ row }">
                <el-switch v-model="row.checkpointed" />
              </template>
            </el-table-column>
            <el-table-column label="操作">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="removeRun($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-button class="mt" size="small" @click="addRun">再加一个 run</el-button>
        </div>

        <template v-if="shutdown">
          <div class="card-block">
            <div class="block-head">
              <h4>退出时间线</h4>
              <el-tag size="small" :type="shutdown.verdict.startsWith('可通过') ? 'success' : 'danger'">
                {{ shutdown.verdict }}
              </el-tag>
            </div>
            <el-table :data="shutdown.timeline" size="small" max-height="300">
              <el-table-column prop="t" label="t(s)" width="70" />
              <el-table-column prop="stage" label="阶段" width="150" />
              <el-table-column prop="detail" label="发生了什么" min-width="500">
                <template #default="{ row }">
                  <span class="line">{{ row.detail }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="card-block">
            <h4>每个 run 的结局</h4>
            <el-table :data="shutdown.runs" size="small">
              <el-table-column prop="run_id" label="run" width="100" />
              <el-table-column prop="remaining_s" label="还要跑(s)" width="100" />
              <el-table-column label="checkpointer" width="120">
                <template #default="{ row }">{{ row.checkpointed ? '有' : '无' }}</template>
              </el-table-column>
              <el-table-column label="结局" width="130">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.outcome === 'completed' ? 'success' : row.outcome === 'checkpointed' ? 'warning' : 'danger'" effect="plain">
                    {{ row.outcome }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="能续跑" width="90">
                <template #default="{ row }">{{ row.resumable ? '能' : '不能' }}</template>
              </el-table-column>
              <el-table-column prop="detail" label="说明" min-width="420">
                <template #default="{ row }">
                  <span class="line">{{ row.detail }}</span>
                </template>
              </el-table-column>
            </el-table>
            <el-descriptions class="mt" :column="6" size="small" border>
              <el-descriptions-item label="受理">{{ shutdown.counters.accepted }}</el-descriptions-item>
              <el-descriptions-item label="503 拒绝">{{ shutdown.counters.rejected_503 }}</el-descriptions-item>
              <el-descriptions-item label="跑完">{{ shutdown.counters.completed }}</el-descriptions-item>
              <el-descriptions-item label="落盘可续">{{ shutdown.counters.checkpointed }}</el-descriptions-item>
              <el-descriptions-item label="被撕碎">{{ shutdown.counters.shattered }}</el-descriptions-item>
              <el-descriptions-item label="漏进来的请求">{{ shutdown.counters.leaked }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="card-block">
            <h4>编排器配置（可直接抄）</h4>
            <pre class="code-box">{{ shutdown.k8s_snippet }}</pre>
            <ul class="rule-list">
              <li v-for="item in shutdown.notes" :key="item">{{ item }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ 容量 -->
      <el-tab-pane label="④ 容量与压测" name="capacity">
        <div class="card-block">
          <div class="form-grid">
            <div class="field">
              <span class="label">月预算（$）</span>
              <el-input-number v-model="capacityForm.monthly_budget" :min="1" :max="10000000" :step="10000" size="small" />
            </div>
            <div class="field">
              <span class="label">单 run 成本（$）</span>
              <el-input-number v-model="capacityForm.run_cost" :min="0.0001" :max="10" :step="0.001" :precision="4" size="small" />
            </div>
            <div class="field">
              <span class="label">上游 RPM</span>
              <el-input-number v-model="capacityForm.rpm" :min="1" :max="1000000" :step="100" size="small" />
            </div>
            <div class="field">
              <span class="label">每 run 调用数</span>
              <el-input-number v-model="capacityForm.calls_per_run" :min="1" :max="50" size="small" />
            </div>
            <div class="field">
              <span class="label">单 run 停留（s）</span>
              <el-input-number v-model="capacityForm.latency_s" :min="0.5" :max="600" :step="0.5" size="small" />
            </div>
            <div class="field">
              <span class="label">副本数</span>
              <el-input-number v-model="capacityForm.replicas" :min="1" :max="64" size="small" />
            </div>
            <div class="field">
              <span class="label">余量</span>
              <el-input-number v-model="capacityForm.headroom" :min="0" :max="1" :step="0.05" :precision="2" size="small" />
            </div>
            <div class="field">
              <span class="label">单副本机器并发</span>
              <el-input-number v-model="capacityForm.machine_conc_per_replica" :min="1" :max="1000" size="small" />
            </div>
            <div class="field">
              <span class="label">拍脑袋的 Semaphore</span>
              <el-input-number v-model="capacityForm.naive_semaphore" :min="1" :max="1000" size="small" />
            </div>
            <div class="field">
              <span class="label">压测到达率（空=推导值）</span>
              <el-input-number v-model="capacityForm.arrival_rps" :min="0" :max="1000" :step="0.5" size="small" />
            </div>
            <div class="field">
              <span class="label">排队上限（s）</span>
              <el-input-number v-model="capacityForm.max_wait_s" :min="0" :max="300" size="small" />
            </div>
            <div class="field">
              <span class="label">压测时长（s）</span>
              <el-input-number v-model="capacityForm.duration_s" :min="10" :max="600" :step="10" size="small" />
            </div>
            <div class="field">
              <el-button type="primary" size="small" :loading="capacityLoading" @click="doCapacity">评估容量</el-button>
            </div>
          </div>
        </div>

        <template v-if="capacity">
          <div class="card-block">
            <div class="block-head">
              <h4>三道天花板</h4>
              <el-tag size="small" type="danger" effect="dark">瓶颈：{{ capacity.ceilings.binding }}</el-tag>
            </div>
            <el-table :data="capacity.ceilings.rows" size="small">
              <el-table-column prop="name" label="天花板" width="120" />
              <el-table-column prop="formula" label="算式" min-width="300" />
              <el-table-column label="能撑" width="140">
                <template #default="{ row }">{{ row.value }} {{ row.unit }}</template>
              </el-table-column>
            </el-table>
            <el-descriptions class="mt" :column="3" size="small" border>
              <el-descriptions-item label="目标吞吐">{{ capacity.ceilings.throughput_rps }} run/s</el-descriptions-item>
              <el-descriptions-item label="需要的并发">{{ capacity.ceilings.concurrency_needed }} 个在途 run</el-descriptions-item>
              <el-descriptions-item label="每副本 Semaphore">{{ capacity.semaphore.per_replica }}</el-descriptions-item>
            </el-descriptions>
            <ul class="rule-list">
              <li v-for="row in capacity.derivation" :key="row.step">{{ row.step }} {{ row.text }}</li>
            </ul>
          </div>

          <div class="two-col">
            <div class="card-block">
              <div class="block-head">
                <h5>Semaphore 对照</h5>
                <el-tag size="small" type="warning" effect="plain">拍脑袋 {{ capacity.semaphore.naive.per_replica }}</el-tag>
              </div>
              <el-descriptions :column="2" size="small" border>
                <el-descriptions-item label="建议（每副本）">{{ capacity.semaphore.per_replica }}</el-descriptions-item>
                <el-descriptions-item label="合计">{{ capacity.semaphore.total }}</el-descriptions-item>
                <el-descriptions-item label="拍脑袋吞吐">{{ capacity.semaphore.naive.throughput_rps }} run/s</el-descriptions-item>
                <el-descriptions-item label="占目标">{{ capacity.semaphore.naive.share_of_target }}</el-descriptions-item>
              </el-descriptions>
              <p class="hint">{{ capacity.semaphore.verdict }}</p>
            </div>
            <div class="card-block">
              <div class="block-head">
                <h5>压测读数</h5>
                <el-tag size="small" :type="capacity.decision.verdict.includes('503') ? 'danger' : capacity.decision.verdict.includes('p95') ? 'warning' : 'success'">
                  {{ capacity.decision.verdict }}
                </el-tag>
              </div>
              <el-descriptions :column="3" size="small" border>
                <el-descriptions-item label="到达率">{{ capacity.load_test.arrival_rps }}/s</el-descriptions-item>
                <el-descriptions-item label="并发位">{{ capacity.load_test.concurrency }}</el-descriptions-item>
                <el-descriptions-item label="利用率">{{ capacity.load_test.utilization }}</el-descriptions-item>
                <el-descriptions-item label="发送">{{ capacity.load_test.sent }}</el-descriptions-item>
                <el-descriptions-item label="完成">{{ capacity.load_test.completed }}</el-descriptions-item>
                <el-descriptions-item label="503">{{ capacity.load_test.rejected_503 }}</el-descriptions-item>
                <el-descriptions-item label="p50">{{ capacity.load_test.p50 }}s</el-descriptions-item>
                <el-descriptions-item label="p95">{{ capacity.load_test.p95 }}s</el-descriptions-item>
                <el-descriptions-item label="p99">{{ capacity.load_test.p99 }}s</el-descriptions-item>
              </el-descriptions>
              <el-alert class="mt" type="info" :closable="false" show-icon :title="capacity.decision.action" />
            </div>
          </div>

          <div class="card-block">
            <h4>要点</h4>
            <ul class="rule-list">
              <li v-for="item in capacity.notes" :key="item">{{ item }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ SLO 与告警 -->
      <el-tab-pane label="⑤ SLO 与告警" name="slo">
        <div class="card-block">
          <div class="form-grid">
            <div class="field">
              <span class="label">合成 run 数</span>
              <el-input-number v-model="sloForm.runs" :min="50" :max="20000" :step="50" size="small" />
            </div>
            <div class="field">
              <span class="label">总时长（min）</span>
              <el-input-number v-model="sloForm.duration_min" :min="60" :max="1440" :step="30" size="small" />
            </div>
            <div class="field">
              <span class="label">事故时长（min）</span>
              <el-input-number v-model="sloForm.incident_min" :min="1" :max="720" :step="10" size="small" />
            </div>
            <div class="field">
              <span class="label">事故失败率</span>
              <el-input-number v-model="sloForm.bad_rate" :min="0" :max="1" :step="0.01" :precision="2" size="small" />
            </div>
            <div class="field">
              <span class="label">事故降级率</span>
              <el-input-number v-model="sloForm.degraded_rate" :min="0" :max="1" :step="0.05" :precision="2" size="small" />
            </div>
            <div class="field">
              <span class="label">事故 p95（s）</span>
              <el-input-number v-model="sloForm.latency_p95_s" :min="0.5" :max="600" :step="1" size="small" />
            </div>
            <div class="field">
              <span class="label">平时失败率</span>
              <el-input-number v-model="sloForm.baseline_bad" :min="0" :max="1" :step="0.001" :precision="3" size="small" />
            </div>
            <div class="field">
              <span class="label">平时降级率</span>
              <el-input-number v-model="sloForm.baseline_degraded" :min="0" :max="1" :step="0.01" :precision="2" size="small" />
            </div>
            <div class="field">
              <span class="label">最小样本量</span>
              <el-input-number v-model="sloForm.min_sample" :min="1" :max="1000" size="small" />
            </div>
            <div class="field">
              <span class="label">随机种子</span>
              <el-input-number v-model="sloForm.seed" :min="0" :max="9999" size="small" />
            </div>
            <div class="field">
              <el-button type="primary" size="small" :loading="sloLoading" @click="doSlo">算烧毁率</el-button>
            </div>
          </div>
          <p class="hint">
            合成的 span 与 Day 15 的 JSONL 同构（含一行坏数据）：同一份 trace 的第三次变现——回放、评估、告警。
          </p>
        </div>

        <template v-if="slo">
          <div class="card-block">
            <div class="block-head">
              <h4>两个窗口的指标与烧毁率</h4>
              <el-tag size="small" :type="alertType(slo.alert.severity)" effect="dark">
                {{ slo.alert.severity }}
              </el-tag>
            </div>
            <el-table :data="slo.windows" size="small">
              <el-table-column prop="window_min" label="窗口(min)" width="100" />
              <el-table-column prop="metrics.n" label="样本数" width="90" />
              <el-table-column label="成功率" width="100">
                <template #default="{ row }">{{ row.metrics.success_rate ?? '样本不足' }}</template>
              </el-table-column>
              <el-table-column label="p95(s)" width="90">
                <template #default="{ row }">{{ row.metrics.p95_latency ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="降级率" width="100">
                <template #default="{ row }">{{ row.metrics.degraded_rate ?? '—' }}</template>
              </el-table-column>
              <el-table-column label="错误烧毁" width="100">
                <template #default="{ row }">
                  <el-tag v-if="row.burn" size="small" :type="row.burn.error_burn >= 14.4 ? 'danger' : row.burn.error_burn >= 6 ? 'warning' : 'success'" effect="plain">
                    {{ row.burn.error_burn }}x
                  </el-tag>
                  <span v-else>—</span>
                </template>
              </el-table-column>
              <el-table-column label="降级烧毁" width="100">
                <template #default="{ row }">
                  <el-tag v-if="row.burn" size="small" :type="row.burn.degraded_burn >= 14.4 ? 'danger' : row.burn.degraded_burn >= 6 ? 'warning' : 'success'" effect="plain">
                    {{ row.burn.degraded_burn }}x
                  </el-tag>
                  <span v-else>—</span>
                </template>
              </el-table-column>
              <el-table-column label="样本守门" min-width="180">
                <template #default="{ row }">
                  <span class="line">{{ row.metrics.insufficient_sample ? '样本不足，不评估（假告警防线）' : '样本充足' }}</span>
                </template>
              </el-table-column>
            </el-table>

            <el-alert
              class="mt"
              :type="alertType(slo.alert.severity)"
              :closable="false"
              show-icon
              :title="`${slo.alert.severity.toUpperCase()}｜${slo.alert.reason}`"
            />
            <div v-if="slo.alert.runbook?.length" class="mt">
              <h5>告警自带 runbook</h5>
              <ul class="rule-list">
                <li v-for="item in slo.alert.runbook" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>

          <div class="card-block">
            <h4>落盘格式（第三行是故意留的半行日志）</h4>
            <pre class="code-box">{{ slo.sample_lines.join('\n') }}</pre>
            <ul class="rule-list">
              <li v-for="item in slo.notes" :key="item">{{ item }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑥ 混沌演练 -->
      <el-tab-pane label="⑥ 混沌演练" name="chaos">
        <div class="card-block">
          <div class="form-grid">
            <div class="field">
              <span class="label">超步数</span>
              <el-input-number v-model="chaosForm.steps" :min="3" :max="30" size="small" />
            </div>
            <div class="field">
              <span class="label">429 概率</span>
              <el-input-number v-model="chaosForm.llm_429_prob" :min="0" :max="1" :step="0.05" :precision="2" size="small" />
            </div>
            <div class="field">
              <span class="label">超时概率</span>
              <el-input-number v-model="chaosForm.llm_timeout_prob" :min="0" :max="1" :step="0.05" :precision="2" size="small" />
            </div>
            <div class="field">
              <span class="label">SIGTERM 秒数</span>
              <el-input-number v-model="chaosForm.kill_at_s" :min="0" :max="3600" :step="10" size="small" />
            </div>
            <div class="field">
              <span class="label">随机种子</span>
              <el-input-number v-model="chaosForm.seed" :min="0" :max="9999" size="small" />
            </div>
            <div class="field">
              <span class="label">CHAOS_OFF</span>
              <el-switch v-model="chaosForm.chaos_off" />
            </div>
            <div class="field">
              <span class="label">拔掉 MCP Server</span>
              <el-switch v-model="chaosForm.mcp_down" />
            </div>
            <div class="field">
              <span class="label">备模型 key 已配</span>
              <el-switch v-model="chaosForm.fallback_configured" />
            </div>
            <div class="field">
              <span class="label">trace 已 flush</span>
              <el-switch v-model="chaosForm.trace_flush" />
            </div>
            <div class="field">
              <span class="label">同工具失败短路</span>
              <el-switch v-model="chaosForm.tool_short_circuit" />
            </div>
            <div class="field">
              <el-button type="primary" size="small" :loading="chaosLoading" @click="doChaos">开始演练</el-button>
            </div>
          </div>
          <p class="hint">
            最后三个开关是「有没有做」的工程前置：课程首次演练正是这三处（外加 trace）暴露了盲区。
          </p>
        </div>

        <template v-if="chaos">
          <div class="card-block">
            <div class="block-head">
              <h4>注入下的 run</h4>
              <el-tag size="small" :type="chaos.injection.chaos_off ? 'info' : 'danger'" effect="plain">
                {{ chaos.injection.chaos_off ? 'CHAOS_OFF（无注入）' : '注入中' }}
              </el-tag>
            </div>
            <el-descriptions :column="4" size="small" border>
              <el-descriptions-item label="LLM 调用">{{ chaos.simulation.llm_calls }}</el-descriptions-item>
              <el-descriptions-item label="工具调用">{{ chaos.simulation.tool_calls }}</el-descriptions-item>
              <el-descriptions-item label="重试">{{ chaos.simulation.retries }}</el-descriptions-item>
              <el-descriptions-item label="429">{{ chaos.simulation.rate_limited }}</el-descriptions-item>
              <el-descriptions-item label="超时">{{ chaos.simulation.timeouts }}</el-descriptions-item>
              <el-descriptions-item label="L1 接管">{{ chaos.simulation.fallback_used }}</el-descriptions-item>
              <el-descriptions-item label="L3 道歉">{{ chaos.simulation.apology }}</el-descriptions-item>
              <el-descriptions-item label="降级率">{{ chaos.simulation.degraded_rate }}</el-descriptions-item>
              <el-descriptions-item label="裸 500">{{ chaos.simulation.bare_500 }}</el-descriptions-item>
              <el-descriptions-item label="同工具连试">{{ chaos.simulation.same_tool_attempts }} 轮</el-descriptions-item>
              <el-descriptions-item label="trace 完整">{{ chaos.simulation.trace_complete ? '是' : '否' }}</el-descriptions-item>
              <el-descriptions-item label="重启后 resume">{{ chaos.simulation.resumed_after_restart ? '成功' : '失败' }}</el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="card-block">
            <h4>预期声明表（演练的核心不是注入，是预期）</h4>
            <el-table :data="chaos.expectations" size="small">
              <el-table-column prop="no" label="#" width="42" />
              <el-table-column prop="inject" label="注入的故障" width="220">
                <template #default="{ row }">
                  <span class="line">{{ row.inject }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="expected" label="预期" min-width="260">
                <template #default="{ row }">
                  <span class="line">{{ row.expected }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="actual" label="实测" min-width="260">
                <template #default="{ row }">
                  <span class="line">{{ row.actual }}</span>
                </template>
              </el-table-column>
              <el-table-column label="判定" width="90">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.pass ? 'success' : 'danger'" effect="dark">
                    {{ row.pass ? '✅ 通过' : '❌ 落空' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="finding" label="发现" min-width="320">
                <template #default="{ row }">
                  <span class="line">{{ row.finding }}</span>
                </template>
              </el-table-column>
            </el-table>

            <el-alert
              class="mt"
              :type="chaos.blind_spots.length ? 'error' : 'success'"
              :closable="false"
              show-icon
              :title="chaos.blind_spots.length ? `可靠性盲区 ${chaos.blind_spots.length} 处（每一项都是在演习场里堵住的线上事故）` : '全部通过：这套降级链已经可以上生产了'"
            />
            <ul v-if="chaos.blind_spots.length" class="rule-list">
              <li v-for="item in chaos.blind_spots" :key="item">{{ item }}</li>
            </ul>

            <ul class="rule-list">
              <li v-for="item in chaos.notes" :key="item">{{ item }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 20 实验台：可靠性——分类重试 / 降级阶梯 / 优雅退出 / 容量与压测 / SLO 与告警 / 混沌演练
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDay20Mapping,
  runDay20Capacity,
  runDay20Chaos,
  runDay20Ladder,
  runDay20Retry,
  runDay20Shutdown,
  runDay20Slo
} from '@/api/study'

const mapping = ref(null)
const subTab = ref('retry')
const pitfalls = computed(() => mapping.value?.pitfalls || [])
const versionText = computed(() => {
  const versions = mapping.value?.versions || {}
  return Object.entries(versions)
    .map(([key, value]) => `${key} ${value}`)
    .join(' / ')
})

// 动作 / 告警严重度的标签配色（两处都用得上）
const actionType = (action) =>
  ({ retry: 'warning', fix_prompt: 'warning', fallback: 'info', fail: 'danger' })[action] || 'info'
const alertType = (severity) =>
  ({ page: 'error', ticket: 'warning', ok: 'success', insufficient: 'info' })[severity] || 'info'

// ---------- ① 分类与重试 ----------
const retryForm = ref({
  scenario: 'rate_limit',
  fail_times: 2,
  max_attempts: 3,
  base_ms: 500,
  cap_ms: 8000,
  retry_after_ms: 1500,
  seed: 20,
  llm_calls: 9,
  elapsed_s: 14
})
const retry = ref(null)
const retryLoading = ref(false)

const doRetry = async () => {
  retryLoading.value = true
  try {
    retry.value = await runDay20Retry({ ...retryForm.value })
    ElMessage.success(`最终出口：${retry.value.summary.final}`)
  } finally {
    retryLoading.value = false
  }
}

// ---------- ② 降级阶梯 ----------
const ladderForm = ref({
  query: '怎么配置 LangGraph 的 checkpointer？',
  primary_ok: false,
  primary_fail_times: 3,
  fallback_ok: true,
  fallback_supports_tools: true,
  needs_tools: false,
  cache_hit: false,
  recover_after: 3
})
// 用「1/0」文本编辑探活序列，比六个开关更紧凑
const probeText = ref('1,1,0,1,1,1')
const ladder = ref(null)
const ladderLoading = ref(false)

const doLadder = async () => {
  const probe = probeText.value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item !== '')
    .map((item) => item === '1' || item.toLowerCase() === 'true')
  ladderLoading.value = true
  try {
    ladder.value = await runDay20Ladder({ ...ladderForm.value, probe_sequence: probe })
    ElMessage.success(`最终交付：L${ladder.value.final.level}`)
  } finally {
    ladderLoading.value = false
  }
}

// ---------- ③ 优雅退出 ----------
const shutdownForm = ref({
  grace_seconds: 25,
  prestop_sleep_s: 5,
  lb_propagation_s: 5,
  new_requests: 6,
  flush_trace: true,
  runs: [
    { run_id: 'r-1', remaining_s: 6, checkpointed: true },
    { run_id: 'r-2', remaining_s: 42, checkpointed: true },
    { run_id: 'r-3', remaining_s: 90, checkpointed: false }
  ]
})
const shutdown = ref(null)
const shutdownLoading = ref(false)

const addRun = () => {
  const index = shutdownForm.value.runs.length + 1
  shutdownForm.value.runs.push({ run_id: `r-${index}`, remaining_s: 20, checkpointed: true })
}
const removeRun = (index) => {
  shutdownForm.value.runs.splice(index, 1)
}

const doShutdown = async () => {
  shutdownLoading.value = true
  try {
    shutdown.value = await runDay20Shutdown({ ...shutdownForm.value })
    ElMessage.success(shutdown.value.verdict)
  } finally {
    shutdownLoading.value = false
  }
}

// ---------- ④ 容量 ----------
const capacityForm = ref({
  monthly_budget: 200000,
  run_cost: 0.009,
  rpm: 3000,
  calls_per_run: 6,
  latency_s: 12.4,
  replicas: 4,
  headroom: 0.2,
  machine_conc_per_replica: 64,
  naive_semaphore: 8,
  arrival_rps: null,
  max_wait_s: 5,
  duration_s: 60
})
const capacity = ref(null)
const capacityLoading = ref(false)

const doCapacity = async () => {
  capacityLoading.value = true
  try {
    // el-input-number 清空时是 null，后端按「用推导值」处理
    const payload = { ...capacityForm.value }
    if (payload.arrival_rps === null || payload.arrival_rps === undefined) delete payload.arrival_rps
    capacity.value = await runDay20Capacity(payload)
    ElMessage.success(`瓶颈：${capacity.value.ceilings.binding}`)
  } finally {
    capacityLoading.value = false
  }
}

// ---------- ⑤ SLO ----------
const sloForm = ref({
  runs: 800,
  duration_min: 360,
  incident_min: 60,
  bad_rate: 0.18,
  degraded_rate: 0.45,
  latency_p95_s: 34,
  baseline_bad: 0.002,
  baseline_degraded: 0.01,
  baseline_p95_s: 12,
  min_sample: 50,
  seed: 7
})
const slo = ref(null)
const sloLoading = ref(false)

const doSlo = async () => {
  sloLoading.value = true
  try {
    slo.value = await runDay20Slo({ ...sloForm.value })
    ElMessage.success(`告警级别：${slo.value.alert.severity}`)
  } finally {
    sloLoading.value = false
  }
}

// ---------- ⑥ 混沌 ----------
const chaosForm = ref({
  seed: 20,
  steps: 10,
  llm_429_prob: 0.5,
  llm_timeout_prob: 0.1,
  chaos_off: false,
  mcp_down: true,
  kill_at_s: 120,
  fallback_configured: false,
  trace_flush: true,
  tool_short_circuit: false
})
const chaos = ref(null)
const chaosLoading = ref(false)

const doChaos = async () => {
  chaosLoading.value = true
  try {
    chaos.value = await runDay20Chaos({ ...chaosForm.value })
    if (chaos.value.blind_spots.length) {
      ElMessage.warning(`发现 ${chaos.value.blind_spots.length} 处可靠性盲区`)
    } else {
      ElMessage.success('全部预期通过')
    }
  } finally {
    chaosLoading.value = false
  }
}

onMounted(async () => {
  try {
    mapping.value = await getDay20Mapping()
  } catch {
    // 概念表加载失败不阻塞实验区
  }
})
</script>

<style lang="scss" scoped>
.day20 {
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
      margin: 0 0 6px;
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

    h4,
    h5 {
      margin: 0;
    }
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
    white-space: pre-wrap;
  }

  .line {
    font-size: 12px;
    line-height: 1.6;
  }

  .mt {
    margin-top: 8px;
  }

  .form-grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: 10px 14px;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 4px;

    &.wide {
      flex: 1 1 100%;
    }

    .label {
      font-size: 12px;
      color: $text-regular;
    }
  }

  .two-col {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $gap-md;
  }

  .code-box {
    margin: 0;
    padding: 10px;
    border-radius: $radius-sm;
    background: #f6f7fb;
    color: $text-primary;
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 11px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .rule-list {
    margin: $gap-sm 0 0;
    padding-left: 18px;
    font-size: 12px;
    line-height: 1.8;
    color: $text-regular;

    li {
      margin-bottom: 4px;
    }
  }

  @media (max-width: 1200px) {
    .two-col {
      grid-template-columns: 1fr;
    }
  }
}
</style>
