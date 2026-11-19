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
