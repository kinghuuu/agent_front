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

/**
 * 运行 Function Calling Agent 循环
 * data: { question, max_steps?, model_config_id? }，返回完整执行轨迹
 */
export const runStudyAgent = (data) =>
  request.post('/v1/study/agent/run', data, { timeout: 120000 })

/** 运行手写 ReAct 文本协议循环，data 同上 */
export const runStudyReact = (data) =>
  request.post('/v1/study/react/run', data, { timeout: 120000 })
