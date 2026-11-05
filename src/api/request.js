/**
 * axios 实例与拦截器。
 *
 * 后端统一返回 `{ code, message, data }`：
 *   - 成功（code === 0）：拦截器直接返回 `data`，页面无需再层层解包
 *   - 失败（code !== 0 / HTTP 错误）：统一弹 ElMessage 并 reject
 *
 * 约定：页面里不要直接用 axios，一律走 `src/api/<模块>.js`。
 */
import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000
})

// 请求拦截
request.interceptors.request.use(
  (config) => {
    // 后续接入登录态后在此注入 token
    // const token = localStorage.getItem('token')
    // if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截：后端统一返回 { code, message, data }
request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res && typeof res === 'object' && 'code' in res) {
      if (res.code !== 0) {
        ElMessage.error(res.message || '请求失败')
        return Promise.reject(new Error(res.message || '请求失败'))
      }
      return res.data
    }
    return res
  },
  (error) => {
    const msg = error.response?.data?.message || error.message || '网络异常'
    ElMessage.error(msg)
    return Promise.reject(error)
  }
)

export default request
