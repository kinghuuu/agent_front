/**
 * 智能体开发学习模块接口，对应后端 /api/v1/study。
 *
 * 学习页是"试验台"：跑 Agent 循环可能连续调多次模型，耗时比普通接口长，
 * 所以运行类请求单独放宽了 axios 超时（120s）。
 */
import request from './request'

// 模型下拉框复用会话模块的"可用模型"接口（默认模型在前）
export { listChatModels } from './chat'

/** Day 01 工具清单（工具名 / 说明书 / JSON Schema） */
export const listStudyTools = () => request.get('/v1/study/tools')

/** Day 03 工具调用日志（时间/工具/参数/耗时/是否报错，内存保留最近 200 条） */
export const getStudyToolCalls = () => request.get('/v1/study/tools/calls')

/**
 * 运行 Function Calling Agent 循环
 * data: { question, max_steps?, model_config_id?, user_confirmed? }，返回完整执行轨迹
 * user_confirmed 为 Day 04 确认门：勾选后放行退款等资金操作
 */
export const runStudyAgent = (data) =>
  request.post('/v1/study/agent/run', data, { timeout: 120000 })

/** Day 04 练习 2：工具说明书预算（总字符数 / 预算上限 / 最长的 3 个 description） */
export const getStudyToolBudget = () => request.get('/v1/study/tools/budget')

/** Day 06 多轮会话：同一 session_id 继续追问，返回本轮回答与记忆状态；signal 供"停止生成"主动取消 */
export const chatStudySession = (data, signal) =>
  request.post('/v1/study/session/chat', data, { timeout: 120000, signal })

/** Day 06 会话状态快照（约束 / 事实 / 摘要 / 水位 / 淘汰记录） */
export const getStudySession = (sessionId) => request.get(`/v1/study/session/${sessionId}`)

/** Day 06 重置会话记忆（保留同一个 session_id） */
export const resetStudySession = (sessionId) => request.delete(`/v1/study/session/${sessionId}`)

/** 运行手写 ReAct 文本协议循环，data 同上 */
export const runStudyReact = (data) =>
  request.post('/v1/study/react/run', data, { timeout: 120000 })

/**
 * Day 02 结构化输出实验：客户意图提取（三级方案）
 * data: { text, mode: 'naive'|'json_mode'|'json_schema', max_retries?, model_config_id? }
 * 返回尝试轨迹（原文/报错/降级说明）与最终工单
 */
export const runStudyExtract = (data) =>
  request.post('/v1/study/extract/run', data, { timeout: 120000 })

// ---------- Day 07 长期记忆 + RAG ----------

/** Day 07 用户长期画像（事实 / 注入文本 / 同义键冲突提示） */
export const getStudyMemory = (userId) => request.get(`/v1/study/memory/${userId}`)

/** Day 07 写入或覆盖一条长期记忆（同 key 覆盖） */
export const writeStudyMemory = (userId, data) =>
  request.post(`/v1/study/memory/${userId}`, data)

/** Day 07 遗忘一条长期记忆 */
export const forgetStudyMemory = (userId, key) =>
  request.delete(`/v1/study/memory/${userId}/${key}`)

/** Day 07 清空某用户长期记忆 */
export const clearStudyMemory = (userId) => request.delete(`/v1/study/memory/${userId}`)

/** Day 07 录入 / 重建知识文档（切块 + 向量化，耗时可能较长） */
export const upsertStudyDoc = (data) =>
  request.post('/v1/study/knowledge/docs', data, { timeout: 120000 })

/** Day 07 知识文档列表 */
export const listStudyDocs = () => request.get('/v1/study/knowledge/docs')

/** Day 07 删除整篇文档 */
export const deleteStudyDoc = (docId) => request.delete(`/v1/study/knowledge/docs/${docId}`)

/** Day 07 混合检索（向量 + BM25 + RRF），只检索不生成 */
export const searchStudyKnowledge = (data) =>
  request.post('/v1/study/knowledge/search', data)

/** Day 07 问答：长期画像 + RAG + 工具三条管道 */
export const chatStudyDay07 = (data) =>
  request.post('/v1/study/day07/chat', data, { timeout: 120000 })

