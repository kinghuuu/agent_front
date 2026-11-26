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
