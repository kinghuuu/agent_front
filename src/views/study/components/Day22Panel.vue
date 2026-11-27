<template>
  <!-- Day 22 实验台：代码执行沙箱——失败复现 / AST / L1 / 网络文件 / L2 / 代码循环 / 接回 Day21 / 生产与压测 -->
  <div class="day22">
    <el-alert
      class="tip"
      type="warning"
      :closable="false"
      show-icon
      title="LLM 负责写程序，解释器负责算结果，内核负责不让它跑出去：三层各司其职，谁也别越界"
    />

    <!-- 概念区 -->
    <div class="card-block">
      <h4>七类威胁：每一类对应一道具体的闸（§2）</h4>
      <el-table :data="mapping?.threats || []" size="small" empty-text="加载中…">
        <el-table-column prop="no" label="#" width="52" />
        <el-table-column prop="threat" label="威胁" width="130" />
        <el-table-column prop="code" label="典型代码" min-width="280">
          <template #default="{ row }"><span class="mono">{{ row.code }}</span></template>
        </el-table-column>
        <el-table-column prop="gate" label="靠什么挡" min-width="320">
          <template #default="{ row }"><span class="line">{{ row.gate }}</span></template>
        </el-table-column>
      </el-table>
      <p class="hint">
        沙箱的目标不是「让它不能做坏事」，而是「它做坏事时炸不到你」。T7 是唯一挡不住的一类：
        它取决于隔离层有没有洞，不取决于你的代码写得对不对。
      </p>
    </div>

    <div class="card-block">
      <el-collapse>
        <el-collapse-item title="为什么不让模型算 / 新旧分工 / 什么时候上沙箱（§1）" name="why">
          <el-table :data="mapping?.why_calc || []" size="small">
            <el-table-column prop="task" label="任务" width="220" />
            <el-table-column prop="accuracy" label="模型表现" width="110" />
            <el-table-column prop="reason" label="原因" min-width="440" />
          </el-table>
          <el-table class="mt" :data="mapping?.division || []" size="small">
            <el-table-column prop="layer" label="层次" width="130" />
            <el-table-column prop="who" label="谁负责" min-width="340" />
            <el-table-column prop="verdict" label="结论" min-width="340" />
          </el-table>
          <el-table class="mt" :data="mapping?.routing || []" size="small">
            <el-table-column prop="scene" label="场景" width="220" />
            <el-table-column prop="how" label="做法" min-width="300" />
            <el-table-column prop="why" label="理由" min-width="300" />
          </el-table>
        </el-collapse-item>

        <el-collapse-item title="五级隔离 / 选型决策树（§3）" name="levels">
          <el-table :data="mapping?.levels || []" size="small">
            <el-table-column prop="level" label="等级" width="60" />
            <el-table-column prop="impl" label="实现" min-width="260" />
            <el-table-column prop="cold" label="冷启动" width="150" />
            <el-table-column prop="pandas" label="pandas" width="140" />
            <el-table-column prop="escape" label="逃逸难度" min-width="260" />
            <el-table-column prop="cost" label="成本" width="70" />
            <el-table-column prop="when" label="适用" min-width="240" />
          </el-table>
          <el-table class="mt" :data="mapping?.decision_tree || []" size="small">
            <el-table-column prop="source" label="代码来源" min-width="320" />
            <el-table-column prop="level" label="隔离等级" width="250" />
            <el-table-column prop="note" label="为什么" min-width="280" />
          </el-table>
        </el-collapse-item>

        <el-collapse-item title="五道闸 / 资源限制（§4、§8）" name="gates">
          <el-table :data="mapping?.gates || []" size="small">
            <el-table-column prop="no" label="#" width="46" />
            <el-table-column prop="gate" label="闸" width="150" />
            <el-table-column prop="blocks" label="挡什么" min-width="320" />
            <el-table-column prop="cannot" label="挡不住什么" min-width="380">
              <template #default="{ row }"><span class="line">{{ row.cannot }}</span></template>
            </el-table-column>
          </el-table>
          <el-table class="mt" :data="mapping?.limits || []" size="small">
            <el-table-column prop="resource" label="资源" width="140" />
            <el-table-column prop="means" label="手段" min-width="300" />
            <el-table-column prop="note" label="注意点" min-width="420" />
          </el-table>
        </el-collapse-item>

        <el-collapse-item :title="`容器参数 / 指标 / 六个坑 / 速查表（${pitfalls.length} 条坑）`" name="rest">
          <el-table :data="mapping?.container_args || []" size="small">
            <el-table-column prop="arg" label="参数" min-width="300" />
            <el-table-column prop="blocks" label="挡哪条" width="90" />
            <el-table-column prop="without" label="不加会怎样" min-width="420" />
          </el-table>
          <el-table class="mt" :data="mapping?.metrics || []" size="small">
            <el-table-column prop="metric" label="指标" width="180" />
            <el-table-column prop="healthy" label="健康值" width="130" />
            <el-table-column prop="abnormal" label="异常含义" min-width="420" />
          </el-table>
          <el-table class="mt" :data="pitfalls" size="small">
            <el-table-column prop="no" label="#" width="42" />
            <el-table-column prop="title" label="坑" width="220" />
            <el-table-column prop="symptom" label="现象" min-width="340">
              <template #default="{ row }"><span class="line">{{ row.symptom }}</span></template>
            </el-table-column>
            <el-table-column prop="fix" label="修法" min-width="340">
              <template #default="{ row }"><span class="line">{{ row.fix }}</span></template>
            </el-table-column>
          </el-table>
          <el-table class="mt" :data="mapping?.cheatsheet || []" size="small">
            <el-table-column prop="topic" label="问题" width="170" />
            <el-table-column prop="content" label="结论" min-width="380" />
            <el-table-column prop="key" label="关键点" min-width="280" />
          </el-table>
          <p class="hint mono">环境：{{ versionText }}</p>
          <p class="hint mono">审计字段：{{ (mapping?.audit_fields || []).join(' · ') }}</p>
        </el-collapse-item>
      </el-collapse>
    </div>

    <el-tabs v-model="subTab" type="card">
      <!-- ① 失败复现 -->
      <el-tab-pane label="① 失败复现" name="why">
        <div class="card-block">
          <div class="form-grid">
            <div class="field field-wide">
              <span class="label">问题</span>
              <el-input v-model="whyForm.question" size="small" />
            </div>
            <el-button type="primary" size="small" :loading="whyLoading" @click="doWhy">复现两种失败</el-button>
          </div>
          <template v-if="why">
            <el-alert
              class="mt"
              :type="why.llm_wrong ? 'error' : 'success'"
              :closable="false"
              :title="`解释器精确值 ${why.exact_value.toFixed(2)} 元 / 模型给的答案错了吗：${why.llm_wrong ? '是' : '否'}`"
            />
            <h5 class="mt">模型的回答（格式完美，数字错）</h5>
            <pre class="code-box">{{ why.llm_answer }}</pre>
            <h5 class="mt">exec 逃逸链：清空 builtins 之后</h5>
            <div v-for="(item, index) in why.exec_cases" :key="index" class="case-card mt">
              <div class="block-head">
                <h5>{{ item.name }} <el-tag size="small" :type="item.escaped ? 'danger' : 'info'">{{ item.escaped ? '逃出去了' : '直接失败' }}</el-tag></h5>
                <span class="mono">globals = {{ item.globals }}</span>
              </div>
              <pre class="code-box">{{ item.code }}</pre>
              <p class="hint mono">实际：{{ item.actual }}</p>
              <p class="hint">{{ item.lesson }}</p>
            </div>
            <ul class="rule-list"><li v-for="note in why.corrections" :key="note">课程修正：{{ note }}</li></ul>
            <ul class="rule-list"><li v-for="note in why.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ② AST 筛查 -->
      <el-tab-pane label="② AST 筛查" name="ast">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">样本</span>
              <el-select v-model="astForm.case" size="small" style="width: 200px">
                <el-option label="全部样本" value="all" />
                <el-option label="正常 pandas" value="normal" />
                <el-option label="手滑写文件" value="write" />
                <el-option label="import os" value="import_os" />
                <el-option label="读环境变量" value="env" />
                <el-option label="dunder 逃逸" value="dunder" />
                <el-option label="四种绕过" value="bypass" />
              </el-select>
            </div>
            <el-button type="primary" size="small" :loading="astLoading" @click="doAst">筛查</el-button>
          </div>
          <template v-if="ast">
            <div class="chips mt">
              <el-tag size="small" type="danger">绕过漏了 {{ ast.bypass_leaked }} / 4（课程实测 2）</el-tag>
              <el-tag size="small" type="warning">覆盖源文件 {{ ast.write_file_blocked ? '被拦' : '没拦住' }}</el-tag>
              <el-tag size="small" effect="plain">AST 是 lint，不是 jail</el-tag>
            </div>
            <el-table class="mt" :data="ast.cases" size="small">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <pre class="code-box">{{ row.code }}</pre>
                  <p class="hint mono">imports: {{ pretty(row.imports) }} / 审计: {{ pretty(row.review) }}</p>
                </template>
              </el-table-column>
              <el-table-column prop="group" label="类别" width="90" />
              <el-table-column prop="name" label="样本" min-width="240" />
              <el-table-column label="判定" width="90">
                <template #default="{ row }"><el-tag size="small" :type="row.allowed ? 'success' : 'danger'">{{ row.allowed ? '放行' : '拦截' }}</el-tag></template>
              </el-table-column>
              <el-table-column label="命中" min-width="320">
                <template #default="{ row }"><span class="mono">{{ row.deny.join(' / ') || '-' }}</span></template>
              </el-table-column>
            </el-table>
            <ul class="rule-list"><li v-for="note in ast.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ③ L1 沙箱 -->
      <el-tab-pane label="③ L1 沙箱" name="l1">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">样例</span>
              <el-select v-model="l1Form.case" size="small" style="width: 180px">
                <el-option label="全部六个" value="all" />
                <el-option label="正常计算" value="normal" />
                <el-option label="CPU 死循环" value="cpu" />
                <el-option label="sleep 骗时间" value="sleep" />
                <el-option label="内存炸弹" value="mem" />
                <el-option label="fork bomb" value="fork" />
                <el-option label="读环境变量" value="env" />
              </el-select>
            </div>
            <div class="field"><span class="label">模式</span>
              <el-select v-model="l1Form.mode" size="small" style="width: 120px">
                <el-option label="回放实测" value="simulate" />
                <el-option label="真起子进程" value="live" />
              </el-select>
            </div>
            <div class="field"><span class="label">wall 超时</span>
              <el-input-number v-model="l1Form.wall_timeout" size="small" :min="1" :max="10" controls-position="right" style="width: 110px" />
            </div>
            <div class="field"><span class="label">内存 MB</span>
              <el-input-number v-model="l1Form.mem_mb" size="small" :min="32" :max="512" controls-position="right" style="width: 110px" />
            </div>
            <div class="field"><span class="label">CPU 秒</span>
              <el-input-number v-model="l1Form.cpu_s" size="small" :min="1" :max="10" controls-position="right" style="width: 100px" />
            </div>
            <el-button type="primary" size="small" :loading="l1Loading" @click="doL1">运行沙箱</el-button>
          </div>
          <div class="field field-wide mt">
            <span class="label">自定义代码（可选，会先过 AST 筛查；fork bomb 与 Windows 内存炸弹永不真跑）</span>
            <el-input v-model="l1Form.custom_code" type="textarea" :rows="2" size="small" placeholder="例如：print(1234567.89 * 0.0735)" />
          </div>
          <template v-if="l1">
            <div class="chips mt">
              <el-tag size="small" effect="plain">{{ l1.platform }}</el-tag>
              <el-tag size="small" effect="plain">CPU：{{ l1.limits.cpu }}</el-tag>
              <el-tag size="small" effect="plain">内存：{{ l1.limits.memory }}</el-tag>
              <el-tag size="small" effect="plain">回收：{{ l1.limits.process_group }}</el-tag>
            </div>
            <el-table class="mt" :data="l1.cases" size="small">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <pre class="code-box">{{ row.code }}</pre>
                  <p class="hint mono">stdout: {{ row.stdout || '(空)' }}</p>
                  <p class="hint mono">stderr: {{ row.stderr || '(空)' }}</p>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="样例" min-width="210" />
              <el-table-column label="结果" width="80">
                <template #default="{ row }"><el-tag size="small" :type="row.ok ? 'success' : 'danger'">{{ row.ok ? 'ok' : '失败' }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="exit_code" label="exit" width="70" />
              <el-table-column label="hit_limit" width="100">
                <template #default="{ row }"><span class="mono">{{ row.hit_limit || '-' }}</span></template>
              </el-table-column>
              <el-table-column prop="duration_ms" label="耗时(ms)" width="90" />
              <el-table-column label="说明" min-width="240">
                <template #default="{ row }"><span class="line">{{ row.skipped || '-' }}</span></template>
              </el-table-column>
            </el-table>
            <ul class="rule-list"><li v-for="note in l1.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ④ 网络与文件 -->
      <el-tab-pane label="④ 网络与文件" name="netfs">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">探针</span>
              <el-select v-model="netfsForm.probe" size="small" style="width: 240px">
                <el-option label="全部四条" value="all" />
                <el-option label="软断网（socket 模块）" value="socket" />
                <el-option label="绕过（_socket）" value="raw_socket" />
                <el-option label="读宿主机文件" value="host_read" />
                <el-option label="写宿主机文件" value="host_write" />
              </el-select>
            </div>
            <div class="field"><span class="label">模式</span>
              <el-select v-model="netfsForm.mode" size="small" style="width: 120px">
                <el-option label="回放实测" value="simulate" />
                <el-option label="真跑探针" value="live" />
              </el-select>
            </div>
            <el-button type="primary" size="small" :loading="netfsLoading" @click="doNetfs">探墙</el-button>
          </div>
          <template v-if="netfs">
            <el-alert class="mt" type="error" :closable="false" :title="`四条探针里 ${netfs.broken} 条墙不存在或被绕过：L1 没有命名空间`" />
            <el-table class="mt" :data="netfs.probes" size="small">
              <el-table-column type="expand">
                <template #default="{ row }"><pre class="code-box">{{ row.code }}</pre></template>
              </el-table-column>
              <el-table-column prop="name" label="探针" min-width="220" />
              <el-table-column label="结果" width="80">
                <template #default="{ row }"><el-tag size="small" :type="row.ok ? 'danger' : 'success'">{{ row.ok ? '执行了' : '被拦' }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="last_line" label="最后一行" min-width="320" />
              <el-table-column prop="wall" label="墙" min-width="220" />
            </el-table>
            <div class="two-col mt">
              <div><h5>软断网 patch（runner 里、exec 之前）</h5><pre class="code-box">{{ netfs.guard_code }}</pre></div>
              <div>
                <h5>结论</h5>
                <ul class="rule-list"><li v-for="note in netfs.notes" :key="note">{{ note }}</li></ul>
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>

      <!-- ⑤ 容器 L2 -->
      <el-tab-pane label="⑤ 容器 L2" name="container">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">内存 MB</span>
              <el-input-number v-model="containerForm.mem_mb" size="small" :min="64" :max="2048" :step="64" controls-position="right" style="width: 120px" />
            </div>
            <div class="field"><span class="label">CPU</span>
              <el-input-number v-model="containerForm.cpus" size="small" :min="0.1" :max="4" :step="0.1" :precision="1" controls-position="right" style="width: 100px" />
            </div>
            <div class="field"><span class="label">pids-limit</span>
              <el-input-number v-model="containerForm.pids_limit" size="small" :min="8" :max="512" controls-position="right" style="width: 120px" />
            </div>
            <div class="field"><span class="label">挂假的 .env</span><el-switch v-model="containerForm.mount_env" size="small" /></div>
            <div class="field"><span class="label">真跑探针</span><el-switch v-model="containerForm.live" size="small" /></div>
            <el-button type="primary" size="small" :loading="containerLoading" @click="doContainer">生成命令并探墙</el-button>
          </div>
          <template v-if="container">
            <div class="chips mt">
              <el-tag size="small" :type="container.docker_available ? 'success' : 'info'">docker：{{ container.docker_available ? '可用' : '不可用（只回放）' }}</el-tag>
              <el-tag size="small" effect="plain">memory 与 swap 必须同值</el-tag>
            </div>
            <h5 class="mt">完整命令（逐参数对应一条威胁）</h5>
            <pre class="code-box">{{ container.command }}</pre>
            <el-table class="mt" :data="container.args" size="small">
              <el-table-column prop="arg" label="参数" min-width="310" />
              <el-table-column prop="blocks" label="挡" width="80" />
              <el-table-column prop="without" label="不加会怎样" min-width="420" />
            </el-table>
            <h5 class="mt">六条探针</h5>
            <el-table :data="container.probes" size="small">
              <el-table-column prop="name" label="探针" width="150" />
              <el-table-column label="结果" width="80">
                <template #default="{ row }"><el-tag size="small" :type="row.ok ? 'warning' : 'success'">{{ row.ok ? '执行了' : '被拦' }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="exit_code" label="exit" width="70" />
              <el-table-column prop="hit" label="命中" width="80" />
              <el-table-column prop="last_line" label="最后一行" min-width="360" />
            </el-table>
            <el-alert v-if="container.live_result" class="mt" :type="container.live_result.status === 'ok' ? 'success' : 'info'" :closable="false" :title="`真跑结果：${container.live_result.status}${container.live_result.reason ? ' · ' + container.live_result.reason : ''}`" />
            <ul class="rule-list"><li v-for="note in container.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ⑥ 代码循环 -->
      <el-tab-pane label="⑥ 代码循环" name="loop">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">剧本</span>
              <el-select v-model="loopForm.scenario" size="small" style="width: 210px">
                <el-option label="pandas 2.0 删了 append" value="pandas_append" />
                <el-option label="列名写错 KeyError" value="key_error" />
                <el-option label="iterrows 超时" value="timeout" />
                <el-option label="同类错误重复" value="same_error" />
              </el-select>
            </div>
            <div class="field"><span class="label">最多尝试</span>
              <el-input-number v-model="loopForm.max_tries" size="small" :min="1" :max="5" controls-position="right" style="width: 110px" />
            </div>
            <div class="field"><span class="label">同类错误换策略</span><el-switch v-model="loopForm.escalate" size="small" /></div>
            <el-button type="primary" size="small" :loading="loopLoading" @click="doLoop">写代码→跑→改</el-button>
          </div>
          <template v-if="loop">
            <div class="chips mt">
              <el-tag size="small" :type="loop.answer ? 'success' : 'danger'">{{ loop.answer ? '收敛成功' : '三次仍未通过' }}</el-tag>
              <el-tag size="small" effect="plain">用了 {{ loop.tries }} 次</el-tag>
              <el-tag v-for="(item, index) in loop.strategy_switches" :key="index" size="small" type="warning">第 2 次同类错误已换策略</el-tag>
            </div>
            <el-alert v-if="loop.answer" class="mt" type="success" :closable="false" :title="`最终产出：${loop.answer}`" />
            <el-table class="mt" :data="loop.attempts" size="small">
              <el-table-column type="expand">
                <template #default="{ row }">
                  <pre class="code-box">{{ row.code }}</pre>
                  <p class="hint mono">stdout: {{ row.stdout || '(空)' }}</p>
                  <p class="hint mono">stderr: {{ row.stderr || '(空)' }}</p>
                </template>
              </el-table-column>
              <el-table-column prop="attempt" label="尝试" width="60" />
              <el-table-column label="结果" width="80">
                <template #default="{ row }"><el-tag size="small" :type="checkType(row.ok)">{{ row.ok ? '过' : '失败' }}</el-tag></template>
              </el-table-column>
              <el-table-column label="异常类型" width="150">
                <template #default="{ row }"><span class="mono">{{ row.digest.type }}</span></template>
              </el-table-column>
              <el-table-column label="行号" width="70">
                <template #default="{ row }">{{ row.digest.line || '-' }}</template>
              </el-table-column>
              <el-table-column label="出错行" min-width="280">
                <template #default="{ row }"><span class="mono">{{ row.digest.code_line || '-' }}</span></template>
              </el-table-column>
              <el-table-column prop="duration_ms" label="耗时" width="80" />
            </el-table>
            <div class="two-col mt">
              <div>
                <h5>回填给模型的提示（错误五要素 + 失败前 stdout）</h5>
                <pre v-for="(item, index) in loop.feedback" :key="index" class="code-box mt">{{ item }}</pre>
              </div>
              <div>
                <h5>换策略记录</h5>
                <ul v-if="loop.strategy_switches.length" class="rule-list">
                  <li v-for="(item, index) in loop.strategy_switches" :key="index">{{ item }}</li>
                </ul>
                <p v-else class="hint">同类错误只出现一次，无需升级；打开开关跑 same_error / timeout 可见升级现场。</p>
              </div>
            </div>
            <ul class="rule-list"><li v-for="note in loop.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ⑦ 接回 Day 21 -->
      <el-tab-pane label="⑦ 接回 Day 21" name="bridge">
        <div class="card-block">
          <div class="form-grid">
            <div class="field"><span class="label">库存</span>
              <el-input-number v-model="bridgeForm.available" size="small" :min="0" :max="100000" controls-position="right" style="width: 120px" />
            </div>
            <div class="field"><span class="label">天数</span>
              <el-input-number v-model="bridgeForm.days" size="small" :min="0.1" :max="60" :step="0.5" :precision="1" controls-position="right" style="width: 110px" />
            </div>
            <div class="field"><span class="label">日产能</span>
              <el-input-number v-model="bridgeForm.per_day" size="small" :min="0" :max="10000" controls-position="right" style="width: 120px" />
            </div>
            <div class="field"><span class="label">判据阈值</span>
              <el-input-number v-model="bridgeForm.expect_value" size="small" :min="0" :max="1000000" controls-position="right" style="width: 130px" />
            </div>
            <div class="field"><span class="label">模式</span>
              <el-select v-model="bridgeForm.mode" size="small" style="width: 120px">
                <el-option label="回放" value="simulate" />
                <el-option label="真执行" value="live" />
              </el-select>
            </div>
            <el-button type="primary" size="small" :loading="bridgeLoading" @click="doBridge">跑 s3 真执行器</el-button>
          </div>
          <template v-if="bridge">
            <el-alert class="mt" :type="checkType(bridge.passed)" :closable="false" :title="bridge.reason" />
            <div class="chips mt">
              <el-tag size="small" effect="plain">stdout 原类型：{{ bridge.raw_type }}</el-tag>
              <el-tag size="small" effect="plain">解析后：{{ bridge.parsed_type }} = {{ bridge.parsed_value }}</el-tag>
              <el-tag size="small" effect="plain">expect：{{ pretty(bridge.expect) }}</el-tag>
            </div>
            <h5 class="mt">生成的三行计算代码</h5>
            <pre class="code-box">{{ bridge.code }}</pre>
            <ul class="rule-list"><li v-for="note in bridge.notes" :key="note">{{ note }}</li></ul>
          </template>
        </div>
      </el-tab-pane>

      <!-- ⑧ 生产形态与压测 -->
      <el-tab-pane label="⑧ 生产与压测" name="production">
        <div class="card-block">
          <div class="block-head"><h4>生产形态：一条完整请求路径（§12）</h4></div>
          <div class="form-grid">
            <div class="field"><span class="label">任务类型</span>
              <el-select v-model="productionForm.task_type" size="small" style="width: 170px">
                <el-option label="quick_calc" value="quick_calc" />
                <el-option label="data_analysis" value="data_analysis" />
                <el-option label="plot" value="plot" />
                <el-option label="reject" value="reject" />
              </el-select>
            </div>
            <div class="field"><span class="label">代码样例</span>
              <el-select v-model="productionForm.code_preset" size="small" style="width: 190px">
                <el-option label="正常计算" value="normal" />
                <el-option label="pip install（拒）" value="pip_install" />
                <el-option label="model.fit（拒）" value="train" />
                <el-option label="random/now（不缓存）" value="random_now" />
              </el-select>
            </div>
            <div class="field"><span class="label">池大小</span>
              <el-input-number v-model="productionForm.pool_size" size="small" :min="1" :max="16" controls-position="right" style="width: 100px" />
            </div>
            <div class="field"><span class="label">开缓存</span><el-switch v-model="productionForm.cache_enabled" size="small" /></div>
            <el-button type="primary" size="small" :loading="productionLoading" @click="doProduction">跑请求路径</el-button>
          </div>
          <template v-if="production">
            <div class="chips mt">
              <el-tag size="small" :type="production.profile.name === 'reject' ? 'danger' : 'success'">{{ production.profile.name }}：{{ production.profile.reason }}</el-tag>
              <el-tag size="small" effect="plain">缓存 {{ production.cache_status }}</el-tag>
              <el-tag size="small" effect="plain">池 {{ production.pool.size }} · {{ production.pool.strategy }}</el-tag>
            </div>
            <el-table class="mt" :data="production.trace" size="small">
              <el-table-column prop="gate" label="闸" width="130" />
              <el-table-column prop="decision" label="决策" min-width="200" />
              <el-table-column prop="reason" label="理由" min-width="420" />
            </el-table>
            <p class="hint mono mt">cache_key = {{ production.cache_key }}</p>
            <p class="hint mono">audit = {{ production.audit_fields.join(' · ') }}</p>
          </template>
        </div>

        <div class="card-block">
          <div class="block-head"><h4>压测矩阵：十条攻击 × L1/L2（练习 2/3）</h4></div>
          <div class="form-grid">
            <div class="field"><span class="label">样本数</span>
              <el-input-number v-model="pressureForm.cases" size="small" :min="1" :max="10" controls-position="right" style="width: 110px" />
            </div>
            <div class="field"><span class="label">同类错误换策略</span><el-switch v-model="pressureForm.escalate" size="small" /></div>
            <el-button type="primary" size="small" :loading="pressureLoading" @click="doPressure">出拦截矩阵</el-button>
          </div>
          <template v-if="pressure">
            <div class="chips mt">
              <el-tag size="small" type="danger">L1 全拦 {{ pressure.l1_blocked }}/{{ pressure.matrix.length }}</el-tag>
              <el-tag size="small" type="success">L2 全拦 {{ pressure.l2_blocked }}/{{ pressure.matrix.length }}</el-tag>
              <el-tag size="small" effect="plain">首过率 {{ pct(pressure.escalation.first_pass_before) }} → {{ pct(pressure.escalation.first_pass_after) }}</el-tag>
            </div>
            <el-table class="mt" :data="pressure.matrix" size="small">
              <el-table-column prop="no" label="#" width="45" />
              <el-table-column prop="attack" label="攻击" width="200" />
              <el-table-column prop="threat" label="威胁" width="80" />
              <el-table-column label="L1" width="100">
                <template #default="{ row }"><el-tag size="small" :type="verdictType(row.l1)">{{ row.l1 }}</el-tag></template>
              </el-table-column>
              <el-table-column label="L2" width="90">
                <template #default="{ row }"><el-tag size="small" type="success">{{ row.l2 }}</el-tag></template>
              </el-table-column>
              <el-table-column prop="note" label="为什么" min-width="400" />
            </el-table>
            <div class="two-col mt">
              <div>
                <h5>同类错误升级规则</h5>
                <el-table :data="pressure.escalation.rules" size="small">
                  <el-table-column prop="error" label="错误" width="150" />
                  <el-table-column prop="strategy" label="换什么策略" min-width="250" />
                  <el-table-column prop="why" label="理由" min-width="240" />
                </el-table>
              </div>
              <div><h5>结论</h5><ul class="rule-list"><li v-for="note in pressure.notes" :key="note">{{ note }}</li></ul></div>
            </div>
          </template>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