// ---------- Day 08 上下文工程 ----------

/**
 * Day 08 上下文编排：只拼装、不调模型
 * data: { user_query, user_id?, rag_query?, rag_blocks?, short_memory?, tool_data?,
 *         history?, hard_constraints?, system_prompt?, with_tools?, total_budget?, debug? }
 * 返回最终上下文 + 四层预算账单 + 检索块裁剪轨迹 + 七问自检 + dump
 */
export const buildStudyContext = (data) =>
  request.post('/v1/study/day08/context', data, { timeout: 60000 })

// ---------- Day 09 LangChain 初探 ----------

/** Day 09 概念数据：手写零件 ↔ 框架零件对照表、消息模式对比、预设问题、langchain-core 版本 */
export const getDay09Mapping = () => request.get('/v1/study/day09/mapping')

/** Day 09 消息抽象：四类消息对象 + 转回 OpenAI dict（不调模型） */
export const runDay09Messages = () => request.post('/v1/study/day09/messages')

/** Day 09 Prompt 模板：变量 / partial / 漏填变量 fail-fast（不调模型） */
export const runDay09Prompt = (data) => request.post('/v1/study/day09/prompt', data)

/** Day 09 结构化输出：with_structured_output 抽三字段回执（可重复跑观察抖动） */
export const runDay09Structured = (data) =>
  request.post('/v1/study/day09/structured', data, { timeout: 120000 })

/** Day 09 LCEL 管道：invoke / stream / batch / retry / lambda 五种用法 */
export const runDay09Lcel = (data) =>
  request.post('/v1/study/day09/lcel', data, { timeout: 180000 })

/** Day 09 框架版 Agent 循环：@tool + bind_tools + ToolMessage 回填 + MAX_STEPS */
export const runDay09Agent = (data) =>
  request.post('/v1/study/day09/agent', data, { timeout: 120000 })

// ---------- Day 10 LangGraph 状态图 ----------

/** Day 10 概念数据：三件套 / reducer / while 对照 / stream_mode / 六个坑 / 预设问题 / langgraph 版本 */
export const getDay10Mapping = () => request.get('/v1/study/day10/mapping')

/** Day 10 状态与 reducer：四个对照实验（覆盖 / 追加 / 同 id 更新 / 重复追加），不调模型 */
export const runDay10State = () => request.post('/v1/study/day10/state', {})

/** Day 10 最小线性图：retrieve → generate，返回逐节点 updates / values 事件 */
export const runDay10MinGraph = (data) =>
  request.post('/v1/study/day10/min-graph', data, { timeout: 120000 })

/** Day 10 条件边：classify + route + 四条分支（含低置信度转人工） */
export const runDay10Conditional = (data) =>
  request.post('/v1/study/day10/conditional', data, { timeout: 180000 })

/** Day 10 完整 ReAct 环：agent ⇄ tools + 双刹车 + 降级交付（可切子图 / 工具失败） */
export const runDay10React = (data) =>
  request.post('/v1/study/day10/react', data, { timeout: 180000 })

/** Day 10 并行扇出：静态 + Send 动态 + 子图（本地假检索，不花 token） */
export const runDay10Parallel = (data) =>
  request.post('/v1/study/day10/parallel', data, { timeout: 60000 })

// ---------- Day 11 Checkpointer 与人机协同 ----------

/** Day 11 概念数据：快照四要素 / 两套暂停机制 / 三档存档器 / 六个坑 / 预设问题 / 版本 */
export const getDay11Mapping = () => request.get('/v1/study/day11/mapping')

/** Day 11 存档三实验：同 thread 续跑 / 跨 thread 隔离 / get_state 快照 */
export const runDay11Basic = (data) =>
  request.post('/v1/study/day11/basic', data, { timeout: 180000 })

/** Day 11 交互式续跑：同 thread_id 跨请求读档（MemorySaver，进程重启即丢） */
export const chatDay11 = (data) =>
  request.post('/v1/study/day11/chat', data, { timeout: 120000 })

/** Day 11 发起审批：命中敏感工具后 interrupt() 冻结并存档 */
export const startDay11Approval = (data) =>
  request.post('/v1/study/day11/approval/start', data, { timeout: 180000 })

