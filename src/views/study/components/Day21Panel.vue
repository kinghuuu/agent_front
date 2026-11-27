<template>
  <!-- Day 21 实验台：规划能力——失败复现 / 计划校验 / L1 / L2 / L3 / 图编排 / 评估门禁 -->
  <div class="day21">
    <el-alert
      class="tip"
      type="error"
      :closable="false"
      show-icon
      title="昨天解决「服务活着」，今天解决「活干对」：计划从 token 流里拿出来，变成可读写、可校验、可恢复的对象"
    />

    <!-- 概念区 -->
    <div class="card-block">
      <h4>三个症状：不是模型不聪明，是计划没落地（§1）</h4>
      <el-table :data="mapping?.failure_types || []" size="small" empty-text="加载中…">
        <el-table-column prop="no" label="#" width="52" />
        <el-table-column prop="name" label="症状" width="140" />
        <el-table-column prop="symptom" label="表现" min-width="280">
          <template #default="{ row }"><span class="line">{{ row.symptom }}</span></template>
        </el-table-column>
        <el-table-column prop="missing" label="漏了什么" min-width="260">
          <template #default="{ row }"><span class="line">{{ row.missing }}</span></template>
        </el-table-column>
        <el-table-column prop="fix" label="谁来治" min-width="280">
          <template #default="{ row }"><span class="line">{{ row.fix }}</span></template>
        </el-table-column>
        <el-table-column prop="layer" label="层次" width="120" />
      </el-table>
      <p class="hint">
        三者根因相同：计划只活在当前生成的 token 流里 —— 无法在动手前校验、没有地址可中断续跑、
        和本次调用绑定不能复用、是自然语言所以不可度量。
      </p>
    </div>

    <div class="card-block">
      <el-collapse>
        <el-collapse-item title="ReAct vs Plan-and-Execute / PlanStep 字段（§2）" name="structure">
          <el-table :data="mapping?.react_vs_plan || []" size="small">
            <el-table-column prop="dim" label="维度" width="110" />
            <el-table-column prop="react" label="ReAct（内层）" min-width="260" />
            <el-table-column prop="plan" label="Plan-and-Execute（外层）" min-width="300" />
            <el-table-column prop="verdict" label="结论" width="100" />
          </el-table>
          <el-table class="mt" :data="mapping?.plan_fields || []" size="small">
            <el-table-column prop="field" label="字段" width="120" />
            <el-table-column prop="meaning" label="含义" min-width="240" />
            <el-table-column prop="example" label="示例" min-width="240" />
            <el-table-column prop="why" label="为什么需要" min-width="300">
              <template #default="{ row }"><span class="line">{{ row.why }}</span></template>
            </el-table-column>
          </el-table>
        </el-collapse-item>

        <el-collapse-item title="三条不变量 / 三种形态 / 重规划与反思枚举（§3–§5）" name="invariants">
          <el-table :data="mapping?.invariants || []" size="small">
            <el-table-column prop="no" label="#" width="42" />
            <el-table-column prop="name" label="不变量" min-width="260" />
            <el-table-column prop="enforce" label="在哪强制" width="150" />
            <el-table-column prop="why" label="为什么" min-width="340">
              <template #default="{ row }"><span class="line">{{ row.why }}</span></template>
            </el-table-column>
          </el-table>
          <el-table class="mt" :data="mapping?.plan_forms || []" size="small">
            <el-table-column prop="level" label="形态" width="60" />
            <el-table-column prop="name" label="名字" width="220" />
            <el-table-column prop="cures" label="治什么" width="110" />
            <el-table-column prop="cost" label="成本" width="80" />
            <el-table-column prop="weak" label="弱点" min-width="300" />
            <el-table-column prop="when" label="适用" min-width="220" />
          </el-table>
          <div class="two-col mt">
            <div>
              <h5>重规划四个动作（互斥且完备）</h5>
              <el-table :data="mapping?.replan_actions || []" size="small">
                <el-table-column prop="action" label="动作" width="86" />
                <el-table-column prop="meaning" label="含义" min-width="180" />
                <el-table-column prop="next" label="后续" min-width="200" />
              </el-table>
            </div>
            <div>
              <h5>反思归因六个枚举</h5>
              <el-table :data="mapping?.critique_causes || []" size="small">
                <el-table-column prop="cause" label="root_cause" width="150" />
                <el-table-column prop="meaning" label="含义" min-width="160" />
                <el-table-column prop="example" label="例子" min-width="200" />
              </el-table>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item :title="`指标 / 六个坑 / 速查表（§7–§8，${pitfalls.length} 条坑）`" name="cheatsheet">
          <el-table :data="mapping?.metrics || []" size="small">
            <el-table-column prop="metric" label="指标" width="180" />
            <el-table-column prop="definition" label="定义" min-width="300" />
            <el-table-column prop="healthy" label="健康值" width="100" />
            <el-table-column prop="abnormal" label="异常含义" min-width="260" />
          </el-table>
          <el-table class="mt" :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="42" />
            <el-table-column prop="title" label="坑" width="180" />
            <el-table-column prop="symptom" label="现象" min-width="300">
              <template #default="{ row }"><span class="line">{{ row.symptom }}</span></template>
            </el-table-column>
            <el-table-column prop="fix" label="修法" min-width="340">
              <template #default="{ row }"><span class="line">{{ row.fix }}</span></template>
            </el-table-column>
          </el-table>
          <el-table class="mt" :data="mapping?.cheatsheet || []" size="small">
            <el-table-column prop="topic" label="问题" width="160" />
            <el-table-column prop="content" label="方案" min-width="340" />
            <el-table-column prop="key" label="关键点" min-width="300" />
          </el-table>
          <p class="hint mono">依赖：{{ versionText }}</p>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 失败复现 -->
      <el-tab-pane label="① 失败复现" name="failures">
        <div class="card-block">
          <div class="block-head"><h4>同一问题，三种错法，三种成本</h4></div>
          <div class="form-grid">
            <div class="field"><span class="label">症状</span>
              <el-select v-model="failuresForm.symptom" size="small" style="width: 180px">
                <el-option label="全部三个" value="all" />
                <el-option label="A 该探查就动手" value="premature" />
                <el-option label="B 该拆步硬扛" value="monolithic" />
                <el-option label="C 走错不回头" value="no_backtrack" />
              </el-select>
            </div>
            <div v-for="item in scenarioFields" :key="item.key" class="field">
              <span class="label">{{ item.label }}</span>
              <el-input-number
                v-if="item.key !== 'sku'"
                v-model="failuresForm[item.key]"
                size="small"
                :min="item.min"
                :max="item.max"
                controls-position="right"
                style="width: 130px"
              />
              <el-input v-else v-model="failuresForm.sku" size="small" style="width: 150px" />
            </div>
            <el-button type="primary" size="small" :loading="failuresLoading" @click="doFailures">复现</el-button>
          </div>
          <template v-if="failures">
            <el-alert class="mt" type="warning" :closable="false" :title="`正确答案：${failures.correct_answer}`" />
            <div class="chips mt">
              <el-tag size="small" type="danger">错 {{ failures.summary.wrong_count }}/{{ failures.summary.total }}</el-tag>
              <el-tag size="small" :type="failures.summary.all_green ? 'danger' : 'success'">
                监控全绿：{{ failures.summary.all_green ? '是' : '否' }}
              </el-tag>
              <el-tag size="small" effect="plain">{{ failures.summary.lesson }}</el-tag>
            </div>
            <div v-for="item in failures.cases" :key="item.symptom" class="case-card mt">
              <div class="block-head">
                <h5>{{ item.title }} <el-tag size="small" :type="verdictType(item.verdict)">{{ item.verdict }}</el-tag></h5>
                <span class="mono">HTTP {{ item.monitor.http_status }} · {{ item.monitor.tokens_est }} tok · {{ item.monitor.latency_ms }}ms · SLO 告警 {{ item.monitor.slo_alert }}</span>
              </div>
              <el-table :data="item.trace" size="small">
                <el-table-column prop="step" label="步" width="50" />
                <el-table-column prop="action" label="动作" width="140" />
                <el-table-column label="参数 / 观察 / 回答" min-width="500">
                  <template #default="{ row }">
                    <span class="mono">{{ row.observation || row.content || pretty(row.args) }}</span>
                  </template>
                </el-table-column>
              </el-table>
              <p class="hint">漏掉的事实：{{ item.missing_facts.join(' / ') }}；根因：{{ item.root_cause }}</p>
            </div>
            <ul class="rule-list"><li v-for="note in failures.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ② 计划校验 -->
      <el-tab-pane label="② 计划校验" name="schema">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">样本</span>
              <el-select v-model="schemaForm.case" size="small" style="width: 210px">
                <el-option label="valid 合法计划" value="valid" />
                <el-option label="cycle 依赖成环" value="cycle" />
                <el-option label="missing_expect 缺机器判据" value="missing_expect" />
                <el-option label="unknown_dep 未知依赖" value="unknown_dep" />
                <el-option label="duplicate_id 重复 id" value="duplicate_id" />
                <el-option label="self_dep 依赖自己" value="self_dep" />
                <el-option label="too_long 超过 7 步" value="too_long" />
              </el-select>
            </div>
            <el-button type="primary" size="small" :loading="schemaLoading" @click="doSchema">编译计划</el-button>
          </div>
          <template v-if="schema">
            <div class="chips mt">
              <el-tag size="small" :type="schema.accepted ? 'success' : 'danger'">
                {{ schema.accepted ? '通过：计划可执行' : '拒绝：执行前就被拦下' }}
              </el-tag>
              <el-tag v-for="row in schema.checks" :key="row.name" size="small" :type="checkType(row.ok)" effect="plain">
                {{ row.ok ? '✓' : '✗' }} {{ row.name }}
              </el-tag>
            </div>
            <el-table class="mt" :data="schema.checks" size="small">
              <el-table-column prop="name" label="不变量" width="220" />
              <el-table-column prop="ok" label="通过" width="70">
                <template #default="{ row }"><el-tag size="small" :type="checkType(row.ok)">{{ row.ok ? '是' : '否' }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="detail" label="说明" min-width="440" />
            </el-table>
            <el-alert v-if="schema.errors.length" class="mt" type="error" :closable="false" title="编译错误" />
            <pre v-if="schema.errors.length" class="code-box mt">{{ schema.errors.join('\n') }}</pre>
            <div class="two-col mt">
              <div><h5>原始计划 JSON</h5><pre class="code-box">{{ pretty(schema.raw) }}</pre></div>
              <div>
                <h5>拓扑分层 / 可执行步</h5>
                <p class="mono">levels = {{ pretty(schema.topo_levels) }}</p>
                <p class="mono">ready = {{ pretty(schema.ready_steps) }}</p>
                <p class="hint">同层步骤互不依赖，可以并发；有环时分层直接失败。</p>
              </div>
            </div>
            <ul class="rule-list"><li v-for="note in schema.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ③ L1 计划先行 -->
      <el-tab-pane label="③ L1 计划先行" name="execute">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">计划形态</span>
              <el-select v-model="executeForm.plan_kind" size="small" style="width: 280px">
                <el-option label="good 正确清单（库存+产能）" value="good" />
                <el-option label="external_only 只看外采（L1 不会回头）" value="external_only" />
                <el-option label="business_expect 判据写成业务结论" value="business_expect" />
              </el-select>
            </div>
            <div v-for="item in scenarioFields" :key="item.key" class="field">
              <span class="label">{{ item.label }}</span>
              <el-input-number
                v-if="item.key !== 'sku'"
                v-model="executeForm[item.key]"
                size="small"
                :min="item.min"
                :max="item.max"
                controls-position="right"
                style="width: 130px"
              />
              <el-input v-else v-model="executeForm.sku" size="small" style="width: 150px" />
            </div>
            <el-button type="primary" size="small" :loading="executeLoading" @click="doExecute">运行 L1</el-button>
          </div>
          <template v-if="execute">
            <el-alert
              class="mt"
              :type="execute.failed_at ? 'error' : 'success'"
              :closable="false"
              :title="execute.answer || `失败于 ${execute.failed_at}：计划不会 auto 回头`"
            />
            <div class="chips mt">
              <el-tag size="small" effect="plain">分层：{{ pretty(execute.levels) }}</el-tag>
              <el-tag v-for="item in execute.fixed_symptoms" :key="item" size="small" type="success">{{ item }}</el-tag>
              <el-tag v-for="item in execute.unfixed_symptoms" :key="item" size="small" type="warning">{{ item }}</el-tag>
            </div>
            <h5 class="mt">计划（含 status）</h5>
            <el-table :data="execute.plan.steps" size="small">
              <el-table-column prop="id" label="id" width="60" />
              <el-table-column prop="goal" label="目标" min-width="180" />
              <el-table-column prop="tool" label="工具" width="130" />
              <el-table-column label="依赖" width="100">
                <template #default="{ row }">{{ row.depends_on.join(',') || '-' }}</template>
              </el-table-column>
              <el-table-column label="机器判据" min-width="230">
                <template #default="{ row }"><span class="mono">{{ pretty(row.expect) }}</span></template>
              </el-table-column>
              <el-table-column prop="status" label="status" width="90">
                <template #default="{ row }"><el-tag size="small" :type="statusType(row.status)">{{ row.status }}</el-tag></template>
              </el-table-column>
            </el-table>
            <h5 class="mt">逐步执行（只喂依赖步结果）</h5>
            <el-table :data="execute.trace" size="small">
              <el-table-column prop="sid" label="步" width="55" />
              <el-table-column prop="goal" label="目标" min-width="160" />
              <el-table-column label="前序结果" min-width="220">
                <template #default="{ row }"><span class="mono">{{ pretty(row.context) }}</span></template>
              </el-table-column>
              <el-table-column label="产出" width="150">
                <template #default="{ row }"><span class="mono">{{ pretty(row.output) }}</span></template>
              </el-table-column>
              <el-table-column label="校验" min-width="220">
                <template #default="{ row }"><el-tag size="small" :type="checkType(row.passed)" effect="plain">{{ row.reason }}</el-tag></template>
              </el-table-column>
            </el-table>
            <ul class="rule-list"><li v-for="note in execute.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ④ L2 重规划 -->
      <el-tab-pane label="④ L2 重规划" name="replan">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">动作</span>
              <el-select v-model="replanForm.action" size="small" style="width: 240px">
                <el-option label="revise 补自产分支" value="revise" />
                <el-option label="finish 提前收尾" value="finish" />
                <el-option label="abort 客观不可完成" value="abort" />
                <el-option label="repeat 重复补丁（死循环）" value="repeat" />
              </el-select>
            </div>
            <div v-for="item in scenarioFields" :key="item.key" class="field">
              <span class="label">{{ item.label }}</span>
              <el-input-number
                v-if="item.key !== 'sku'"
                v-model="replanForm[item.key]"
                size="small"
                :min="item.min"
                :max="item.max"
                controls-position="right"
                style="width: 130px"
              />
              <el-input v-else v-model="replanForm.sku" size="small" style="width: 150px" />
            </div>
            <div class="field"><span class="label">篡改已完成步</span>
              <el-switch v-model="replanForm.tamper_done" size="small" />
            </div>
            <el-button type="primary" size="small" :loading="replanLoading" @click="doReplan">运行 L2</el-button>
          </div>
          <template v-if="replan">
            <el-alert class="mt" :type="replan.answer ? 'success' : 'error'" :closable="false" :title="replan.guard" />
            <el-alert
              v-if="replan.integrity_check.attempted"
              class="mt"
              :type="replan.integrity_check.rejected ? 'success' : 'error'"
              :closable="false"
              :title="replan.integrity_check.rejected ? `账本拦下篡改：${replan.integrity_check.reason}` : '篡改未被拦下（异常）'"
            />
            <el-alert v-if="replan.answer" class="mt" type="info" :closable="false" :title="replan.answer" />
            <div class="chips mt">
              <el-tag v-for="plan in replan.plans" :key="plan.version" size="small" effect="plain">v{{ plan.version }} · {{ plan.steps.length }} 步</el-tag>
            </div>
            <div v-for="plan in replan.plans" :key="plan.version" class="case-card mt">
              <h5>计划 v{{ plan.version }}</h5>
              <el-table :data="plan.steps" size="small">
                <el-table-column prop="id" label="id" width="60" />
                <el-table-column prop="goal" label="目标" min-width="200" />
                <el-table-column prop="tool" label="工具" width="130" />
                <el-table-column label="依赖" width="100">
                  <template #default="{ row }">{{ row.depends_on.join(',') || '-' }}</template>
                </el-table-column>
                <el-table-column prop="status" label="status" width="90">
                  <template #default="{ row }"><el-tag size="small" :type="statusType(row.status)">{{ row.status }}</el-tag></template>
                </el-table-column>
              </el-table>
            </div>
            <h5 class="mt">执行轨迹</h5>
            <el-table :data="replan.trace" size="small">
              <el-table-column prop="sid" label="步" width="55" />
              <el-table-column prop="goal" label="目标" min-width="180" />
              <el-table-column label="产出" width="150">
                <template #default="{ row }"><span class="mono">{{ pretty(row.output) }}</span></template>
              </el-table-column>
              <el-table-column label="校验" min-width="220">
                <template #default="{ row }"><el-tag size="small" :type="checkType(row.passed)" effect="plain">{{ row.reason }}</el-tag></template>
              </el-table-column>
            </el-table>
            <template v-if="replan.patches.length">
              <h5 class="mt">已应用补丁</h5>
              <el-table :data="replan.patches" size="small">
                <el-table-column prop="op" label="op" width="90" />
                <el-table-column prop="step_id" label="目标步" width="90">
                  <template #default="{ row }">{{ row.step_id || (row.step?.id || '-') }}</template>
                </el-table-column>
                <el-table-column prop="reason" label="理由" min-width="260" />
              </el-table>
            </template>
            <ul class="rule-list"><li v-for="note in replan.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ⑤ L3 反思 -->
      <el-tab-pane label="⑤ L3 反思" name="reflexion">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">验收判据</span>
              <el-select v-model="reflexionForm.expect_mode" size="small" style="width: 220px">
                <el-option label="correctness 判「算对没有」" value="correctness" />
                <el-option label="outcome 判「结果如不如愿」" value="outcome" />
              </el-select>
            </div>
            <div class="field"><span class="label">批评风格</span>
              <el-select v-model="reflexionForm.critique_style" size="small" style="width: 200px">
                <el-option label="actionable 可执行" value="actionable" />
                <el-option label="self_praise 自我表扬" value="self_praise" />
              </el-select>
            </div>
            <div class="field"><span class="label">历史同类错误</span>
              <el-input-number v-model="reflexionForm.prior_same_errors" size="small" :min="0" :max="2" controls-position="right" style="width: 130px" />
            </div>
            <div v-for="item in scenarioFields" :key="item.key" class="field">
              <span class="label">{{ item.label }}</span>
              <el-input-number
                v-if="item.key !== 'sku'"
                v-model="reflexionForm[item.key]"
                size="small"
                :min="item.min"
                :max="item.max"
                controls-position="right"
                style="width: 130px"
              />
              <el-input v-else v-model="reflexionForm.sku" size="small" style="width: 150px" />
            </div>
            <el-button type="primary" size="small" :loading="reflexionLoading" @click="doReflexion">运行 L3</el-button>
          </div>
          <template v-if="reflexion">
            <el-alert class="mt" :type="reflexion.verdict.startsWith('通过') ? 'success' : 'error'" :closable="false" :title="reflexion.verdict" />
            <p class="hint mono mt">expect = {{ pretty(reflexion.expect) }}</p>
            <el-table class="mt" :data="reflexion.attempts" size="small">
              <el-table-column prop="attempt" label="尝试" width="60" />
              <el-table-column label="产出" width="120">
                <template #default="{ row }"><span class="mono">{{ pretty(row.output) }}</span></template>
              </el-table-column>
              <el-table-column label="判定" width="80">
                <template #default="{ row }"><el-tag size="small" :type="checkType(row.passed)">{{ row.passed ? '过' : '否' }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="reason" label="理由" min-width="200" />
              <el-table-column label="注入的教训" min-width="320">
                <template #default="{ row }"><span class="line">{{ row.lesson_injected || '-' }}</span></template>
              </el-table-column>
            </el-table>
            <div v-for="(item, index) in reflexion.critiques" :key="index" class="case-card mt">
              <div class="block-head">
                <h5>第 {{ index + 1 }} 次反思 <el-tag size="small" effect="plain">{{ item.root_cause }}</el-tag></h5>
                <span class="mono">confidence {{ item.confidence }}</span>
              </div>
              <p class="hint">错在哪：{{ item.what_went_wrong }}</p>
              <p class="hint">修什么：{{ item.fix_instruction }}</p>
            </div>
            <el-alert class="mt" type="info" :closable="false" :title="reflexion.lesson || '没有形成反思记忆'" />
            <el-alert v-if="reflexion.answer" class="mt" type="success" :closable="false" :title="reflexion.answer" />
            <ul class="rule-list"><li v-for="note in reflexion.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ⑥ 图编排 -->
      <el-tab-pane label="⑥ 图编排" name="graph">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">场景</span>
              <el-select v-model="graphForm.scenario" size="small" style="width: 180px">
                <el-option label="patch 偏离后重规划" value="patch" />
                <el-option label="normal 一路顺风" value="normal" />
              </el-select>
            </div>
            <div class="field"><span class="label">批准计划补丁</span><el-switch v-model="graphForm.approve" size="small" /></div>
            <div class="field"><span class="label">反思次数</span>
              <el-input-number v-model="graphForm.reflexion_left" size="small" :min="0" :max="2" controls-position="right" style="width: 120px" />
            </div>
            <div class="field"><span class="label">recursion_limit</span>
              <el-input-number v-model="graphForm.recursion_limit" size="small" :min="5" :max="100" controls-position="right" style="width: 140px" />
            </div>
            <div v-for="item in scenarioFields" :key="item.key" class="field">
              <span class="label">{{ item.label }}</span>
              <el-input-number
                v-if="item.key !== 'sku'"
                v-model="graphForm[item.key]"
                size="small"
                :min="item.min"
                :max="item.max"
                controls-position="right"
                style="width: 130px"
              />
              <el-input v-else v-model="graphForm.sku" size="small" style="width: 150px" />
            </div>
            <el-button type="primary" size="small" :loading="graphLoading" @click="doGraph">运行图</el-button>
          </div>
          <template v-if="graph">
            <div class="chips mt">
              <el-tag size="small" :type="graph.approved === false ? 'danger' : 'success'">
                {{ graph.interrupt_payload ? `中断审批：${graph.approved ? '已批准' : '已拒绝'}` : '未触发中断' }}
              </el-tag>
              <el-tag size="small" effect="plain">计划 v{{ graph.plan.version }}</el-tag>
              <el-tag size="small" effect="plain">{{ graph.audit.length }} 个节点事件</el-tag>
            </div>
            <div v-if="graph.interrupt_payload" class="two-col mt">
              <div><h5>人工中断载荷</h5><pre class="code-box">{{ pretty(graph.interrupt_payload) }}</pre></div>
              <div><h5>节点审计（追加语义）</h5><ol class="rule-list"><li v-for="(line, index) in graph.audit" :key="index">{{ line }}</li></ol></div>
            </div>
            <el-alert v-else class="mt" type="info" :closable="false" title="一路顺风：无需人审，直接 finish" />
            <h5 class="mt">最终计划</h5>
            <el-table :data="graph.plan.steps" size="small">
              <el-table-column prop="id" label="id" width="60" />
              <el-table-column prop="goal" label="目标" min-width="200" />
              <el-table-column prop="tool" label="工具" width="130" />
              <el-table-column prop="status" label="status" width="90">
                <template #default="{ row }"><el-tag size="small" :type="statusType(row.status)">{{ row.status }}</el-tag></template>
              </el-table-column>
            </el-table>
            <el-alert v-if="graph.answer" class="mt" type="success" :closable="false" :title="graph.answer" />
            <ul class="rule-list"><li v-for="note in graph.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ⑦ 评估门禁 -->
      <el-tab-pane label="⑦ 评估门禁" name="eval">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">方案</span>
              <el-select v-model="evalForm.scheme" size="small" style="width: 180px">
                <el-option label="全部四档" value="all" />
                <el-option label="A 纯 ReAct" value="react" />
                <el-option label="B L1 计划先行" value="l1" />
                <el-option label="C L2 +重规划" value="l2" />
                <el-option label="D L3 +反思" value="l3" />
              </el-select>
            </div>
            <div class="field"><span class="label">样本数</span>
              <el-input-number v-model="evalForm.cases" size="small" :min="5" :max="100" controls-position="right" style="width: 120px" />
            </div>
            <div class="field"><span class="label">合法率门禁</span>
              <el-input-number v-model="evalForm.gate_validity" size="small" :min="0" :max="1" :step="0.01" :precision="2" controls-position="right" style="width: 130px" />
            </div>
            <div class="field"><span class="label">首过率门禁</span>
              <el-input-number v-model="evalForm.gate_first_pass" size="small" :min="0" :max="1" :step="0.01" :precision="2" controls-position="right" style="width: 130px" />
            </div>
            <div class="field"><span class="label">假完成率门禁</span>
              <el-input-number v-model="evalForm.gate_false_finish" size="small" :min="0" :max="1" :step="0.01" :precision="2" controls-position="right" style="width: 140px" />
            </div>
            <el-button type="primary" size="small" :loading="evalLoading" @click="doEval">跑评估</el-button>
          </div>
          <template v-if="evalResult">
            <el-alert
              class="mt"
              :type="evalResult.gate.passed ? 'success' : 'error'"
              :closable="false"
              :title="`${evalResult.gate.target} · ${evalResult.gate.passed ? '门禁通过' : `门禁未过：${evalResult.gate.failed.join(' / ')}`}`"
            />
            <el-table class="mt" :data="evalResult.summary" size="small">
              <el-table-column prop="name" label="方案" width="180" />
              <el-table-column label="正确率" width="90">
                <template #default="{ row }">{{ pct(row.correct_rate) }}</template>
              </el-table-column>
              <el-table-column label="计划合法率" width="110">
                <template #default="{ row }">{{ row.scheme === 'react' ? '—' : pct(row.plan_validity) }}</template>
              </el-table-column>
              <el-table-column label="首次通过率" width="110">
                <template #default="{ row }">{{ row.scheme === 'react' ? '—' : pct(row.first_pass_rate) }}</template>
              </el-table-column>
              <el-table-column prop="avg_steps" label="平均步数" width="100" />
              <el-table-column prop="step_efficiency" label="步数效率" width="100" />
              <el-table-column label="假完成率" width="100">
                <template #default="{ row }">{{ pct(row.false_finish_rate) }}</template>
              </el-table-column>
              <el-table-column label="单次成本" width="100">
                <template #default="{ row }">${{ row.cost_per_run.toFixed(3) }}</template>
              </el-table-column>
              <el-table-column label="门禁" width="80">
                <template #default="{ row }">
                  <el-tag v-if="row.gate_pass !== null" size="small" :type="checkType(row.gate_pass)">{{ row.gate_pass ? '过' : '未过' }}</el-tag>
                  <span v-else>—</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="two-col mt">
              <div>
                <h5>课程 12 条数据集参考值</h5>
                <el-table :data="evalResult.course_reference" size="small">
                  <el-table-column prop="scheme" label="方案" width="150" />
                  <el-table-column prop="correct" label="正确" width="70" />
                  <el-table-column prop="first_pass" label="首过" width="70" />
                  <el-table-column prop="false_finish" label="假完成" width="80" />
                  <el-table-column prop="cost" label="成本" width="80" />
                </el-table>
              </div>
              <div>
                <h5>逐 case 判定（前 {{ evalResult.rows.length }} 条）</h5>
                <el-table :data="evalResult.rows" size="small">
                  <el-table-column prop="case" label="case" width="70" />
                  <el-table-column label="正确" width="60">
                    <template #default="{ row }"><el-tag size="small" :type="checkType(row.correct)">{{ row.correct ? '✓' : '✗' }}</el-tag></template>
                  </el-table-column>
                  <el-table-column label="合法" width="60">
                    <template #default="{ row }"><el-tag size="small" :type="checkType(row.valid)">{{ row.valid ? '✓' : '✗' }}</el-tag></template>
                  </el-table-column>
                  <el-table-column prop="steps" label="步数" width="70" />
                  <el-table-column prop="replans" label="重规划" width="80" />
                  <el-table-column label="假完成" width="70">
                    <template #default="{ row }"><el-tag size="small" :type="row.false_finish ? 'danger' : 'info'">{{ row.false_finish ? '是' : '否' }}</el-tag></template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
            <ul class="rule-list"><li v-for="note in evalResult.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 21 实验台：规划能力——七段课程代码工程化为可复现的离线实验（图编排用真实 LangGraph）
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDay21Mapping,
  runDay21Eval,
  runDay21Execute,
  runDay21Failures,
  runDay21Graph,
  runDay21Reflexion,
  runDay21Replan,
  runDay21Schema
} from '@/api/study'

