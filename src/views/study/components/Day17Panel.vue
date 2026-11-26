<template>
  <div class="day17">
    <el-alert
      class="tip"
      type="warning"
      :closable="false"
      show-icon
      title="先用 Day 16 的门禁守住正确率，再来动成本和延迟：优化不是「少花钱」，而是「正确率不跌的前提下砍掉冗余调用、冗余 token、冗余等待」"
    />

    <!-- 概念区 -->
    <div class="card-block">
      <h4>成本到底是什么结构（课程 1.1 / 1.2）</h4>
      <el-table :data="mapping?.cost_structure || []" size="small" empty-text="加载中…">
        <el-table-column prop="scope" label="口径" width="110" />
        <el-table-column prop="formula" label="公式" min-width="300">
          <template #default="{ row }">
            <span class="mono">{{ row.formula }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="含义" min-width="320">
          <template #default="{ row }">
            <span class="line">{{ row.note }}</span>
          </template>
        </el-table-column>
      </el-table>
      <p class="hint">
        第一个认知转变：Agent 的成本不是「单价 × 次数」，而是「历史重放」——一次 N 步 run 的总输入 ≈ O(N²)。
      </p>
    </div>

    <div class="card-block">
      <div class="block-head">
        <h4>延迟的四段 + 四个杠杆的优先级</h4>
        <div class="meta-row">
          <el-tag v-for="item in mapping?.readonly_tools || []" :key="item" size="small" effect="plain">
            只读：{{ item }}
          </el-tag>
        </div>
      </div>
      <el-table :data="mapping?.latency_breakdown || []" size="small">
        <el-table-column prop="segment" label="段" width="110" />
        <el-table-column prop="what" label="是什么" min-width="220" />
        <el-table-column prop="scales_with" label="随什么增长" min-width="240" />
        <el-table-column prop="lever" label="最有效的杠杆" min-width="200" />
      </el-table>
      <el-table class="mt" :data="mapping?.levers || []" size="small">
        <el-table-column prop="priority" label="优先级" width="80" />
        <el-table-column prop="lever" label="杠杆" width="220" />
        <el-table-column prop="gain" label="典型收益" width="140" />
        <el-table-column prop="risk" label="风险" min-width="260" />
        <el-table-column prop="source" label="回收哪天" width="200" />
      </el-table>
      <p class="hint">
        顺序是 压缩 &gt; 并行 &gt; 缓存 &gt; 分级：缓存排最后不是收益小，而是它最容易出事——省下的钱可能不够赔一次错答。
      </p>
    </div>

    <div class="card-block">
      <el-collapse>
        <el-collapse-item title="缓存三层的风险与安全阀（第 2.4 节）" name="cache">
          <el-table :data="mapping?.cache_layers || []" size="small">
            <el-table-column prop="layer" label="层" width="140" />
            <el-table-column prop="what" label="缓存什么" min-width="220" />
            <el-table-column prop="hit_when" label="命中条件" min-width="220" />
            <el-table-column prop="risk" label="风险" min-width="200" />
            <el-table-column prop="valve" label="安全阀（写死在代码里）" min-width="280" />
          </el-table>
          <p class="hint">L2 是唯一会「直接给你错答」的一层：45 元 vs 450 元，任何 0.95 阈值都拦不住，只有实体校验能拦。</p>
        </el-collapse-item>

        <el-collapse-item :title="`常见的坑（第 4 节，${pitfalls.length} 条）`" name="pitfalls">
          <el-table :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="46" />
            <el-table-column prop="title" label="坑" width="220" />
            <el-table-column prop="symptom" label="现象" min-width="300" />
            <el-table-column prop="fix" label="修法" min-width="320" />
          </el-table>
        </el-collapse-item>

        <el-collapse-item title="价格表 + 预算三闸 + 速查表 / 必掌握（第 5、6 节）" name="price">
          <el-table :data="mapping?.prices || []" size="small">
            <el-table-column prop="model" label="模型" width="180" />
            <el-table-column prop="input" label="输入 $/1M" width="110" />
            <el-table-column prop="output" label="输出 $/1M" width="110" />
            <el-table-column prop="tier" label="定位" min-width="240" />
          </el-table>
          <div class="metric-grid mt">
            <div class="metric-card">
              <span class="metric-label">单次 run 费用上限</span>
              <span class="metric-value">${{ mapping?.thresholds?.max_cost ?? '—' }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">步数上限</span>
              <span class="metric-value">{{ mapping?.thresholds?.max_steps ?? '—' }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">墙钟上限</span>
              <span class="metric-value">{{ mapping?.thresholds?.max_wall ?? '—' }}s</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">压缩触发线</span>
              <span class="metric-value">{{ pct(mapping?.thresholds?.cost_trigger_ratio) }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">语义缓存阈值</span>
              <span class="metric-value">{{ mapping?.thresholds?.semantic_cache_threshold ?? '—' }}</span>
            </div>
            <div class="metric-card">
              <span class="metric-label">前缀缓存最小长度</span>
              <span class="metric-value">{{ mapping?.thresholds?.prefix_cache_min_tokens ?? '—' }} tok</span>
            </div>
          </div>
          <el-table class="mt" :data="mapping?.cheatsheet || []" size="small">
            <el-table-column prop="topic" label="需求" width="150" />
            <el-table-column prop="content" label="做法" min-width="340">
              <template #default="{ row }">
                <span class="line">{{ row.content }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="key" label="关键点" min-width="240" />
          </el-table>
          <ul class="rule-list">
            <li v-for="item in mapping?.checklist || []" :key="item">{{ item }}</li>
          </ul>
          <p class="hint mono">落盘：账本 {{ mapping?.files?.ledger || '—' }} · A/B {{ mapping?.files?.ab_report || '—' }}</p>
        </el-collapse-item>
      </el-collapse>
    </div>

    <div class="model-bar">
      <span class="label">模型</span>
      <el-select v-model="modelId" placeholder="默认模型" size="small" clearable style="width: 180px">
        <el-option v-for="item in models" :key="item.id" :label="item.name" :value="item.id" />
      </el-select>
      <span class="muted">①②③⑤⑥ 都能纯本地跑（不花钱）；勾选 live 或「调模型」才会真调模型</span>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 成本账本 -->
      <el-tab-pane label="① 成本账本" name="ledger">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">步数</span>
            <el-input-number v-model="ledgerForm.steps" :min="1" :max="8" size="small" style="width: 90px" />
            <span class="muted">每步工具结果 token</span>
            <el-input-number v-model="ledgerForm.tool_tokens" :min="50" :max="3000" :step="50" size="small" style="width: 110px" />
            <span class="muted">汇总输出 token</span>
            <el-input-number v-model="ledgerForm.final_output" :min="100" :max="2000" :step="50" size="small" style="width: 110px" />
            <el-checkbox v-model="ledgerForm.live" size="small">真调一次模型做估算校准</el-checkbox>
            <el-button type="primary" size="small" :loading="ledgerLoading" @click="doLedger">记账</el-button>
          </div>
          <p class="hint">
            账本是今天所有优化的「仪表盘」：没有账本你根本不知道钱花在哪。
            只看第一张表就能看出输入 token 一路累加——这就是 O(N²)。
          </p>
        </div>

        <template v-if="ledger">
          <div class="card-block">
            <div class="block-head">
              <h4>放大率与浪费占比</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">{{ ledger.model }}</el-tag>
                <el-tag size="small" type="warning" effect="plain">
                  {{ ledger.amplification }}x 放大
                </el-tag>
                <el-tag size="small" type="danger" effect="plain">
                  重复发送 {{ pct(ledger.waste_ratio) }}
                </el-tag>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">一次性问答输入</span>
                <span class="metric-value small">{{ ledger.baseline_in }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">本次总输入</span>
                <span class="metric-value small">{{ ledger.totals.in_tok }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">总输出</span>
                <span class="metric-value small">{{ ledger.totals.out_tok }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">本次费用</span>
                <span class="metric-value">${{ money(ledger.totals.cost) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">累计耗时</span>
                <span class="metric-value">{{ ledger.totals.latency }}s</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">步数</span>
                <span class="metric-value">{{ ledger.totals.steps }}</span>
              </div>
            </div>
          </div>

          <div class="card-block">
            <h4>逐步账本</h4>
            <el-table :data="ledger.rows" size="small">
              <el-table-column prop="idx" label="步" width="60" />
              <el-table-column prop="model" label="模型" width="150" />
              <el-table-column prop="in_tok" label="输入 tok" width="110" />
              <el-table-column prop="out_tok" label="输出 tok" width="110" />
              <el-table-column label="耗时" width="90">
                <template #default="{ row }">{{ row.latency }}s</template>
              </el-table-column>
              <el-table-column label="费用" width="110">
                <template #default="{ row }">${{ money(row.cost) }}</template>
              </el-table-column>
              <el-table-column prop="note" label="备注" min-width="120" />
            </el-table>
          </div>

          <div class="card-block">
            <h4>只改一个变量的三个变体</h4>
            <el-table :data="ledger.variants" size="small">
              <el-table-column prop="name" label="配置" min-width="260" />
              <el-table-column label="输入 tok" width="120">
                <template #default="{ row }">{{ row.in_tok }}</template>
              </el-table-column>
              <el-table-column label="费用" width="120">
                <template #default="{ row }">${{ money(row.cost) }}</template>
              </el-table-column>
              <el-table-column label="相对基线" width="130">
                <template #default="{ row, $index }">
                  <span :class="$index === 0 ? '' : 'good-text'">{{ variantSaving($index) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="放大率" width="110">
                <template #default="{ row }">{{ row.amplification }}x</template>
              </el-table-column>
            </el-table>
            <p class="hint">
              结论：剪工具结果省的钱，比「换个便宜模型」更多且几乎不掉正确率；prompt 瘦身是一次改动、永久生效。
            </p>
          </div>

          <div v-if="ledger.live_probe" class="card-block">
            <div class="block-head">
              <h4>估算 vs 实测（live 探针）</h4>
              <el-tag
                size="small"
                :type="probeBad(ledger.live_probe) ? 'danger' : 'success'"
                effect="plain"
              >
                {{ probeBad(ledger.live_probe) ? '偏差偏大' : '偏差可接受' }}
              </el-tag>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">估算输入</span>
                <span class="metric-value small">{{ ledger.live_probe.estimated_in }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">实测输入</span>
                <span class="metric-value small">{{ ledger.live_probe.actual_in }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">实测输出</span>
                <span class="metric-value small">{{ ledger.live_probe.actual_out }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">偏差</span>
                <span class="metric-value">{{ signedPct(ledger.live_probe.error_ratio) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">单次费用</span>
                <span class="metric-value">${{ money(ledger.live_probe.cost) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">延迟</span>
                <span class="metric-value">{{ ledger.live_probe.latency_ms }}ms</span>
              </div>
            </div>
            <p class="hint">{{ ledger.live_probe.note }}</p>
          </div>

          <div class="card-block">
            <ul class="rule-list">
              <li v-for="(note, index) in ledger.notes" :key="index">{{ note }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ② 分级路由 -->
      <el-tab-pane label="② 分级路由" name="router">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">预设</span>
            <el-select v-model="routerPreset" placeholder="选一个提问" size="small" style="width: 300px" @change="applyRouterPreset">
              <el-option v-for="item in mapping?.presets?.router || []" :key="item" :label="item" :value="item" />
            </el-select>
            <span class="muted">历史轮次</span>
            <el-input-number v-model="routerForm.history_rounds" :min="0" :max="20" size="small" style="width: 90px" />
            <el-checkbox v-model="routerForm.use_llm" size="small">用小模型分类器路由（会调模型）</el-checkbox>
            <el-button type="primary" size="small" :loading="routerLoading" @click="doRouter">路由</el-button>
          </div>
          <el-input v-model="routerForm.question" class="mt" type="textarea" :rows="2" placeholder="用户问题" />
          <p class="hint">
            路由本身必须便宜：用规则或小模型分类，绝不能用主力模型判断「该用哪个模型」——那是负优化。
          </p>
        </div>

        <template v-if="routerResult">
          <div class="grid-2">
            <div class="card-block">
              <div class="block-head">
                <h4>规则路由</h4>
                <el-tag size="small" :type="tierTagType(routerResult.rules.tier)" effect="plain">
                  {{ tierLabel(routerResult.rules.tier) }}
                </el-tag>
              </div>
              <p class="line">{{ routerResult.rules.reason }}</p>
              <p class="hint">零成本、可解释，先做这个；覆盖不到的情况再交给下面的分类器。</p>
            </div>

            <div class="card-block">
              <div class="block-head">
                <h4>小模型分类器</h4>
                <el-tag v-if="routerResult.llm" size="small" :type="tierTagType(routerResult.llm.tier)" effect="plain">
                  {{ tierLabel(routerResult.llm.tier) }}
                </el-tag>
                <el-tag v-else size="small" type="info" effect="plain">未启用</el-tag>
              </div>
              <template v-if="routerResult.llm">
                <p class="line">{{ routerResult.llm.reason }}</p>
                <p class="hint">下发方式：{{ routerResult.llm.method }} · 模型：{{ routerResult.llm.model }}</p>
                <ul class="rule-list">
                  <li v-for="(item, index) in routerResult.llm.attempts" :key="index" class="mono">{{ item }}</li>
                </ul>
              </template>
              <p v-else class="hint">
                勾选「用小模型分类器路由」才会真调模型。降级链：structured_output 的 default → function_calling →
                json_mode → 提示词 + 手动解析 → 规则兜底（思考模式模型前三级常直接 400）。
              </p>
            </div>
          </div>

          <div class="card-block">
            <h4>三档定义</h4>
            <el-table :data="routerResult.tiers" size="small">
              <el-table-column prop="tier" label="档位" width="100" />
              <el-table-column prop="model" label="模型" width="160" />
              <el-table-column prop="role" label="适合什么" min-width="260" />
              <el-table-column label="输入 $/1M" width="120">
                <template #default="{ row }">{{ row.price_in }}</template>
              </el-table-column>
              <el-table-column label="输出 $/1M" width="120">
                <template #default="{ row }">{{ row.price_out }}</template>
              </el-table-column>
            </el-table>
          </div>

          <div class="card-block">
            <h4>三信号升级链（结构化失败 → 工具连续报错 → 兜底封顶）</h4>
            <div class="event-list">
              <div v-for="hop in routerResult.escalation" :key="hop.hop" class="event-row">
                <el-tag size="small" effect="plain">{{ hop.hop === 0 ? '起点' : `跳 ${hop.hop}` }}</el-tag>
                <el-tag size="small" :type="tierTagType(hop.tier)" effect="plain">{{ tierLabel(hop.tier) }}</el-tag>
                <span class="line">{{ hop.trigger }}</span>
              </div>
            </div>
            <p class="hint">升级到 BIG 就封顶：再失败该走「降级交付 + 转人工」，不能无限重试（Day 05）。</p>
          </div>

          <div class="card-block">
            <h4>分流省钱的账（10 次调用：4 小 / 5 主 / 1 兜底）</h4>
            <el-table :data="routerResult.mix.detail" size="small">
              <el-table-column prop="tier" label="档位" width="90" />
              <el-table-column prop="model" label="模型" width="160" />
              <el-table-column prop="calls" label="调用次数" width="100" />
              <el-table-column label="单次费用" width="120">
                <template #default="{ row }">${{ money(row.per_call) }}</template>
              </el-table-column>
              <el-table-column label="小计" width="120">
                <template #default="{ row }">${{ money(row.subtotal) }}</template>
              </el-table-column>
            </el-table>
            <div class="metric-grid mt">
              <div class="metric-card">
                <span class="metric-label">全走主力</span>
                <span class="metric-value">${{ money(routerResult.mix.all_main_cost) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">按档分流</span>
                <span class="metric-value">${{ money(routerResult.mix.mixed_cost) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">整体降幅</span>
                <span class="metric-value good-text">{{ pct(routerResult.mix.saving_ratio) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">单次便宜档省</span>
                <span class="metric-value good-text">{{ pct(routerResult.mix.per_call_saving) }}</span>
              </div>
            </div>
          </div>

          <div class="card-block">
            <ul class="rule-list">
              <li v-for="(note, index) in routerResult.notes" :key="index">{{ note }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ③ 上下文压缩 -->
      <el-tab-pane label="③ 上下文压缩" name="compress">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">工具结果字数</span>
            <el-input-number v-model="compressForm.tool_output_chars" :min="200" :max="20000" :step="400" size="small" style="width: 120px" />
            <span class="muted">历史轮数</span>
            <el-input-number v-model="compressForm.history_rounds" :min="2" :max="40" size="small" style="width: 100px" />
            <span class="muted">预算 tok</span>
            <el-input-number v-model="compressForm.budget" :min="1000" :max="30000" :step="500" size="small" style="width: 120px" />
            <span class="muted">保留最近</span>
            <el-input-number v-model="compressForm.keep_recent" :min="1" :max="5" size="small" style="width: 90px" />
            <el-checkbox v-model="compressForm.use_model" size="small">用小模型做摘要</el-checkbox>
            <el-button type="primary" size="small" :loading="compressLoading" @click="doCompress">压缩</el-button>
          </div>
          <p class="hint">
            静态瘦身改 prompt 本身（一次改动永久生效）；动态裁剪按运行时预算裁。
            两者都不能碰「tool_calls ↔ tool 消息」的配对，也不能裁掉约束锚点。
          </p>
        </div>

        <template v-if="compressResult">
          <div class="grid-2">
            <div class="card-block">
              <div class="block-head">
                <h4>静态：prompt 瘦身</h4>
                <el-tag size="small" type="success" effect="plain">省 {{ pct(compressResult.prompt.saving_ratio) }}</el-tag>
              </div>
              <div class="metric-grid">
                <div class="metric-card">
                  <span class="metric-label">原始</span>
                  <span class="metric-value small">{{ compressResult.prompt.fat_tokens }} tok</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">瘦身后</span>
                  <span class="metric-value small">{{ compressResult.prompt.lean_tokens }} tok</span>
                </div>
              </div>
              <p class="hint">每次调用都省，累积到 N 步就是 N 倍——这是唯一「改一次永久生效」的一刀。</p>
            </div>

            <div class="card-block">
              <div class="block-head">
                <h4>动态：工具结果剪裁</h4>
                <el-tag size="small" type="success" effect="plain">
                  省 {{ pct(compressResult.tool_trim.saved_ratio) }}
                </el-tag>
              </div>
              <div class="metric-grid">
                <div class="metric-card">
                  <span class="metric-label">剪裁前</span>
                  <span class="metric-value small">{{ compressResult.tool_trim.before_tokens }} tok</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">剪裁后</span>
                  <span class="metric-value small">{{ compressResult.tool_trim.after_tokens }} tok</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">保留字段</span>
                  <span class="metric-value small">{{ (compressResult.tool_trim.kept_fields || []).length }}</span>
                </div>
                <div class="metric-card">
                  <span class="metric-label">丢弃字符</span>
                  <span class="metric-value small">{{ compressResult.tool_trim.truncated_chars }}</span>
                </div>
              </div>
              <p class="hint mono">剪裁后：{{ compressResult.tool_trim.sample_after }}</p>
            </div>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>预算触发摘要（按轮压缩）</h4>
              <div class="meta-row">
                <el-tag size="small" :type="compressResult.context.compressed ? 'success' : 'info'" effect="plain">
                  {{ compressResult.context.compressed ? '已压缩' : '未触发' }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ compressResult.context.summary_source }}</el-tag>
                <el-tag size="small" :type="compressResult.context.pairing_ok ? 'success' : 'danger'" effect="plain">
                  配对 {{ compressResult.context.pairing_ok ? '健康' : '被切断' }}
                </el-tag>
              </div>
            </div>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">压缩前</span>
                <span class="metric-value small">{{ compressResult.context.before_tokens }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">压缩后</span>
                <span class="metric-value small">{{ compressResult.context.after_tokens }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">降幅</span>
                <span class="metric-value good-text">{{ pct(compressResult.context.saved_ratio) }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">轮数</span>
                <span class="metric-value">{{ compressResult.context.rounds_before }} → {{ compressResult.context.rounds_after }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">触发线</span>
                <span class="metric-value small">{{ compressResult.context.trigger_tokens }} tok</span>
              </div>
            </div>
            <p class="hint">{{ compressResult.context.reason }}</p>
            <p v-if="compressResult.context.summary" class="line mono">摘要：{{ compressResult.context.summary }}</p>
            <p class="hint">压缩后的消息序列（system 锚点在最前、摘要在中间、最近几轮在最后）：</p>
            <el-table :data="compressResult.context.preview" size="small" max-height="240">
              <el-table-column prop="role" label="role" width="90" />
              <el-table-column prop="tool_calls" label="tool_calls" width="100" />
              <el-table-column prop="content" label="内容" min-width="420">
                <template #default="{ row }">
                  <span class="line">{{ row.content || '—' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>反面教材：按「条数」裁剪</h4>
              <el-tag size="small" type="danger" effect="plain">
                {{ (compressResult.context.naive_pairing_issues || []).length }} 处配对问题
              </el-tag>
            </div>
            <p class="hint">
              只留最近 {{ compressForm.keep_recent + 1 }} 条消息（很多人的第一反应），
              会把 assistant(tool_calls) 和它的 tool 结果切开——provider 直接 400。
            </p>
            <ul v-if="compressResult.context.naive_pairing_issues?.length" class="rule-list">
              <li v-for="(item, index) in compressResult.context.naive_pairing_issues" :key="index" class="bad-text">
                {{ item }}
              </li>
            </ul>
            <p v-else class="hint good-text">这一次恰好没切到配对上，但换个条数就会——所以必须按轮切。</p>
          </div>

          <div class="card-block">
            <ul class="rule-list">
              <li v-for="(note, index) in compressResult.notes" :key="index">{{ note }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ④ 缓存三层 -->
      <el-tab-pane label="④ 缓存三层" name="cache">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">已缓存的问题</span>
            <el-input v-model="cacheForm.cached_question" size="small" style="width: 240px" />
            <span class="muted">新问题</span>
            <el-input v-model="cacheForm.question" size="small" style="width: 200px" />
            <span class="muted">改动数字</span>
            <el-input v-model="cacheForm.other_question" size="small" style="width: 200px" />
            <span class="muted">阈值</span>
            <el-input-number v-model="cacheForm.threshold" :min="0.5" :max="0.999" :step="0.01" size="small" style="width: 110px" />
            <el-button type="primary" size="small" :loading="cacheLoading" @click="doCache">跑三层缓存</el-button>
          </div>
          <p class="hint">
            纯逻辑实验（不调模型）：L1 只读白名单、L2 实体校验 + 用户隔离、L3 前缀哈希。
            三个安全阀缺任何一个都是事故，不是 bug。
          </p>
        </div>

        <template v-if="cacheResult">
          <div class="card-block">
            <div class="block-head">
              <h4>L1 工具结果缓存</h4>
              <div class="meta-row">
                <el-tag size="small" effect="plain">命中 {{ cacheResult.l1.stats.hits }}</el-tag>
                <el-tag size="small" effect="plain">未命中 {{ cacheResult.l1.stats.misses }}</el-tag>
                <el-tag size="small" type="warning" effect="plain">拦截 {{ cacheResult.l1.stats.blocked }}</el-tag>
                <el-tag size="small" effect="plain">命中率 {{ pct(cacheResult.l1.stats.hit_rate) }}</el-tag>
              </div>
            </div>
            <el-table :data="cacheResult.l1.scenarios" size="small">
              <el-table-column prop="step" label="场景" min-width="260">
                <template #default="{ row }">
                  <span class="line">{{ row.step }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="tool" label="工具" width="130" />
              <el-table-column label="结果" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.hit ? 'success' : 'info'" effect="plain">
                    {{ row.hit ? '命中' : '未命中' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="原因" min-width="300">
                <template #default="{ row }">
                  <span class="line">{{ row.reason }}</span>
                </template>
              </el-table-column>
            </el-table>
            <p class="hint">{{ cacheResult.l1.note }}</p>
          </div>

          <div class="card-block">
            <div class="block-head">
              <h4>L2 语义缓存（本轮最重要的三条探针）</h4>
              <div class="meta-row">
                <el-tag size="small" type="warning" effect="plain">
                  实体拦住 {{ cacheResult.l2.stats.blocked_entity }} 次
                </el-tag>
                <el-tag size="small" type="warning" effect="plain">
                  跨用户拦住 {{ cacheResult.l2.stats.blocked_user }} 次
                </el-tag>
              </div>
            </div>
            <el-table :data="cacheResult.l2.matrix" size="small">
              <el-table-column prop="question" label="问题" min-width="200">
                <template #default="{ row }">
                  <span class="line">{{ row.question }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="user_id" label="用户" width="80" />
              <el-table-column label="相似度" width="90">
                <template #default="{ row }">{{ row.score }}</template>
              </el-table-column>
              <el-table-column label="结果" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.hit ? 'success' : 'danger'" effect="plain">
                    {{ row.hit ? '命中' : '拒绝' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="原因" min-width="320">
                <template #default="{ row }">
                  <span class="line">{{ row.reason }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="expectation" label="期望" min-width="240">
                <template #default="{ row }">
                  <span class="line">{{ row.expectation }}</span>
                </template>
              </el-table-column>
            </el-table>
            <p class="hint">{{ cacheResult.l2.note }}</p>
          </div>

          <div class="card-block">
            <h4>L3 前缀缓存（同一份 system，连发 5 次请求）</h4>
            <div class="grid-2">
              <div class="sub-card">
                <div class="block-head">
                  <h5>坏姿势：system 开头拼带秒时间戳</h5>
                  <el-tag size="small" type="danger" effect="plain">命中率 {{ pct(cacheResult.l3.prefix_stability.bad.hit_rate) }}</el-tag>
                </div>
                <p class="hint mono">唯一前缀 {{ cacheResult.l3.prefix_stability.bad.unique }} / {{ cacheResult.l3.prefix_stability.requests }}</p>
                <p class="hint mono">{{ (cacheResult.l3.prefix_stability.bad.hashes || []).join(' · ') }}</p>
                <p class="hint">{{ cacheResult.l3.prefix_stability.bad.note }}</p>
              </div>
              <div class="sub-card">
                <div class="block-head">
                  <h5>好姿势：稳定前缀 + 日期后置</h5>
                  <el-tag size="small" type="success" effect="plain">命中率 {{ pct(cacheResult.l3.prefix_stability.good.hit_rate) }}</el-tag>
                </div>
                <p class="hint mono">唯一前缀 {{ cacheResult.l3.prefix_stability.good.unique }} / {{ cacheResult.l3.prefix_stability.requests }}</p>
                <p class="hint mono">{{ (cacheResult.l3.prefix_stability.good.hashes || []).join(' · ') }}</p>
                <p class="hint">{{ cacheResult.l3.prefix_stability.good.note }}</p>
              </div>
            </div>
            <p class="hint mono">示例请求的 prefix_hash：{{ cacheResult.l3.sample_request.prefix_hash }}（这个数字必须进监控）</p>
          </div>

          <div class="card-block">
            <ul class="rule-list">
              <li v-for="(note, index) in cacheResult.notes" :key="index">{{ note }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑤ 并行与流式 -->
      <el-tab-pane label="⑤ 并行 / 流式" name="parallel">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">并发上限</span>
            <el-input-number v-model="parallelForm.limit" :min="1" :max="8" size="small" style="width: 90px" />
            <span class="muted">超时 ms</span>
            <el-input-number v-model="parallelForm.timeout_ms" :min="200" :max="10000" :step="100" size="small" style="width: 120px" />
            <span class="muted">注入失败</span>
            <el-select v-model="parallelForm.fail_index" size="small" style="width: 130px">
              <el-option label="不注入" :value="-1" />
              <el-option v-for="(call, index) in parallelCalls" :key="index" :label="`第 ${index + 1} 个失败`" :value="index" />
            </el-select>
            <el-button type="primary" size="small" :loading="parallelLoading" @click="doParallel">跑并行</el-button>
          </div>
          <el-table class="mt" :data="parallelCalls" size="small">
            <el-table-column prop="name" label="工具" width="180" />
            <el-table-column label="模拟耗时 ms" width="180">
              <template #default="{ row }">
                <el-input-number v-model="row.ms" :min="100" :max="2000" :step="50" size="small" style="width: 130px" />
              </template>
            </el-table-column>
            <el-table-column label="说明" min-width="300">
              <template #default="{ row }">
                <span class="line">{{ row.name === 'get_order' ? '有依赖：必须先拿到 order_id' : '只读、幂等，可并行' }}</span>
              </template>
            </el-table-column>
          </el-table>
          <p class="hint">
            并行三前提：无依赖、幂等、有并发上限。写操作不要并行——失败会重试，重试就是重复下单。
          </p>
        </div>

        <template v-if="parallelResult">
          <div class="card-block">
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">串行估算</span>
                <span class="metric-value">{{ parallelResult.serial_ms }}ms</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">并行实测</span>
                <span class="metric-value good-text">{{ parallelResult.parallel_ms }}ms</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">实测加速比</span>
                <span class="metric-value">{{ parallelResult.speedup }}x</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">理论加速比</span>
                <span class="metric-value">{{ parallelResult.theoretical_speedup }}x</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">理论并行耗时</span>
                <span class="metric-value small">{{ parallelResult.theoretical_ms }}ms</span>
              </div>
            </div>
            <h5 class="mt">时间轴（并发上限 {{ parallelForm.limit }}）</h5>
            <div class="timeline">
              <div v-for="item in parallelResult.timeline" :key="item.name + item.start_ms" class="timeline-row">
                <span class="timeline-label mono">{{ item.name }}</span>
                <div class="timeline-track">
                  <div class="timeline-bar" :style="barStyle(item)" />
                </div>
                <span class="hint mono">{{ item.start_ms }}→{{ item.end_ms }}ms</span>
              </div>
            </div>
          </div>

          <div class="card-block">
            <h4>逐工具结果</h4>
            <el-table :data="parallelResult.results" size="small">
              <el-table-column prop="name" label="工具" width="150" />
              <el-table-column label="结果" width="100">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.ok ? 'success' : 'danger'" effect="plain">
                    {{ row.ok ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="ms" label="耗时 ms" width="120" />
              <el-table-column prop="error" label="错误" min-width="320">
                <template #default="{ row }">
                  <span class="line bad-text">{{ row.error || '—' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="card-block">
            <ul class="rule-list">
              <li v-for="(note, index) in parallelResult.notes" :key="index">{{ note }}</li>
            </ul>
          </div>
        </template>
      </el-tab-pane>

      <!-- ⑥ 预算熔断 + A/B -->
      <el-tab-pane label="⑥ 预算熔断 / A-B" name="budget">
        <div class="card-block">
          <div class="row-actions">
            <span class="muted">模式</span>
            <el-radio-group v-model="budgetForm.mode" size="small">
              <el-radio-button label="simulate">simulate（确定性）</el-radio-button>
              <el-radio-button label="live">live（真模型）</el-radio-button>
            </el-radio-group>
            <span class="muted">max_cost $</span>
            <el-input-number v-model="budgetForm.max_cost" :min="0.0001" :max="0.5" :step="0.0005" :precision="4" size="small" style="width: 120px" />
            <span class="muted">max_steps</span>
            <el-input-number v-model="budgetForm.max_steps" :min="1" :max="8" size="small" style="width: 100px" />
            <span class="muted">max_wall s</span>
            <el-input-number v-model="budgetForm.max_wall" :min="1" :max="120" size="small" style="width: 100px" />
            <el-button type="primary" size="small" :loading="budgetLoading" @click="doBudget">跑一次</el-button>
          </div>
          <el-input v-model="budgetForm.question" class="mt" type="textarea" :rows="2" placeholder="用户问题" />
          <p class="hint">熔断后不报错：摘掉工具、逼模型用已有信息总结，用户拿到「部分答案 + 转人工」比 500 好。</p>
        </div>

        <template v-if="budgetResult">
          <div class="card-block">
            <div class="block-head">
              <h4>熔断现场</h4>
              <div class="meta-row">
                <el-tag size="small" :type="budgetResult.degraded ? 'warning' : 'success'" effect="plain">
                  {{ budgetResult.degraded ? '已降级交付' : '正常收敛' }}
                </el-tag>
                <el-tag size="small" effect="plain">{{ budgetResult.model }}</el-tag>
                <el-tag size="small" effect="plain">{{ budgetResult.elapsed_ms }}ms</el-tag>
              </div>
            </div>
            <p class="hint mono">熔断原因：{{ budgetResult.stop_reason }}</p>
            <div class="metric-grid">
              <div class="metric-card">
                <span class="metric-label">费用 / 上限</span>
                <span class="metric-value small">
                  ${{ money(budgetResult.budget.cost) }} / ${{ budgetResult.budget.max_cost }}
                </span>
              </div>
              <div class="metric-card">
                <span class="metric-label">步数 / 上限</span>
                <span class="metric-value small">{{ budgetResult.budget.steps }} / {{ budgetResult.budget.max_steps }}</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">墙钟</span>
                <span class="metric-value small">{{ budgetResult.budget.wall }}s</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">总输入</span>
                <span class="metric-value small">{{ budgetResult.ledger.in_tok }} tok</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">放大率</span>
                <span class="metric-value">{{ budgetResult.ledger.amplification }}x</span>
              </div>
              <div class="metric-card">
                <span class="metric-label">缓存命中率</span>
                <span class="metric-value">{{ pct(budgetResult.cache.hit_rate) }}</span>
              </div>
            </div>
            <p class="line mt">{{ budgetResult.answer }}</p>
          </div>

          <div class="card-block">
            <h4>逐步预算状态</h4>
            <el-table :data="budgetResult.steps" size="small">
              <el-table-column prop="idx" label="步" width="60" />
              <el-table-column label="节点" width="110">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.node === 'degrade' ? 'warning' : row.node === 'tool' ? 'info' : 'primary'" effect="plain">
                    {{ row.node }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="model" label="模型 / 工具" width="160" />
              <el-table-column label="in / out" width="130">
                <template #default="{ row }">{{ row.in_tok }} / {{ row.out_tok }}</template>
              </el-table-column>
              <el-table-column label="费用" width="110">
                <template #default="{ row }">${{ money(row.cost) }}</template>
              </el-table-column>
              <el-table-column label="累计" width="110">
                <template #default="{ row }">${{ money(row.cost_so_far) }}</template>
              </el-table-column>
              <el-table-column prop="action" label="做了什么" min-width="340">
                <template #default="{ row }">
                  <span class="line">{{ row.action }}</span>
                </template>
              </el-table-column>
            </el-table>
            <ul class="rule-list">
              <li v-for="(note, index) in budgetResult.notes" :key="index">{{ note }}</li>
            </ul>
          </div>
        </template>

        <div class="card-block">
          <div class="block-head">
            <h4>四个杠杆的 A/B 投影（正确率留给 Day 16）</h4>
            <el-button size="small" type="primary" :loading="abLoading" @click="doAb">算一遍</el-button>
          </div>
          <div class="row-actions">
            <span class="muted">步数</span>
            <el-input-number v-model="abForm.steps" :min="1" :max="8" size="small" style="width: 90px" />
            <span class="muted">工具结果 token</span>
            <el-input-number v-model="abForm.tool_tokens" :min="50" :max="3000" :step="50" size="small" style="width: 120px" />
            <span class="muted">缓存命中率</span>
            <el-input-number v-model="abForm.cache_hit_rate" :min="0" :max="0.95" :step="0.01" size="small" style="width: 110px" />
            <span class="muted">每步并发工具数</span>
            <el-input-number v-model="abForm.parallel_tools" :min="1" :max="8" size="small" style="width: 110px" />
            <span class="muted">单工具耗时 ms</span>
            <el-input-number v-model="abForm.tool_ms" :min="50" :max="5000" :step="50" size="small" style="width: 120px" />
          </div>

          <template v-if="abResult">
            <el-table class="mt" :data="abResult.rows" size="small">
              <el-table-column prop="name" label="配置" min-width="320">
                <template #default="{ row }">
                  <span class="line">{{ row.name }}</span>
                </template>
              </el-table-column>
              <el-table-column label="输入 tok" width="110">
                <template #default="{ row }">{{ row.in_tok }}</template>
              </el-table-column>
              <el-table-column label="费用" width="110">
                <template #default="{ row }">${{ money(row.cost) }}</template>
              </el-table-column>
              <el-table-column label="延迟" width="100">
                <template #default="{ row }">{{ row.latency }}s</template>
              </el-table-column>
              <el-table-column label="成本降幅" width="110">
                <template #default="{ row }">
                  <span :class="row.delta_cost_ratio > 0 ? 'good-text' : ''">{{ pct(row.delta_cost_ratio) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="延迟降幅" width="110">
                <template #default="{ row }">
                  <span :class="row.delta_latency_ratio > 0 ? 'good-text' : ''">{{ pct(row.delta_latency_ratio) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="正确率" width="110">
                <template #default>
                  <span class="hint">Day 16 实测</span>
                </template>
              </el-table-column>
            </el-table>

            <el-alert class="mt" type="success" :closable="false" :title="abResult.conclusion" />
            <p class="hint">
              假设：{{ abResult.assumptions.note }}（prefill {{ abResult.assumptions.prefill_sec_per_1k }}s/1k tok ·
              decode {{ abResult.assumptions.decode_sec_per_token }}s/tok · 编排 {{ abResult.assumptions.overhead_sec_per_step }}s/步）
            </p>
            <p class="hint">
              门禁：{{ abResult.gate.rule }}；{{ abResult.gate.day16_hint }}
            </p>
            <ul class="rule-list">
              <li v-for="(note, index) in abResult.notes" :key="index">{{ note }}</li>
            </ul>
            <p class="hint mono">报告落盘：{{ abResult.files?.ab_report }}</p>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 17 实验台：成本与延迟优化——账本 / 分级路由 / 上下文压缩 / 缓存三层 / 并行 / 预算熔断 + A/B
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDay17Mapping,
  listChatModels,
  runDay17Ab,
  runDay17BudgetAgent,
  runDay17Cache,
  runDay17Compress,
  runDay17Ledger,
  runDay17Parallel,
  runDay17Router
} from '@/api/study'

const mapping = ref(null)
const models = ref([])
const modelId = ref(null)
const subTab = ref('ledger')

const pitfalls = computed(() => mapping.value?.pitfalls || [])

// ---------- 格式化 ----------
// 百分比（后端统一传 0~1 的小数）
const pct = (value) => `${Math.round((Number(value) || 0) * 1000) / 10}%`
// 带符号的百分比：A/B 表要一眼看出降了多少
const signedPct = (value) => {
  if (value === null || value === undefined) return '—'
  const num = Number(value) || 0
  return `${num > 0 ? '+' : ''}${Math.round(num * 1000) / 10}%`
}
// 美元金额：小到 0.0001 级别，固定 6 位小数会太长，这里保留有效位
const money = (value) => {
  const num = Number(value) || 0
  if (num === 0) return '0'
  if (num < 0.001) return num.toFixed(6)
  if (num < 0.1) return num.toFixed(5)
  return num.toFixed(4)
}
// 档位标签
const tierLabel = (tier) =>
  ({ small: '便宜档 small', main: '主力 main', big: '兜底 big' }[tier] || tier || '—')
const tierTagType = (tier) => ({ small: 'success', main: 'primary', big: 'warning' }[tier] || 'info')

// ---------- ① 成本账本 ----------
const ledgerForm = ref({ steps: 5, tool_tokens: 800, final_output: 500, live: false })
const ledger = ref(null)
const ledgerLoading = ref(false)

// 变体相对基线的成本降幅
const variantSaving = (index) => {
  if (!ledger.value || index === 0) return '基线'
  const base = ledger.value.variants[0]?.cost || 0
  const current = ledger.value.variants[index]?.cost || 0
  if (!base) return '—'
  return `-${pct(1 - current / base)}`
}
// live 探针偏差超过 ±20% 就标红（课程建议）
const probeBad = (probe) => {
  if (!probe || probe.error_ratio === null || probe.error_ratio === undefined) return false
  return Math.abs(Number(probe.error_ratio)) > 0.2
}

// 跑账本：默认纯估算，勾 live 才真调一次模型
const doLedger = async () => {
  ledgerLoading.value = true
  try {
    ledger.value = await runDay17Ledger({
      ...ledgerForm.value,
      model_config_id: modelId.value || undefined
    })
    ElMessage.success(`账本已生成：放大率 ${ledger.value.amplification}x`)
  } finally {
    ledgerLoading.value = false
  }
}

// ---------- ② 分级路由 ----------
const routerForm = ref({ question: '营业时间几点', history_rounds: 0, use_llm: false })
const routerPreset = ref('')
const routerResult = ref(null)
const routerLoading = ref(false)

const applyRouterPreset = (value) => {
  if (value) routerForm.value.question = value
}

// 规则路由零成本；勾 use_llm 才真调模型做分类器
const doRouter = async () => {
  routerLoading.value = true
  try {
    routerResult.value = await runDay17Router({
      ...routerForm.value,
      model_config_id: modelId.value || undefined
    })
  } finally {
    routerLoading.value = false
  }
}

// ---------- ③ 上下文压缩 ----------
const compressForm = ref({
  tool_output_chars: 3200,
  history_rounds: 12,
  budget: 6000,
  keep_recent: 2,
  use_model: false
})
const compressResult = ref(null)
const compressLoading = ref(false)

// 压缩：默认抽取式摘要（不花钱），勾 use_model 才用小模型摘要
const doCompress = async () => {
  compressLoading.value = true
  try {
    compressResult.value = await runDay17Compress({
      ...compressForm.value,
      model_config_id: modelId.value || undefined
    })
    ElMessage.success(
      compressResult.value.context.compressed
        ? `已压缩：${compressResult.value.context.before_tokens} → ${compressResult.value.context.after_tokens} tok`
        : '未触发压缩（预算够用）'
    )
  } finally {
    compressLoading.value = false
  }
}

// ---------- ④ 缓存三层 ----------
const cacheForm = ref({
  cached_question: '退款 45 元什么时候到账',
  question: '退款 45 元多久到账',
  other_question: '退款 450 元多久到账',
  threshold: 0.95
})
const cacheResult = ref(null)
const cacheLoading = ref(false)

// 纯逻辑实验：不调模型、不发网络请求
const doCache = async () => {
  cacheLoading.value = true
  try {
    cacheResult.value = await runDay17Cache({ ...cacheForm.value })
  } finally {
    cacheLoading.value = false
  }
}

// ---------- ⑤ 并行 ----------
const parallelCalls = ref([
  { name: 'get_order', ms: 620 },
  { name: 'get_shipping', ms: 980 },
  { name: 'get_coupon', ms: 740 },
  { name: 'get_invoice', ms: 1150 }
])
const parallelForm = ref({ limit: 4, timeout_ms: 3000, fail_index: -1 })
const parallelResult = ref(null)
const parallelLoading = ref(false)

// 时间轴条：按最大结束时间归一化，left / width 用百分比
const barStyle = (item) => {
  const timeline = parallelResult.value?.timeline || []
  const maxEnd = Math.max(1, ...timeline.map((row) => row.end_ms || 0))
  const left = ((item.start_ms || 0) / maxEnd) * 100
  const width = Math.max(2, ((item.end_ms - item.start_ms) / maxEnd) * 100)
  return { left: `${left}%`, width: `${width}%` }
}

// 真跑一遍 asyncio 并行（毫秒级，最多几秒）
const doParallel = async () => {
  parallelLoading.value = true
  try {
    parallelResult.value = await runDay17Parallel({
      tools: parallelCalls.value.map((row) => ({ name: row.name, ms: row.ms })),
      limit: parallelForm.value.limit,
      timeout_ms: parallelForm.value.timeout_ms,
      fail_index: parallelForm.value.fail_index
    })
    ElMessage.success(
      `并行 ${parallelResult.value.parallel_ms}ms / 串行 ${parallelResult.value.serial_ms}ms`
    )
  } finally {
    parallelLoading.value = false
  }
}

// ---------- ⑥ 预算熔断 + A/B ----------
const budgetForm = ref({
  question: '帮我查下订单 SO20261115001 的物流，顺便确认金额、能不能用券、能不能开发票',
  max_cost: 0.002,
  max_steps: 4,
  max_wall: 15,
  mode: 'simulate'
})
const budgetResult = ref(null)
const budgetLoading = ref(false)

// simulate 是确定性脚本化模型（必然熔断）；live 才真调模型
const doBudget = async () => {
  budgetLoading.value = true
  try {
    budgetResult.value = await runDay17BudgetAgent({
      ...budgetForm.value,
      model_config_id: modelId.value || undefined
    })
    ElMessage[budgetResult.value.degraded ? 'warning' : 'success'](
      budgetResult.value.degraded ? '预算熔断，已降级交付' : '正常收敛'
    )
  } finally {
    budgetLoading.value = false
  }
}

const abForm = ref({ steps: 5, tool_tokens: 800, cache_hit_rate: 0.28, parallel_tools: 4, tool_ms: 900 })
const abResult = ref(null)
const abLoading = ref(false)

// 不调模型：按同一套参数现算四档配置的成本与延迟
const doAb = async () => {
  abLoading.value = true
  try {
    abResult.value = await runDay17Ab({
      steps: abForm.value.steps,
      tool_tokens: abForm.value.tool_tokens,
      cache_hit_rate: abForm.value.cache_hit_rate,
      parallel_tools: abForm.value.parallel_tools,
      tool_ms: abForm.value.tool_ms
    })
  } finally {
    abLoading.value = false
  }
}

// ---------- 初始化 ----------
const loadMapping = async () => {
  try {
    mapping.value = await getDay17Mapping()
  } catch {
    // 概念表失败不阻塞实验区
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
.day17 {
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

  // 并行时间轴：每条一组「名字 + 轨道 + 起止」
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 6px;
  }

  .timeline-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .timeline-label {
    width: 110px;
    flex: 0 0 110px;
    color: $text-regular;
  }

  .timeline-track {
    position: relative;
    flex: 1;
    height: 14px;
    border-radius: 7px;
    background: #f0f2f8;
    overflow: hidden;
  }

  .timeline-bar {
    position: absolute;
    top: 0;
    height: 100%;
    border-radius: 7px;
    background: linear-gradient(90deg, #6f8cff, #9aa9ff);
  }
}
</style>