/** Day 11 恢复审批：decision = true / false / 改过的参数对象 */
export const resumeDay11Approval = (data) =>
  request.post('/v1/study/day11/approval/resume', data, { timeout: 180000 })

/** Day 11 待审批队列（练习 3）：含已等待秒数 */
export const listDay11Pending = () => request.get('/v1/study/day11/approval/pending')

/** Day 11 审批超时自动驳回（练习 3）：max_age_seconds=0 表示课堂演示"全部视为超时" */
export const expireDay11Approvals = (data) =>
  request.post('/v1/study/day11/approval/expire', data, { timeout: 180000 })

/** Day 11 坑 1：interrupt 前有副作用会被重放两次（纯本地，不花 token） */
export const runDay11Replay = () => request.post('/v1/study/day11/replay', {})

/** Day 11 时间旅行：翻历史 → 改参数 → invoke(None) 重跑 */
export const runDay11TimeTravel = (data) =>
  request.post('/v1/study/day11/time-travel', data, { timeout: 180000 })

/** Day 11 SQLite 落盘：mode = first 写入 / resume 换连接续跑 */
export const runDay11Sqlite = (data) =>
  request.post('/v1/study/day11/sqlite', data, { timeout: 180000 })

// ---------- Day 12 多智能体 Supervisor ----------

/** Day 12 概念数据：三堵墙 / 三角色 / 交接方式 / 状态三层 / 三层终止 / 五个坑 / 选型与成本 */
export const getDay12Mapping = () => request.get('/v1/study/day12/mapping')

/** Day 12 课程 01：单 Agent 复现（toolset = wide 全工具 / narrow 只读工具） */
export const runDay12Single = (data) =>
  request.post('/v1/study/day12/single', data, { timeout: 180000 })

/** Day 12 课程 02：最小 Supervisor（dedupe_guard = 练习 1 去重守卫） */
export const runDay12Team = (data) =>
  request.post('/v1/study/day12/team', data, { timeout: 240000 })

/** Day 12 课程 03：完整版跑到退款审批处冻结（审批 + 预算 + 存档） */
export const startDay12Full = (data) =>
  request.post('/v1/study/day12/full/start', data, { timeout: 240000 })

/** Day 12 恢复审批：decision = true / false / { approved, amount } */
export const resumeDay12Full = (data) =>
  request.post('/v1/study/day12/full/resume', data, { timeout: 240000 })

/** Day 12 课程 04 / 练习 3：Send 扇出两条调研分支 → join → writer 只调一次 */
export const runDay12Parallel = (data) =>
  request.post('/v1/study/day12/parallel', data, { timeout: 240000 })

// ---------- Day 13 流式输出 ----------

/** Day 13 概念数据：四模式 / API 选型 / interrupt 规则 / SSE 三件套 / 事件协议 / 五个坑 */
export const getDay13Mapping = () => request.get('/v1/study/day13/mapping')

/** Day 13 课程 01：values / updates / messages 四模式对照（跑 3 趟图，约 6 次 LLM 调用） */
export const runDay13Modes = (data) =>
  request.post('/v1/study/day13/modes', data, { timeout: 300000 })

/** Day 13 课程 02：多 Agent token 按 langgraph_node 分流 + 过滤主管 JSON */
export const runDay13TokenStream = (data) =>
  request.post('/v1/study/day13/token-stream', data, { timeout: 300000 })

/** Day 13 课程 03：custom 模式——工具内进度上报（检索 + token 交错） */
export const runDay13CustomStream = (data) =>
  request.post('/v1/study/day13/custom-stream', data, { timeout: 300000 })

/** Day 13 课程 04：interrupt + 流式同开（不调模型，纯确定性对照实验） */
export const runDay13InterruptStream = (data) =>
  request.post('/v1/study/day13/interrupt-stream', data, { timeout: 60000 })