const mapping = ref(null)
const subTab = ref('failures')
const pitfalls = computed(() => mapping.value?.pitfalls || [])
const versionText = computed(() =>
  Object.entries(mapping.value?.versions || {})
    .map(([key, value]) => `${key} ${value}`)
    .join(' / ')
)

// 五个实验共用的场景字段，统一从一处生成，改默认值不会出现各处不一致
const scenarioFields = [
  { key: 'sku', label: 'SKU', min: 0, max: 0 },
  { key: 'order_qty', label: '订单量', min: 1, max: 100000 },
  { key: 'days', label: '交期(天)', min: 1, max: 60 },
  { key: 'stock', label: '库存', min: 0, max: 100000 },
  { key: 'capacity', label: '日产能', min: 0, max: 10000 },
  { key: 'lead_time', label: '补货周期', min: 0, max: 90 },
  { key: 'holidays', label: '节假日', min: 0, max: 30 }
]
const makeScenarioForm = () => ({
  sku: 'SKU-1024',
  order_qty: 500,
  days: 5,
  stock: 120,
  capacity: 80,
  lead_time: 7,
  holidays: 0
})

// 通用展示函数：百分比、判定配色、步骤状态配色、JSON 预览
const pct = (value) => `${(Number(value) * 100).toFixed(0)}%`
const pretty = (value) => JSON.stringify(value, null, 2)
const checkType = (ok) => (ok ? 'success' : 'danger')
const verdictType = (value) =>
  ({ 正确: 'success', 错误: 'danger', 通过: 'success', 假失败: 'warning', 假完成: 'warning' })[value] || 'info'