// Day 22 实验台：代码执行沙箱——七段课程代码 + 三道练习工程化为可复现实验（live 模式真起子进程）
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getDay22Mapping,
  runDay22Ast,
  runDay22Bridge,
  runDay22Container,
  runDay22L1,
  runDay22Loop,
  runDay22Netfs,
  runDay22Pressure,
  runDay22Production,
  runDay22Why
} from '@/api/study'

const mapping = ref(null)
const subTab = ref('why')
const pitfalls = computed(() => mapping.value?.pitfalls || [])
const versionText = computed(() =>
  Object.entries(mapping.value?.environment || {})
    .map(([key, value]) => `${key} ${value}`)
    .join(' / ')
)

// 通用展示函数：JSON 预览、判定配色、拦截矩阵配色、百分比
const pretty = (value) => JSON.stringify(value, null, 2)
const checkType = (ok) => (ok ? 'success' : 'danger')
const verdictType = (value) => ({ 拦住: 'success', 部分: 'warning', 没拦住: 'danger', 杀错进程: 'danger' })[value] || 'info'
const pct = (value) => `${(Number(value) * 100).toFixed(0)}%`

// ---------- ① 失败复现 ----------
const whyForm = ref({
  question: '订单总额 1,234,567.89 元，税率 7.35%，请算出税额（保留两位小数）。'
})
const why = ref(null)
const whyLoading = ref(false)