/**
 * Day 13 课程 05：用浏览器原生 EventSource 消费真 SSE 流。
 *
 * 为什么不用 axios：axios 拿到的是完整响应体，无法逐帧回调；EventSource 是 SSE 的标准客户端，
 * 每收到一个 `data: {...}\n\n` 就触发一次 onmessage。返回实例，页面结束时必须 close()。
 *
 * @param {{question: string, model_config_id?: number}} params 查询参数（UTF-8 由 URLSearchParams 编码）
 * @param {{onNodeStart?: Function, onToken?: Function, onDone?: Function, onError?: Function}} handlers
 * @returns {EventSource}
 */
export function openDay13Sse(params, handlers = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const query = new URLSearchParams({ q: params.question })
  if (params.model_config_id) query.set('model_config_id', String(params.model_config_id))

  const es = new EventSource(`${base}/v1/study/day13/sse/chat?${query.toString()}`)
  es.onmessage = (event) => {
    let data
    try {
      data = JSON.parse(event.data)
    } catch {
      return
    }
    if (data.type === 'token') handlers.onToken?.(data)
    else if (data.type === 'node_start') handlers.onNodeStart?.(data)
    else if (data.type === 'done') handlers.onDone?.(data)
    else if (data.type === 'error') handlers.onError?.(data)
  }
  es.onerror = () => handlers.onError?.({ message: 'SSE 连接中断（后端未启动 / 模型报错 / 网络断开）' })
  return es
}

// ---------- Day 14 MCP 协议 ----------

/** Day 14 概念数据：M×N / FC vs MCP / 三角色 / 两传输 / 三原语 / 迁移对照 / 五个坑 */
export const getDay14Mapping = () => request.get('/v1/study/day14/mapping')

/** Day 14 课程 01/02：spawn 两个 stdio Server，一次拿到协议视角 + LangChain 视角（共 4 个子进程） */
export const runDay14Discover = (data) =>
  request.post('/v1/study/day14/discover', data || {}, { timeout: 120000 })

/** Day 14：直接发 tools/call（不经模型），验证 Server 端校验与「错误即结果」 */
export const callDay14Tool = (data) => request.post('/v1/study/day14/call', data, { timeout: 120000 })

/** Day 14 课程 03：一个 Agent 横跨两个 MCP Server */
export const runDay14Agent = (data) => request.post('/v1/study/day14/agent', data, { timeout: 300000 })

/** Day 14 课程 05：MCP 工具 + 本地工具混装（余额不足 → 转人工） */
export const runDay14Mixed = (data) => request.post('/v1/study/day14/mixed', data, { timeout: 300000 })

/** Day 14 课程 04：streamable-http 共享服务（临时 uvicorn，随机端口，用完即关） */
export const runDay14Http = (data) => request.post('/v1/study/day14/http', data, { timeout: 120000 })

/** Day 14 坑 1 现场：stdout 污染协议通道的三种形态（fd 形态会等到超时） */
export const runDay14Noisy = (data) => request.post('/v1/study/day14/noisy', data, { timeout: 180000 })

// ---------- Day 15 可观测性 ----------

/** Day 15 概念数据：失败形态 / 三大件 / 两条路线 / 八字段 / 五个坑 / 平台就绪状态 */
export const getDay15Mapping = () => request.get('/v1/study/day15/mapping')

/** Day 15 课程 02：自建 CallbackHandler 跑一次 Agent，返回树 + 时间轴 + 原始事件 */
export const runDay15Callback = (data) =>
  request.post('/v1/study/day15/callback', data, { timeout: 180000 })

/** Day 15 课程 01/03：平台接入（没配 key 时只返回配置说明，不跑模型） */
export const runDay15Platform = (data) =>
  request.post('/v1/study/day15/platform', data, { timeout: 180000 })

/** Day 15 课程 04：自建 span + JSONL，返回本次 trace 的树与指标 + 并发隔离证据 */
export const runDay15OwnTrace = (data) =>
  request.post('/v1/study/day15/own-trace', data, { timeout: 180000 })

/** Day 15 课程 05：LangGraph + MCP 全链路（trace_id 跨进程传播） */
export const runDay15FullStack = (data) =>
  request.post('/v1/study/day15/full-stack', data, { timeout: 300000 })

/** Day 15：回放最近 N 条自建 trace + 全局指标 + 用户反馈聚合 */
export const listDay15Traces = (limit = 5) =>
  request.get('/v1/study/day15/traces', { params: { limit } })

