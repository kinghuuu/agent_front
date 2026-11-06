/**
 * 智能体模块接口，对应后端 /api/v1/agent。
 *
 * 会话的增删改查走统一的 axios 封装（`request.js` 会自动解包 { code, message, data }）；
 * 对话是 SSE 流式响应，axios 无法逐块读取，因此单独用 fetch + ReadableStream 解析。
 */
import request from './request'

/** 会话列表（按最近更新倒序） */
export const listConversations = () => request.get('/v1/agent/conversations')

/** 新建会话，data: { title?, model_config_id? } */
export const createConversation = (data = {}) =>
  request.post('/v1/agent/conversations', data)

/** 会话详情（含全部消息） */
export const getConversation = (id) => request.get(`/v1/agent/conversations/${id}`)

/** 重命名会话 / 切换绑定模型，data: { title?, model_config_id? } */
export const updateConversation = (id, data) =>
  request.patch(`/v1/agent/conversations/${id}`, data)

/** 删除会话（连带消息） */
export const deleteConversation = (id) => request.delete(`/v1/agent/conversations/${id}`)

/** 智能体可用的 LLM 模型（仅启用中的，默认模型在前） */
export const listAgentModels = () => request.get('/v1/agent/models')

/** 解析 HTTPException 的错误文案：后端抛 HTTPException 时返回的是 { detail } */
const readErrorMessage = async (resp) => {
  try {
    const data = await resp.json()
    return data.detail || data.message || `请求失败（${resp.status}）`
  } catch {
    return `请求失败（${resp.status}）`
  }
}

/**
 * 流式对话（SSE）。
 *
 * 后端事件：start（用户消息已落库）/ delta（增量文本）/ done（助手消息落库）/ error。
 * 这里按 `\n\n` 切分事件块，逐块 JSON 解析后回调给页面；最后一段不完整时留在 buffer 等下一块。
 *
 * @param {number} conversationId 会话 id
 * @param {{content: string, model_config_id?: number}} payload 消息体
 * @param {{onStart?: Function, onDelta?: Function, onDone?: Function, onError?: Function}} handlers
 * @param {AbortSignal} signal 「停止生成」用，abort 后 fetch 会抛 AbortError
 */
export async function streamChat(conversationId, payload, handlers, signal) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  const resp = await fetch(
    `${base}/v1/agent/conversations/${conversationId}/chat/stream`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal
    }
  )
  if (!resp.ok || !resp.body) {
    throw new Error(await readErrorMessage(resp))
  }

  const reader = resp.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const blocks = buffer.split('\n\n')
    // 最后一段可能是半截事件，留到下一轮拼接
    buffer = blocks.pop() || ''

    for (const block of blocks) {
      const dataLine = block.split('\n').find((line) => line.startsWith('data:'))
      if (!dataLine) continue
      let event
      try {
        event = JSON.parse(dataLine.slice(5).trim())
      } catch {
        continue
      }
      if (event.type === 'start') handlers.onStart?.(event)
      else if (event.type === 'delta') handlers.onDelta?.(event.content)
      else if (event.type === 'done') handlers.onDone?.(event.message)
      else if (event.type === 'error') handlers.onError?.(event.message)
    }
  }
}
