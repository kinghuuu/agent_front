/**
 * 系统类接口（健康检查等）。
 * baseURL 已由 request.js 设为 `/api`，此处只需写 `/v1/...`。
 */
import request from './request'

/** 健康检查：GET /api/v1/health */
export const getHealth = () => request.get('/v1/health')