const statusType = (status) =>
  ({ done: 'success', failed: 'danger', pending: 'info', skipped: 'warning', running: 'warning' })[status] || 'info'

// ---------- ① 失败复现 ----------
const failuresForm = ref({ ...makeScenarioForm(), symptom: 'all' })
const failures = ref(null)
const failuresLoading = ref(false)

// 跑三种「没有计划」的失败轨迹
const doFailures = async () => {
  failuresLoading.value = true
  try {
    failures.value = await runDay21Failures({ ...failuresForm.value })
    ElMessage.success(`复现 ${failures.value.summary.total} 条，错 ${failures.value.summary.wrong_count} 条`)
  } finally {
    failuresLoading.value = false
  }
}

// ---------- ② 计划校验 ----------
const schemaForm = ref({ case: 'cycle' })
const schema = ref(null)
const schemaLoading = ref(false)

// 编译计划样本，看三条不变量是否拦住非法计划
const doSchema = async () => {
  schemaLoading.value = true
  try {
    schema.value = await runDay21Schema({ ...schemaForm.value })
    ElMessage.success(schema.value.accepted ? '计划合法，已分层' : '计划被拦下')
  } finally {
    schemaLoading.value = false
  }
}

// ---------- ③ L1 计划先行 ----------
const executeForm = ref({ ...makeScenarioForm(), plan_kind: 'good' })
const execute = ref(null)
const executeLoading = ref(false)

