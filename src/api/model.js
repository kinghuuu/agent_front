import request from './request'

/** 模型列表，params: { model_type?: 'llm' | 'embedding' | 'rerank' } */
export const listModels = (params) => request.get('/v1/models', { params })

/** 新增模型配置 */
export const createModel = (data) => request.post('/v1/models', data)

/** 编辑模型配置 */
export const updateModel = (id, data) => request.put(`/v1/models/${id}`, data)

/** 启用/禁用 */
export const toggleModel = (id, enabled) =>
  request.patch(`/v1/models/${id}/enabled`, { enabled })

/** 删除模型配置 */
export const deleteModel = (id) => request.delete(`/v1/models/${id}`)

/** 连通测试 */
export const testModel = (id) => request.post(`/v1/models/${id}/test`)

/** 上下文长度测试 */
export const testModelContext = (id, numTokens = 4000) =>
  request.post(`/v1/models/${id}/test-context`, { num_tokens: numTokens })