// 复现心算错误与 exec 逃逸链（只跑安全探针）
const doWhy = async () => {
  whyLoading.value = true
  try {
    why.value = await runDay22Why({ ...whyForm.value })
    ElMessage.success(`精确值 ${why.value.exact_value.toFixed(2)} 元`)
  } finally {
    whyLoading.value = false
  }
}

// ---------- ② AST 筛查 ----------
const astForm = ref({ case: 'all' })
const ast = ref(null)
const astLoading = ref(false)

// 筛查五个样本与四种绕过
const doAst = async () => {
  astLoading.value = true
  try {
    ast.value = await runDay22Ast({ ...astForm.value })
    ElMessage.success(`绕过漏了 ${ast.value.bypass_leaked} 条`)
  } finally {
    astLoading.value = false
  }
}

// ---------- ③ L1 沙箱 ----------
const l1Form = ref({ case: 'all', mode: 'simulate', wall_timeout: 3, mem_mb: 256, cpu_s: 2, custom_code: '' })
const l1 = ref(null)
const l1Loading = ref(false)

// 回放或真起子进程：观察退出码、hit_limit 与「挡不住」的能力边界
const doL1 = async () => {
  l1Loading.value = true
  try {
    const payload = { ...l1Form.value, custom_code: l1Form.value.custom_code.trim() || null }
    l1.value = await runDay22L1(payload)
    ElMessage.success(`跑了 ${l1.value.cases.length} 个样例`)
  } finally {
    l1Loading.value = false
  }
}