// 跑 Planner → Executor → Validator，观察 L1 的天花板
const doExecute = async () => {
  executeLoading.value = true
  try {
    execute.value = await runDay21Execute({ ...executeForm.value })
    ElMessage.success(execute.value.failed_at ? `停在 ${execute.value.failed_at}` : 'L1 全部校验通过')
  } finally {
    executeLoading.value = false
  }
}

// ---------- ④ L2 重规划 ----------
const replanForm = ref({ ...makeScenarioForm(), action: 'revise', tamper_done: false })
const replan = ref(null)
const replanLoading = ref(false)

// 跑偏离 → 重规划，查看补丁、账本冻结与防乒乓
const doReplan = async () => {
  replanLoading.value = true
  try {
    replan.value = await runDay21Replan({ ...replanForm.value })
    ElMessage.success(replan.value.guard)
  } finally {
    replanLoading.value = false
  }
}

// ---------- ⑤ L3 反思 ----------
const reflexionForm = ref({
  ...makeScenarioForm(),
  expect_mode: 'correctness',
  critique_style: 'actionable',
  prior_same_errors: 0
})
const reflexion = ref(null)
const reflexionLoading = ref(false)

// 跑算错 → 归因 → 重试，对比可机器校验与自我表扬两种批评
const doReflexion = async () => {
  reflexionLoading.value = true
  try {
    reflexion.value = await runDay21Reflexion({ ...reflexionForm.value })
    ElMessage.success(reflexion.value.verdict)
  } finally {
    reflexionLoading.value = false
  }
}

