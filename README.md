# agent_front

Vue 3 + Vite + Element Plus + Sass 的前端骨架。

## 目录结构

```
agent_front/
├─ src/
│  ├─ main.js              # 入口：注册 Pinia / Router / Element Plus
│  ├─ App.vue
│  ├─ router/              # 路由（菜单由路由 meta 自动生成）
│  ├─ store/               # Pinia 状态（modules/app.js）
│  ├─ api/
│  │  ├─ request.js        # axios 封装 + 统一响应解包
│  │  └─ system.js         # 后端接口
│  ├─ layouts/             # 基础布局（侧边栏 + 顶栏 + 内容区）
│  ├─ views/               # 页面（dashboard / about / error）
│  ├─ styles/
│  │  ├─ variables.scss    # 全局 scss 变量（已自动注入）
│  │  ├─ mixins.scss       # 通用 mixin（已自动注入）
│  │  └─ index.scss        # 全局样式
│  └─ utils/
├─ vite.config.js          # 别名 @ -> src，/api 代理到 8000
└─ package.json
```

## 命令

```bash
npm install
npm run dev        # http://localhost:15173（自动打开浏览器）
npm run build
npm run preview
```

## 说明

- `@` 指向 `src`；`variables.scss` / `mixins.scss` 已通过 Vite 自动注入，组件里直接用变量如 `$primary-color`。
- 开发期 `/api` 由 Vite 代理到 `http://127.0.0.1:15401`，后端需同时启动。
- `api/request.js` 会把后端的 `{code, message, data}` 自动解包为 `data`，失败时统一 `ElMessage` 提示。