/** Day 15：把点赞/点踩落到 trace 上（自建版 score） */
export const submitDay15Feedback = (data) => request.post('/v1/study/day15/feedback', data)

// ---------- Day 16 评估体系 ----------

/** Day 16 概念数据：三个困难 / 三层评估 / 指标体系 / 数据来源 / rubric / 门禁阈值 + 数据集画像 */
export const getDay16Mapping = () => request.get('/v1/study/day16/mapping')

/** Day 16 课程 01：构建评估集（Day 15 点踩 trace + 人工边界 + 合成变体） */
export const buildDay16Dataset = (data) => request.post('/v1/study/day16/dataset/build', data)

/** Day 16：读回当前数据集与类别 / 难度 / 来源分布 */
export const getDay16Dataset = () => request.get('/v1/study/day16/dataset')

/** Day 16 课程 02：跑评估（每 case 多次采样取多数 + 结果与过程指标） */
export const runDay16Eval = (data) =>
  request.post('/v1/study/day16/run', data, { timeout: 600000 })

/** Day 16 课程 03：LLM-as-judge（结构化 rubric + pairwise 换序去偏） */
export const runDay16Judge = (data) =>
  request.post('/v1/study/day16/judge', data, { timeout: 180000 })

/** Day 16 课程 04：baseline vs candidate 双跑回归 + 门禁 */
export const runDay16Regression = (data) =>
  request.post('/v1/study/day16/regression', data, { timeout: 600000 })

/** Day 16 课程 05：CI 冒烟门禁（分层抽样 + 归档基线 + exit_code） */
export const runDay16CiGate = (data) =>
  request.post('/v1/study/day16/ci-gate', data, { timeout: 600000 })


// ---------- Day 17 成本与延迟优化 ----------

/** Day 17 概念数据：成本结构 / 延迟四段 / 四杠杆 / 缓存三层 / 坑 / 速查表 / 价格与阈值 */
export const getDay17Mapping = () => request.get('/v1/study/day17/mapping')

/** Day 17 课程 01：成本账本（逐步 token / 放大率 / 重复发送占比；live 时真调一次校准） */
export const runDay17Ledger = (data) =>
  request.post('/v1/study/day17/ledger', data, { timeout: 180000 })

/** Day 17 课程 02：模型分级路由（规则 / 小模型分类 / 三信号升级链） */
export const runDay17Router = (data) =>
  request.post('/v1/study/day17/router', data, { timeout: 180000 })

/** Day 17 课程 03：上下文压缩（静态瘦身 + 工具结果剪裁 + 预算触发摘要） */
export const runDay17Compress = (data) =>
  request.post('/v1/study/day17/compress', data, { timeout: 180000 })

/** Day 17 课程 04：缓存三层（只读白名单 / 实体校验 / 用户隔离 / 前缀哈希） */
export const runDay17Cache = (data) => request.post('/v1/study/day17/cache', data)

/** Day 17 课程 05：并行工具（串行 vs 并行耗时 + 三道保险 + 时间轴） */
export const runDay17Parallel = (data) =>
  request.post('/v1/study/day17/parallel', data, { timeout: 60000 })

/** Day 17 课程 06：带三闸预算熔断的 Agent（simulate 确定 / live 真模型） */
export const runDay17BudgetAgent = (data) =>
  request.post('/v1/study/day17/budget-agent', data, { timeout: 180000 })

/** Day 17 课程 06：四个杠杆逐档现算成本与延迟（正确率交给 Day 16 门禁） */
export const runDay17Ab = (data) => request.post('/v1/study/day17/ab', data)

/** Day 18 概念数据：五类威胁 / 三条原则 + fail-closed / 攻击面 / 坑 / 速查表 / 沙箱矩阵 */
export const getDay18Mapping = () => request.get('/v1/study/day18/mapping')

/** Day 18 课程 01：间接注入复现（无害输入 + 有毒工具结果，三个变体对照） */
export const runDay18Injection = (data) =>
  request.post('/v1/study/day18/injection', data, { timeout: 60000 })