// ---------- ⑥ 图编排 ----------
const graphForm = ref({
  ...makeScenarioForm(),
  scenario: 'patch',
  approve: true,
  reflexion_left: 0,
  recursion_limit: 30
})
const graph = ref(null)
const graphLoading = ref(false)

// 跑真实 LangGraph 状态图，计划变更会停在 interrupt 等人审
const doGraph = async () => {
  graphLoading.value = true
  try {
    graph.value = await runDay21Graph({ ...graphForm.value })
    ElMessage.success(graph.value.interrupt_payload ? `审批 ${graph.value.approved ? '通过' : '拒绝'}` : '图跑完，未触发中断')
  } finally {
    graphLoading.value = false
  }
}

// ---------- ⑦ 评估门禁 ----------
const evalForm = ref({
  scheme: 'all',
  cases: 25,
  gate_validity: 0.98,
  gate_first_pass: 0.75,
  gate_false_finish: 0.05
})
const evalResult = ref(null)
const evalLoading = ref(false)

// 四档方案同数据集对照 + 三条门禁阈值
const doEval = async () => {
  evalLoading.value = true
  try {
    evalResult.value = await runDay21Eval({ ...evalForm.value })
    ElMessage.success(evalResult.value.gate.passed ? '门禁通过' : '门禁未过')
  } finally {
    evalLoading.value = false
  }
}

// 概念表加载失败不阻塞实验区
onMounted(async () => {
  try {
    mapping.value = await getDay21Mapping()
  } catch {
    // 接口失败时表格显示「加载中…」，实验区仍可点按钮
  }
})
</script>

<style lang="scss" scoped>
.day21 {
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

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
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

  .case-card {
    padding: 10px;
    border: 1px solid #e8e9f0;
    border-radius: $radius-sm;
    background: #fff;
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
