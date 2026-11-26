<template>
  <div class="day16">
    <el-alert
      class="tip"
      type="warning"
      :closable="false"
      show-icon
      title="改 prompt 之前先跑一遍测试集，改完再跑一遍，用数字证明「修好了几个、弄坏了几个」——不达标不准合并"
    />

    <!-- 概念区 -->
    <div class="card-block">
      <h4>为什么 Agent 的评估比传统测试难（课程 1.1）</h4>
      <el-table :data="mapping?.difficulties || []" size="small" empty-text="加载中…">
        <el-table-column prop="dimension" label="困难" width="100" />
        <el-table-column prop="unit_test" label="传统单测" min-width="220" />
        <el-table-column prop="agent" label="Agent" min-width="300">
          <template #default="{ row }">
            <span class="line">{{ row.agent }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="consequence" label="后果" min-width="240">
          <template #default="{ row }">
            <span class="line">{{ row.consequence }}</span>
          </template>
        </el-table-column>
      </el-table>
      <p class="hint">
        第一个认知转变：别追求「断言精确相等」，要追求「在容忍度内的通过率」。
      </p>
    </div>

    <div class="card-block">
      <div class="block-head">
        <h4>评估的三个层级 + 指标体系</h4>
        <div class="meta-row">
          <el-tag v-for="item in mapping?.behavior_categories || []" :key="item" size="small" effect="plain">
            行为断言：{{ item }}
          </el-tag>
        </div>
      </div>
      <el-table :data="mapping?.levels || []" size="small">
        <el-table-column prop="level" label="层级" width="120" />
        <el-table-column prop="what" label="评什么" min-width="280" />
        <el-table-column prop="method" label="典型方法" min-width="200" />
        <el-table-column prop="source" label="对应前面哪天" width="160" />
      </el-table>
      <el-table class="mt" :data="mapping?.metric_groups || []" size="small">
        <el-table-column prop="group" label="指标类别" width="110" />
        <el-table-column prop="metrics" label="具体指标" min-width="240" />
        <el-table-column prop="how" label="判定方法" min-width="360">
          <template #default="{ row }">
            <span class="line">{{ row.how }}</span>
          </template>
        </el-table-column>
      </el-table>
      <p class="hint">
        Agent 评估的重点在 L3（轨迹）：工具调错了、答案碰巧对，是最危险的绿色。
      </p>
    </div>

    <div class="card-block">
      <el-collapse>
        <el-collapse-item title="数据集的三条来源与 case 四件套（第 2 节）" name="dataset">
          <el-table :data="mapping?.dataset_sources || []" size="small">
            <el-table-column prop="rank" label="#" width="46" />
            <el-table-column prop="source" label="来源" width="200" />
            <el-table-column prop="why" label="价值" min-width="300" />
            <el-table-column prop="risk" label="风险" min-width="260" />
          </el-table>
          <el-table class="mt" :data="mapping?.case_fields || []" size="small">
            <el-table-column prop="field" label="字段" width="110" />
            <el-table-column prop="meaning" label="含义" min-width="380">
              <template #default="{ row }">
                <span class="line">{{ row.meaning }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="example" label="示例" min-width="280">
              <template #default="{ row }">
                <span class="mono">{{ row.example }}</span>
              </template>
            </el-table-column>
          </el-table>
          <p class="hint">规模建议：冒烟集 20 条（PR 跑）+ 全量集 100~200 条（夜跑/发版跑）；30 条以下看涨跌都是噪声。</p>
        </el-collapse-item>

        <el-collapse-item title="judge 的 rubric 四要素 + 门禁口径" name="rubric">
          <el-table :data="mapping?.rubric_rules || []" size="small">
            <el-table-column prop="element" label="要素" width="110" />
            <el-table-column prop="content" label="写什么" min-width="320" />
            <el-table-column prop="why" label="为什么" min-width="320" />
          </el-table>
          <div class="metric-grid mt">
            <div class="metric-card">
              <span class="metric-label">正确率最大降幅</span>
              <span class="metric-value">{{ pct(mapping?.gates?.accuracy_drop_max) }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">平均 token 最大涨幅</span>
              <span class="metric-value">{{ pct(mapping?.gates?.cost_increase_max) }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">judge 校准口径</span>
              <span class="metric-value small">{{ mapping?.gates?.judge_calibration || '—' }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">CI 分层</span>
              <span class="metric-value small">{{ mapping?.gates?.ci_layers || '—' }}</span>
            </div>
          </div>
        </el-collapse-item>

        <el-collapse-item :title="`五个常见的坑（第 5 节，${pitfalls.length} 条）`" name="pitfalls">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="46" />
            <el-table-column prop="title" label="坑" width="240" />
            <el-table-column prop="symptom" label="现象" min-width="280" />
            <el-table-column prop="fix" label="修法" min-width="320" />
          </el-table>
        </el-collapse-item>

        <el-collapse-item title="速查表 + 今日必掌握清单（第 6 节）" name="cheat">
          <el-table :data="mapping?.cheatsheet || []" size="small">
            <el-table-column prop="topic" label="需求" width="150" />
            <el-table-column prop="content" label="做法" min-width="340">
              <template #default="{ row }">
                <span class="line">{{ row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="key" label="关键点" min-width="220" />
          </el-table>
          <ul class="rule-list">
            <li v-for="item in mapping?.checklist || []" :key="item">{{ item }}</li>
          </ul>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 数据集画像 -->
    <div class="card-block">
      <div class="block-head">
        <h4>当前数据集（{{ dataset?.total || 0 }} 条）</h4>
        <el-button size="small" text :loading="datasetLoading" @click="loadDataset">刷新</el-button>
      </div>
      <div class="metric-grid">
        <div class="metric-card">
          <span class="metric-label">类别分布</span>
          <span class="metric-value small">{{ dictText(dataset?.distribution) }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">难度分布</span>
          <span class="metric-value small">{{ dictText(dataset?.difficulties) }}</span>
        </div>
        <div class="metric-card">
          <span class="metric-label">来源分布</span>
          <span class="metric-value small">{{ dictText(dataset?.sources) }}</span>
        </div>
      </div>
      <p class="hint mono">数据集：{{ dataset?.files?.dataset || mapping?.files?.dataset || '—' }}</p>
    </div>

    <div class="model-bar">
      <span class="label">被评模型</span>
      <el-select v-model="modelId" placeholder="默认模型" size="small" clearable style="width: 180px">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="label">judge 模型</span>
      <el-select
        v-model="judgeModelId"
        placeholder="同被评模型（有自评偏差）"
        size="small"
        clearable
        style="width: 220px"
      >
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="muted">①②④⑤ 会真实调用模型；③ 走 judge；构建数据集与读报告不花钱</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 数据集 -->
      <el-tab-pane label="① 数据集" name="dataset">
        <div class="card-block">
          <div class="row-actions">
            <el-checkbox v-model="buildForm.include_feedback" size="small">收进 Day 15 点踩 trace</el-checkbox>
            <el-checkbox v-model="buildForm.include_seed" size="small">人工边界 case</el-checkbox>
            <el-checkbox v-model="buildForm.include_synthesized" size="small">合成变体</el-checkbox>
            <el-checkbox v-model="buildForm.replace" size="small">覆盖重写</el-checkbox>
            <el-button type="primary" size="small" :loading="buildLoading" @click="doBuild">构建数据集</el-button>
          </div>
          <p class="hint">
            点踩 trace 是真实失败（最宝贵），人工边界是线上不一定踩得到的坑，合成变体必须人工抽查。
            三类按 input 去重，id 稳定（e001… / fb&lt;trace 前缀&gt;），重建后仍能逐条做回归 diff。
          </p>
        </div>

        <div v-if="dataset" class="card-block">
          <div class="block-head">
            <h4>{{ dataset.total }} 条 case</h4>
            <div class="meta-row">
              <el-tag v-if="dataset.online_found" size="small" type="success" effect="plain">
                本次从反馈捞到 {{ dataset.online_found }} 条
              </el-tag>
              <el-tag size="small" effect="plain">{{ dataset.files?.dataset }}</el-tag>
            </div>
          </div>
          <el-empty v-if="!dataset.cases?.length" description="还没有数据集：点上面的「构建数据集」" />
          <el-table v-else :data="dataset.cases" size="small">
            <el-table-column prop="id" label="id" width="90" />
            <el-table-column prop="input" label="输入" min-width="260">
              <template #default="{ row }">
                <span class="line">{{ row.input }}</span>
              </template>
            </el-table-column>
            <el-table-column label="类别" width="100">
              <template #default="{ row }">
                <el-tag
                  size="small"
                  :type="(mapping?.behavior_categories || []).includes(row.meta?.category) ? 'warning' : 'info'"
                  effect="plain"
                >
                  {{ row.meta?.category }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="难度" width="80">
              <template #default="{ row }">{{ row.meta?.difficulty }}</template>
            </el-table-column>
            <el-table-column label="判定依据" min-width="320">
              <template #default="{ row }">
                <span class="mono">{{ expectedText(row) }}</span>
              </template>
            </el-table-column>
          </el-table>
          <ul class="rule-list">
            <li v-for="(note, index) in dataset.notes" :key="index">{{ note }}</li>
          </ul>
        </div>
      </el-tab-pane>

      <!-- ② 跑评估 -->
      <el-tab-pane label="② 跑评估" name="run">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">case 数</span>
            <el-input-number v-model="runForm.limit" :min="1" :max="50" size="small" style="width: 100px" />
            <span class="muted">每 case 采样</span>
            <el-input-number v-model="runForm.runs" :min="1" :max="5" size="small" style="width: 100px" />
            <span class="muted">类别</span>
            <el-select v-model="runForm.category" placeholder="全部" size="small" clearable style="width: 140px">
              <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
            </el-select>
            <el-button type="primary" size="small" :loading="runLoading" @click="doRun">跑评估</el-button>
          </div>
          <p class="hint">
            每 case 跑 {{ runForm.runs }} 次取多数（≥{{ Math.floor(runForm.runs / 2) + 1 }} 次通过才算过）：
            单次通过率 70% 的题，3 次全过的概率只有约 34%，投票后信号才稳。
          </p>
        </div>

        <template v-if="report">
          <div class="card-block">
            <div class="block-head">
              <h4>评估报告</h4>
              <div class="meta-row">
                <el-tag size="small" type="success" effect="plain">正确率 {{ pct(report.accuracy) }}</el-tag>
                <el-tag size="small" effect="plain">逐 case 均值 {{ pct(report.avg_pass_rate) }}</el-tag>
                <el-tag size="small" effect="plain">{{ report.avg_tokens }} tok</el-tag>
                <el-tag size="small" effect="plain">{{ report.avg_steps }} 步</el-tag>
                <el-tag size="small" effect="plain">{{ report.model }}</el-tag>
                <el-tag size="small" effect="plain">{{ report.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <div class="grid-2">
              <div>
                <h5>按类别切分（先看哪类退化）</h5>
                <el-table :data="categoryRows(report.by_category)" size="small">
                  <el-table-column prop="category" label="类别" min-width="110" />
                  <el-table-column prop="n" label="case" width="70" />
                  <el-table-column prop="pass" label="通过" width="70" />
                  <el-table-column label="通过率" width="110">
                    <template #default="{ row }">
                      <span :class="row.pass_rate < 0.6 ? 'bad-text' : 'good-text'">{{ pct(row.pass_rate) }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div>
                <h5>失败清单（{{ report.failures?.length || 0 }} 条）</h5>
                <el-empty v-if="!report.failures?.length" description="全部通过" :image-size="48" />
                <div v-else class="event-list">
                  <div v-for="item in report.failures" :key="item.id" class="event-row">
                    <el-tag size="small" type="danger" effect="plain">{{ item.category }}</el-tag>
                    <span class="mono">{{ item.id }}</span>
                    <span class="muted">通过率 {{ pct(item.pass_rate) }}</span>
                    <span class="line">{{ item.input }}</span>
                    <span class="mono">{{ checkText(item.checks) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card-block">
            <h4>逐 case 明细</h4>
            <el-table :data="report.cases" size="small">
              <el-table-column prop="id" label="id" width="88" />
              <el-table-column label="结果" width="80">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.passed ? 'success' : 'danger'" effect="plain">
                    {{ row.passed ? 'PASS' : 'FAIL' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="category" label="类别" width="96" />
              <el-table-column label="通过率" width="100">
                <template #default="{ row }">{{ pct(row.pass_rate) }}</template>
              </el-table-column>
              <el-table-column label="判定项" width="220">
                <template #default="{ row }">
                  <span class="mono">{{ checkText(row.check_detail) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="步 / token" width="110">
                <template #default="{ row }">{{ row.avg_steps }} / {{ row.avg_tokens }}</template>
              </el-table-column>
              <el-table-column label="工具序列" width="200">
                <template #default="{ row }">
                  <span class="mono">{{ (row.sample_tools || []).join(' → ') || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="答案预览" min-width="240">
                <template #default="{ row }">
                  <span class="line">{{ row.sample_answer || '—' }}</span>
                </template>
              </el-table-column>
            </el-table>
            <ul class="rule-list">
              <li v-for="(note, index) in report.notes" :key="index">{{ note }}</li>
            </ul>
            <p class="hint mono">报告落盘：{{ report.files?.report }}</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ③ LLM-as-judge -->
      <el-tab-pane label="③ LLM-as-judge" name="judge">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">预设</span>
            <el-select v-model="judgePreset" placeholder="选一个提问" size="small" style="width: 260px" @change="applyJudgePreset">
              <el-option v-for="item in mapping?.presets?.judge || []" :key="item" :label="item" :value="item" />
            </el-select>
            <el-button type="primary" size="small" :loading="judgeLoading" @click="doJudge">打分</el-button>
          </div>
          <el-input
            v-model="judgeForm.question"
            class="mt"
            type="textarea"
            :rows="2"
            placeholder="用户问题"
          />
          <el-input
            v-model="judgeForm.answer"
            class="mt"
            type="textarea"
            :rows="3"
            placeholder="被评的助手回答"
          />
        </div>

        <template v-if="judgeResult">
          <div class="grid-2">
            <div class="card-block">
              <div class="block-head">
                <h4>单点 rubric 评分</h4>
                <div class="meta-row">
                  <el-tag size="small" :type="judgeResult.verdict.passed ? 'success' : 'danger'" effect="plain">
                    {{ judgeResult.verdict.passed ? 'PASS' : 'FAIL' }}
                  </el-tag>
                  <el-tag size="small" effect="plain">score {{ judgeResult.verdict.score }}/5</el-tag>
                  <el-tag size="small" effect="plain">{{ judgeResult.method }}</el-tag>
                  <el-tag v-if="judgeResult.self_judging" size="small" type="warning" effect="plain">self judging</el-tag>
                </div>
              </div>
              <p class="line">{{ judgeResult.verdict.reason }}</p>
              <ul class="rule-list">
                <li v-for="(item, index) in judgeResult.attempts" :key="index" class="mono">{{ item }}</li>
              </ul>
              <p class="hint">judge 模型：{{ judgeResult.model }}</p>
            </div>

            <div class="card-block">
              <div class="block-head">
                <h4>pairwise 换序对比</h4>
                <el-tag
                  v-if="judgeResult.pairwise"
                  size="small"
                  :type="judgeResult.pairwise.consistent ? 'success' : 'warning'"
                  effect="plain"
                >
                  {{ judgeResult.pairwise.consistent ? '两次一致' : '不一致/平局' }}
                </el-tag>
              </div>
              <template v-if="judgeResult.pairwise">
                <p class="line">
                  结论：<b>{{ pairLabel(judgeResult.pairwise.better) }}</b> · {{ judgeResult.pairwise.note }}
                </p>
                <div class="grid-2 mt">
                  <div class="sub-card">
                    <h5>正序（A=旧版）</h5>
                    <p class="hint">judge 选：{{ judgeResult.pairwise.first_order?.better || '—' }}</p>
                    <p class="line">{{ judgeResult.pairwise.first_order?.reason || '' }}</p>
                  </div>
                  <div class="sub-card">
                    <h5>换序（A=新版）</h5>
                    <p class="hint">judge 选：{{ judgeResult.pairwise.second_order?.better || '—' }}</p>
                    <p class="line">{{ judgeResult.pairwise.second_order?.reason || '' }}</p>
                  </div>
                </div>
              </template>
              <el-empty v-else description="没有提供两版回答，跳过对比" :image-size="48" />
              <ul class="rule-list">
                <li v-for="(item, index) in judgeResult.pair_attempts" :key="index" class="mono">{{ item }}</li>
              </ul>
            </div>
          </div>

          <div class="card-block">
            <h4>两版回答对照（pairwise 的输入）</h4>
            <el-input v-model="judgeForm.old_answer" class="mt" type="textarea" :rows="2" placeholder="旧版回答" />
            <el-input v-model="judgeForm.new_answer" class="mt" type="textarea" :rows="3" placeholder="新版回答" />
            <ul class="rule-list">
              <li v-for="(note, index) in judgeResult.notes" :key="index">{{ note }}</li>
            </ul>
            <p class="hint mono">{{ judgeResult.elapsed_ms }}ms</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ 回归门禁 -->
      <el-tab-pane label="④ 回归门禁" name="regression">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">case 数</span>
            <el-input-number v-model="regForm.limit" :min="1" :max="20" size="small" style="width: 100px" />
            <span class="muted">每 case 采样</span>
            <el-input-number v-model="regForm.runs" :min="1" :max="5" size="small" style="width: 100px" />
            <span class="muted">正确率降幅上限</span>
            <el-input-number v-model="regForm.accuracy_drop_max" :min="0" :max="1" :step="0.01" size="small" style="width: 110px" />
            <span class="muted">token 涨幅上限</span>
            <el-input-number v-model="regForm.cost_increase_max" :min="0" :max="2" :step="0.05" size="small" style="width: 110px" />
            <el-button type="primary" size="small" :loading="regLoading" @click="doRegression">双跑并判定</el-button>
          </div>
          <el-input
            v-model="regForm.candidate_prompt"
            class="mt"
            type="textarea"
            :rows="3"
            placeholder="candidate 提示词（留空用内置的修复版）"
          />
          <p class="hint">
            同一数据集、同一模型，唯一变量是 prompt。双跑很贵，所以默认只取 4 条 × 2 次——
            课堂看的是「怎么读 diff」，不是把 200 条跑穿。
          </p>
          <el-collapse class="mt">
            <el-collapse-item title="两版提示词" name="prompts">
              <p class="hint">baseline：</p>
              <pre class="code-block">{{ mapping?.prompts?.baseline || '—' }}</pre>
              <p class="hint">candidate：</p>
              <pre class="code-block">{{ regForm.candidate_prompt || mapping?.prompts?.candidate || '—' }}</pre>
            </el-collapse-item>
          </el-collapse>
        </div>

        <template v-if="regResult">
          <div class="card-block">
            <div class="block-head">
              <h4>门禁判定</h4>
              <el-tag size="small" :type="regResult.gate.passed ? 'success' : 'danger'" effect="plain">
                {{ regResult.gate.passed ? '通过，允许合并' : '未过门禁，禁止合并' }}
              </el-tag>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">baseline 正确率</span>
                <span class="metric-value">{{ pct(regResult.diff.baseline_accuracy) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">candidate 正确率</span>
                <span class="metric-value">{{ pct(regResult.diff.candidate_accuracy) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">Δ 正确率</span>
                <span class="metric-value" :class="regResult.diff.accuracy_delta < 0 ? 'bad-text' : 'good-text'">
                  {{ signedPct(regResult.diff.accuracy_delta) }}
                </span>
              </div>
              <div class="metric-card">
                <span class="metric-label">Δ 平均 token</span>
                <span class="metric-value">{{ signedPct(regResult.diff.token_delta_ratio) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">修好</span>
                <span class="metric-value">{{ regResult.diff.fixed?.length || 0 }} 条</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">弄坏</span>
                <span class="metric-value bad-text">{{ regResult.diff.broke?.length || 0 }} 条</span>
              </div>
            </div>
            <ul v-if="regResult.gate.reasons?.length" class="rule-list">
              <li v-for="(reason, index) in regResult.gate.reasons" :key="index" class="bad-text">{{ reason }}</li>
            </ul>
            <ul v-if="regResult.gate.warnings?.length" class="rule-list">
              <li v-for="(warning, index) in regResult.gate.warnings" :key="index" class="warn-text">{{ warning }}</li>
            </ul>
          </div>

          <div class="card-block">
            <h4>逐 case diff（先看弄坏了哪几条）</h4>
            <el-table :data="regResult.diff.details" size="small">
              <el-table-column prop="id" label="id" width="88" />
              <el-table-column prop="category" label="类别" width="96" />
              <el-table-column prop="input" label="输入" min-width="240">
                <template #default="{ row }">
                  <span class="line">{{ row.input }}</span>
                </template>
              </el-table-column>
              <el-table-column label="baseline" width="100">
                <template #default="{ row }">{{ pct(row.baseline_pass_rate) }}</template>
              </el-table-column>
              <el-table-column label="candidate" width="100">
                <template #default="{ row }">{{ pct(row.candidate_pass_rate) }}</template>
              </el-table-column>
              <el-table-column label="变化" width="110">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.delta > 0 ? 'success' : row.delta < 0 ? 'danger' : 'info'" effect="plain">
                    {{ signedPct(row.delta) }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <ul class="rule-list">
              <li v-for="(note, index) in regResult.notes" :key="index">{{ note }}</li>
            </ul>
            <p class="hint mono">diff 落盘：{{ regResult.files?.regression }}</p>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ CI 门禁 -->
      <el-tab-pane label="⑤ CI 门禁" name="ci">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">冒烟集大小</span>
            <el-input-number v-model="ciForm.smoke_size" :min="1" :max="50" size="small" style="width: 100px" />
            <span class="muted">每条采样</span>
            <el-input-number v-model="ciForm.runs" :min="1" :max="3" size="small" style="width: 100px" />
            <span class="muted">容差</span>
            <el-input-number v-model="ciForm.tolerance" :min="0" :max="1" :step="0.01" size="small" style="width: 100px" />
            <el-checkbox v-model="ciForm.refresh_baseline" size="small">跑完归档为新基线（夜跑用）</el-checkbox>
            <el-button type="primary" size="small" :loading="ciLoading" @click="doCi">跑冒烟门禁</el-button>
          </div>
          <p class="hint">
            真实 CI 里这一步是 <span class="mono">python 05_ci_gate.py</span> + <span class="mono">sys.exit(exit_code)</span>；
            学习页把它变成 HTTP 接口，退出码放在返回值里（0 = 允许合并，1 = 标红）。
          </p>
        </div>

        <template v-if="ciResult">
          <div class="card-block">
            <div class="block-head">
              <h4>冒烟结果</h4>
              <div class="meta-row">
                <el-tag size="small" :type="ciResult.passed ? 'success' : 'danger'" effect="plain">
                  {{ ciResult.passed ? '✅ 通过' : '❌ 未过门禁' }}
                </el-tag>
                <el-tag size="small" effect="plain">exit_code {{ ciResult.exit_code }}</el-tag>
                <el-tag v-if="ciResult.archived" size="small" type="warning" effect="plain">本次已归档基线</el-tag>
                <el-tag size="small" effect="plain">{{ ciResult.smoke_cases }}/{{ ciResult.total_cases }} 条</el-tag>
                <el-tag size="small" effect="plain">{{ ciResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">本次冒烟正确率</span>
                <span class="metric-value">{{ pct(ciResult.accuracy) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">基线正确率</span>
                <span class="metric-value">{{ pct(ciResult.baseline_accuracy) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">允许降幅</span>
                <span class="metric-value">{{ pct(ciResult.tolerance) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">失败条数</span>
                <span class="metric-value bad-text">{{ ciResult.failures?.length || 0 }}</span>
              </div>
            </div>
          </div>

          <div class="grid-2">
            <div class="card-block">
              <h4>失败清单</h4>
              <el-empty v-if="!ciResult.failures?.length" description="冒烟全过" :image-size="48" />
              <div v-else class="event-list">
                <div v-for="item in ciResult.failures" :key="item.id" class="event-row">
                  <el-tag size="small" type="danger" effect="plain">{{ item.category }}</el-tag>
                  <span class="mono">{{ item.id }}</span>
                  <span class="line">{{ item.input }}</span>
                  <span class="mono">{{ checkText(item.checks) }}</span>
                </div>
              </div>
            </div>
            <div class="card-block">
              <h4>归档基线</h4>
              <pre class="code-block">{{ JSON.stringify(ciResult.baseline, null, 2) }}</pre>
              <p class="hint mono">基线文件：{{ ciResult.files?.baseline }}</p>
            </div>
          </div>

          <div class="card-block">
            <ul class="rule-list">
              <li v-for="(note, index) in ciResult.notes" :key="index">{{ note }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 16 实验台：评估体系——数据集构建 / 跑评估 / LLM-as-judge / 回归门禁 / CI 冒烟
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  buildDay16Dataset,
  getDay16Dataset,
  getDay16Mapping,
  listChatModels,
  runDay16CiGate,
  runDay16Eval,
  runDay16Judge,
  runDay16Regression
} from '@/api/study'

const mapping = ref(null)
const mappingLoading = ref(false)
const dataset = ref(null)
const datasetLoading = ref(false)
const models = ref([])
const modelId = ref(null)
const judgeModelId = ref(null)
const subTab = ref('dataset')

const pitfalls = computed(() => mapping.value?.pitfalls || [])
// 类别下拉：数据集里出现过的类别
const categoryOptions = computed(() => Object.keys(dataset.value?.distribution || {}))

// 百分比格式化（后端传 0~1 的小数）
const pct = (value) => `${Math.round((Number(value) || 0) * 1000) / 10}%`
// 带符号的百分比：回归报告要一眼看出涨还是跌
const signedPct = (value) => {
  const num = Number(value) || 0
  return `${num > 0 ? '+' : ''}${Math.round(num * 1000) / 10}%`
}
// 把 {a: 1, b: 2} 渲染成「a 1 · b 2」
const dictText = (dict) => {
  const entries = Object.entries(dict || {})
  return entries.length ? entries.map(([key, value]) => `${key} ${value}`).join(' · ') : '—'
}
// 判定项：{"answer_rule": true, "tool_seq": false} → "answer_rule ✓ · tool_seq ✗"
const checkText = (checks) =>
  Object.entries(checks || {})
    .map(([key, value]) => `${key} ${value ? '✓' : '✗'}`)
    .join(' · ') || '—'
// case 的判定依据：关键词 + 期望工具；两者都空说明靠行为断言
const expectedText = (row) => {
  const expected = row.expected || {}
  const keys = expected.answer_contains || []
  const tools = expected.expected_tools || []
  if (!keys.length && !tools.length) {
    return `行为断言（${row.meta?.category}）`
  }
  return [keys.length ? `含 ${keys.join('/')}` : '', tools.length ? `工具 ${tools.join('→')}` : '']
    .filter(Boolean)
    .join(' · ')
}
// 把 by_category 的字典转成表格行，并按通过率升序（先看最差的）
const categoryRows = (byCategory) =>
  Object.entries(byCategory || {})
    .map(([category, row]) => ({ category, ...row }))
    .sort((a, b) => (a.pass_rate || 0) - (b.pass_rate || 0))
// pairwise 结论转中文
const pairLabel = (better) => (better === 'new' ? '新版更好' : better === 'old' ? '旧版更好' : '平局')

// ---------- ① 数据集 ----------
const buildForm = ref({
  include_feedback: true,
  include_seed: true,
  include_synthesized: true,
  replace: true
})
const buildLoading = ref(false)

// 构建评估集：三类来源可分别开关，按 input 去重后落盘
const doBuild = async () => {
  buildLoading.value = true
  try {
    dataset.value = await buildDay16Dataset({ ...buildForm.value })
    ElMessage.success(`数据集已生成：${dataset.value.total} 条`)
  } finally {
    buildLoading.value = false
  }
}

// 读回现状（页面打开与刷新按钮都走它）
const loadDataset = async () => {
  datasetLoading.value = true
  try {
    dataset.value = await getDay16Dataset()
  } catch {
    // 没建过数据集时后端返回 0 条，不阻塞其他实验区
  } finally {
    datasetLoading.value = false
  }
}

// ---------- ② 跑评估 ----------
const runForm = ref({ limit: 5, runs: 3, category: '' })
const report = ref(null)
const runLoading = ref(false)

// 跑评估：逐 case 采样取多数，输出总体 + 分类 + 逐条明细
const doRun = async () => {
  runLoading.value = true
  try {
    report.value = await runDay16Eval({
      limit: runForm.value.limit,
      runs: runForm.value.runs,
      category: runForm.value.category || undefined,
      model_config_id: modelId.value || undefined
    })
    ElMessage.success(`评估完成：正确率 ${pct(report.value.accuracy)}`)
  } finally {
    runLoading.value = false
  }
}

// ---------- ③ LLM-as-judge ----------
const judgeForm = ref({
  question: '报销昨天的晚餐 78 元',
  answer: '已为您提交报销：餐饮 78 元，单号 EXP-2046。',
  old_answer: '已提交。',
  new_answer: '已提交餐饮报销 78 元（单号 EXP-2046）。注意：餐饮报销需附发票，每日报销上限 100 元。'
})
const judgePreset = ref('')
const judgeResult = ref(null)
const judgeLoading = ref(false)

// 选预设只覆盖问题，保留回答文本供对照
const applyJudgePreset = (value) => {
  if (value) judgeForm.value.question = value
}

// 打分：单点 rubric + pairwise 两次换序（judge 模型可单独指定）
const doJudge = async () => {
  judgeLoading.value = true
  try {
    judgeResult.value = await runDay16Judge({
      ...judgeForm.value,
      model_config_id: modelId.value || undefined,
      // 不选 judge 模型 = 与被评模型同源，后端会返回 self_judging=true 提示自评偏差
      judge_model_config_id: judgeModelId.value || undefined
    })
  } finally {
    judgeLoading.value = false
  }
}

// ---------- ④ 回归门禁 ----------
const regForm = ref({
  limit: 4,
  runs: 2,
  accuracy_drop_max: 0.02,
  cost_increase_max: 0.15,
  candidate_prompt: ''
})
const regResult = ref(null)
const regLoading = ref(false)

// baseine vs candidate 双跑：逐 case diff + 两条硬阈值
const doRegression = async () => {
  regLoading.value = true
  try {
    regResult.value = await runDay16Regression({
      limit: regForm.value.limit,
      runs: regForm.value.runs,
      accuracy_drop_max: regForm.value.accuracy_drop_max,
      cost_increase_max: regForm.value.cost_increase_max,
      candidate_prompt: regForm.value.candidate_prompt || undefined,
      model_config_id: modelId.value || undefined
    })
    ElMessage[regResult.value.gate.passed ? 'success' : 'warning'](
      regResult.value.gate.passed ? '门禁通过，允许合并' : '未过门禁，禁止合并'
    )
  } finally {
    regLoading.value = false
  }
}

// ---------- ⑤ CI 门禁 ----------
const ciForm = ref({ smoke_size: 10, runs: 1, tolerance: 0.02, refresh_baseline: false })
const ciResult = ref(null)
const ciLoading = ref(false)

// 跑冒烟子集并与归档基线比较（首次运行会自动归档基线）
const doCi = async () => {
  ciLoading.value = true
  try {
    ciResult.value = await runDay16CiGate({
      smoke_size: ciForm.value.smoke_size,
      runs: ciForm.value.runs,
      tolerance: ciForm.value.tolerance,
      refresh_baseline: ciForm.value.refresh_baseline,
      model_config_id: modelId.value || undefined
    })
    ElMessage[ciResult.value.passed ? 'success' : 'error'](
      ciResult.value.passed ? '冒烟通过' : `冒烟未过门禁（exit_code=${ciResult.value.exit_code}）`
    )
  } finally {
    ciLoading.value = false
  }
}

// ---------- 初始化 ----------
const loadMapping = async () => {
  mappingLoading.value = true
  try {
    mapping.value = await getDay16Mapping()
  } catch {
    // 概念表失败不阻塞实验区
  } finally {
    mappingLoading.value = false
  }
}

onMounted(async () => {
  await loadMapping()
  await loadDataset()
  try {
    models.value = await listChatModels()
  } catch {
    // 模型列表失败时后端会给出明确错误
  }
})
</script>

<style lang="scss" scoped>
.day16 {
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

    h4 {
      margin: 0;
    }
  }

  .model-bar {
    display: flex;
    flex-wrap: wrap;
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

  .good-text {
    color: #2f9e5f;
  }

  .bad-text {
    color: #d64545;
  }

  .warn-text {
    color: #c98a1b;
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

      &.small {
        font-size: 12px;
      }
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