/** Day 18 课程 02：围栏 + 双向扫描（入站命中 / 出站越界 / 变形样本矩阵） */
export const runDay18Fence = (data) => request.post('/v1/study/day18/fence', data)

/** Day 18 课程 03：最小权限与 IDOR（身份网关注入 / 越权 NotFound / 好坏签名对照） */
export const runDay18Authz = (data) => request.post('/v1/study/day18/authz', data)

/** Day 18 课程 04：数据外泄（markdown 图片 / 裸链 / PII / canary） */
export const runDay18Exfil = (data) => request.post('/v1/study/day18/exfil', data)

/** Day 18 课程 05：危险操作确认门（interrupt 位置 / 幂等账本 / 超时 fail-closed） */
export const runDay18Approval = (data) =>
  request.post('/v1/study/day18/approval', data, { timeout: 60000 })

/** Day 18 课程 06：代码执行沙箱（预设攻击样例或自定义代码） */
export const runDay18Sandbox = (data) =>
  request.post('/v1/study/day18/sandbox', data, { timeout: 60000 })

/** Day 18 课程 07：安全中间件流水线（单次请求过六道中间件） */
export const runDay18Pipeline = (data) => request.post('/v1/study/day18/pipeline', data)

/** Day 18 课程 07：攻击集回归（10 条攻击的期望 vs 实际 + 通过率） */
export const runDay18AttackSuite = () =>
  request.get('/v1/study/day18/attack-suite', { timeout: 60000 })

// ---------- Day 19 服务化部署 ----------

/** Day 19 概念数据：服务差异 / 四层架构 / 并发模型 / SSE / 三道闸 / 存储 / 坑 / 速查表 */
export const getDay19Mapping = () => request.get('/v1/study/day19/mapping')

/** Day 19 课程 01：同步阻塞 vs 协程并发（真实计时）+ 容量数学与雪崩推演 */
export const runDay19Concurrency = (data) =>
  request.post('/v1/study/day19/concurrency', data, { timeout: 60000 })

/** Day 19 课程 02：SSE 事件计划预览（原始帧 + 心跳 + Last-Event-ID 续发） */
export const previewDay19Sse = (data) => request.post('/v1/study/day19/sse/preview', data)

/**
 * Day 19 课程 02：用 EventSource 消费生产级 SSE。
 *
 * 与 Day 13 的区别：这里的帧是**命名事件**（`event: token`），所以不能用 onmessage，
 * 必须为每种事件名单独 addEventListener；心跳是注释行，EventSource 根本不会回调，
 * 只能靠「连接一直不断」间接体会。
 *
 * @param {{question: string, slow_ms?: number, heartbeat_ms?: number, fail?: boolean, last_event_id?: number}} params
 * @param {{onEvent?: Function, onMeta?: Function, onToken?: Function, onDone?: Function, onError?: Function}} handlers
 * @returns {EventSource}
 */
export function openDay19Sse(params, handlers = {}) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const query = new URLSearchParams()
  query.set('q', params.question || '订单 A1001 到哪了？')
  query.set('slow_ms', String(params.slow_ms ?? 1200))
  query.set('heartbeat_ms', String(params.heartbeat_ms ?? 400))
  if (params.fail) query.set('fail', 'true')
  if (typeof params.last_event_id === 'number' && params.last_event_id >= 0) {
    query.set('last_event_id', String(params.last_event_id))
  }

  const es = new EventSource(`${base}/v1/study/day19/sse/chat?${query.toString()}`)
  const bind = (name, handler) => {
    es.addEventListener(name, (event) => {
      let data
      try {
        data = JSON.parse(event.data)
      } catch {
        return
      }
      handlers.onEvent?.({ name, id: event.lastEventId, data })
      handler?.(data)
    })
  }
  bind('meta', handlers.onMeta)
  bind('node', handlers.onNode)
  bind('token', handlers.onToken)
  bind('done', handlers.onDone)
  bind('error', handlers.onError)
  // 只在「还没收到 done/error」时把网络断开当错误；正常收尾由页面 close()
  es.onerror = () => handlers.onNetworkError?.({ message: 'SSE 连接中断（后端未启动 / 网络断开）' })
  return es
}