// ---------- ④ 网络与文件 ----------
const netfsForm = ref({ probe: 'all', mode: 'simulate' })
const netfs = ref(null)
const netfsLoading = ref(false)

// 探软断网与宿主文件读写：看哪条墙根本不存在
const doNetfs = async () => {
  netfsLoading.value = true
  try {
    netfs.value = await runDay22Netfs({ ...netfsForm.value })
    ElMessage.success(`${netfs.value.broken} 条墙破了或不存在`)
  } finally {
    netfsLoading.value = false
  }
}

// ---------- ⑤ 容器 L2 ----------
const containerForm = ref({ mem_mb: 512, cpus: 0.5, pids_limit: 64, mount_env: false, live: false })
const container = ref(null)
const containerLoading = ref(false)

// 生成完整 docker 命令并回放六条隔离探针
const doContainer = async () => {
  containerLoading.value = true
  try {
    container.value = await runDay22Container({ ...containerForm.value })
    ElMessage.success(container.value.docker_available ? 'docker 可用' : 'docker 不可用，已回放课程实测')
  } finally {
    containerLoading.value = false
  }
}

// ---------- ⑥ 代码循环 ----------
const loopForm = ref({ scenario: 'pandas_append', max_tries: 3, escalate: false })
const loop = ref(null)
const loopLoading = ref(false)

