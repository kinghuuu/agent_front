/**
 * Pinia 实例。
 * 各业务状态放 `store/modules/*.js`，这里只负责创建实例并导出。
 */
import { createPinia } from 'pinia'

const pinia = createPinia()

export default pinia