/** Day 19 课程 03：thread_id 拆包 + 归属校验矩阵 + 审批 scope + 恢复载荷 */
export const runDay19Session = (data) => request.post('/v1/study/day19/session', data)

/** Day 19 课程 04：run 生命周期（背压 503 / 幂等重放 / 软合并 / 越权轮询 / 取消） */
export const runDay19Runs = (data) =>
  request.post('/v1/study/day19/runs', data, { timeout: 60000 })

/** Day 19 课程 05：令牌桶突发与回填 + 租户月配额校验/结算 */
export const runDay19RateLimit = (data) => request.post('/v1/study/day19/rate-limit', data)

/** Day 19 课程 06：prompt 版本化 + hash 稳定灰度 + 门禁 + 30 秒回滚 */
export const runDay19Rollout = (data) => request.post('/v1/study/day19/rollout', data)

/** Day 19 课程 07：总装骨架（四层组件 / 请求生命周期 / 端点表 / 可抄代码） */
export const getDay19Skeleton = () => request.get('/v1/study/day19/skeleton')

// ---------- Day 20 可靠性 ----------

/** Day 20 概念数据：故障四分类 / 重试三要素 / 降级阶梯 / 退出时序 / 容量天花板 / SLO / 坑 / 速查表 */
export const getDay20Mapping = () => request.get('/v1/study/day20/mapping')

/** Day 20 课程 01：错误分类 + 退避抖动重试 + run 级总预算（等待为模拟，不真睡） */
export const runDay20Retry = (data) => request.post('/v1/study/day20/retry', data)

/** Day 20 课程 02：降级阶梯 L0→L1→L2→L3（能力对齐 / 缓存铁律 / 探活防乒乓） */
export const runDay20Ladder = (data) => request.post('/v1/study/day20/ladder', data)

/** Day 20 课程 03：优雅退出时序（摘流量 → 503 → drain → 落盘 → flush） */
export const runDay20Shutdown = (data) => request.post('/v1/study/day20/shutdown', data)

/** Day 20 课程 04：三道天花板 → Semaphore 定容 + 恒定速率压测读数与决策 */
export const runDay20Capacity = (data) => request.post('/v1/study/day20/capacity', data)

/** Day 20 课程 05：trace → 窗口指标 → 烧毁率 → 告警判定 + runbook */
export const runDay20Slo = (data) => request.post('/v1/study/day20/slo', data)

/** Day 20 课程 06：混沌演练（注入 + 预期声明表 + 盲区清单） */
export const runDay20Chaos = (data) => request.post('/v1/study/day20/chaos', data)

// ---------- Day 21 规划能力 ----------

/** Day 21 概念数据：三症状 / ReAct 对照 / 计划字段 / 三不变量 / 三形态 / 坑 / 速查表 */
export const getDay21Mapping = () => request.get('/v1/study/day21/mapping')

/** Day 21 课程 01：复现三种「没有计划」的失败（监控全绿但答案错） */
export const runDay21Failures = (data) => request.post('/v1/study/day21/failures', data)

/** Day 21 课程 02：计划结构 + 三条不变量校验 + DAG 拓扑分层 */
export const runDay21Schema = (data) => request.post('/v1/study/day21/schema', data)

/** Day 21 课程 03：L1 计划先行（Planner → Executor → Validator） */
export const runDay21Execute = (data) => request.post('/v1/study/day21/execute', data)

/** Day 21 课程 04：L2 偏离重规划（四动作 / 账本冻结 / 防乒乓） */
export const runDay21Replan = (data) => request.post('/v1/study/day21/replan', data)

/** Day 21 课程 05：L3 反思回路（根因枚举 / 可执行指令 / 教训升级） */
export const runDay21Reflexion = (data) => request.post('/v1/study/day21/reflexion', data)

/** Day 21 课程 06：LangGraph 计划图（路由 / 反思 / 重规划 / 中断审批） */
export const runDay21Graph = (data) => request.post('/v1/study/day21/graph', data)

/** Day 21 课程 07：规划质量四指标 + A/B/C/D 四档对照 + CI 门禁 */
export const runDay21Eval = (data) => request.post('/v1/study/day21/eval', data)