// 写代码→执行→看报错→改代码，观察错误五要素回填与换策略
const doLoop = async () => {
  loopLoading.value = true
  try {
    loop.value = await runDay22Loop({ ...loopForm.value })
    ElMessage.success(loop.value.answer ? `${loop.value.tries} 次收敛` : `${loop.value.tries} 次仍未通过`)
  } finally {
    loopLoading.value = false
  }
}

// ---------- ⑦ 接回 Day 21 ----------
const bridgeForm = ref({ available: 120, days: 5, per_day: 80, expect_value: 500, expect_op: '>=', mode: 'simulate' })
const bridge = ref(null)
const bridgeLoading = ref(false)

// s3 换真执行器：stdout 字符串先解析成数字，再过机器判据
const doBridge = async () => {
  bridgeLoading.value = true
  try {
    bridge.value = await runDay22Bridge({ ...bridgeForm.value })
    ElMessage.success(bridge.value.passed ? '机器判据通过' : `机器判据未过：${bridge.value.reason}`)
  } finally {
    bridgeLoading.value = false
  }
}

// ---------- ⑧ 生产形态与压测 ----------
const productionForm = ref({ task_type: 'quick_calc', code_preset: 'normal', pool_size: 4, cache_enabled: true })
const production = ref(null)
const productionLoading = ref(false)

// 跑画像→AST→缓存→池→输出回收→审计的完整路径
const doProduction = async () => {
  productionLoading.value = true
  try {
    production.value = await runDay22Production({ ...productionForm.value })
    ElMessage.success(`命中画像 ${production.value.profile.name}`)
  } finally {
    productionLoading.value = false
  }
}

const pressureForm = ref({ cases: 10, escalate: false })
const pressure = ref(null)
const pressureLoading = ref(false)

// 出十条攻击的 L1/L2 拦截矩阵与同类错误升级收益
const doPressure = async () => {
  pressureLoading.value = true
  try {
    pressure.value = await runDay22Pressure({ ...pressureForm.value, mode: 'all' })
    ElMessage.success(`L1 全拦 ${pressure.value.l1_blocked}/${pressure.value.matrix.length}`)
  } finally {
    pressureLoading.value = false
  }
}

// 概念表加载失败不阻塞实验区
onMounted(async () => {
  try {
    mapping.value = await getDay22Mapping()
  } catch {
    // 接口失败时表格显示「加载中…」，实验区仍可点按钮
  }
})
</script>

<style lang="scss" scoped>
.day22 {
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

    &.field-wide {
      flex: 1 1 320px;
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
