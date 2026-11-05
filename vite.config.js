import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api'],
        // 所有 scss 自动可用变量与 mixin
        additionalData: `@use "@/styles/variables.scss" as *;\n@use "@/styles/mixins.scss" as *;\n`
      }
    }
  },
  server: {
    host: true,
    port: 15173,
    // 启动后自动打开浏览器
    open: true,
    proxy: {
      // 前端 /api 请求转发到 FastAPI
      '/api': {
        target: 'http://127.0.0.1:15401',
        changeOrigin: true
      }
    }
  }
})
