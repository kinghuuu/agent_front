# AGENTS.md — agent_front 智能体协作指南

> 本文件是**人与 AI 智能体共同遵守**的项目说明书。任何智能体（Claude / CodeBuddy / Cursor…）在本仓库写代码前，必须先读完本文件并严格遵循。改动项目结构或规范时，同步更新本文件。

## 1. 项目简介

从零学习 Agent 开发的前端工程，与后端 `agent_backend` 配套。当前定位：**通用管理台骨架 + 按模块逐步扩展**（概览、模型管理 → 会话 → 知识库 …）。

- 技术栈：Vue 3（`<script setup>`）+ Vite 5 + Element Plus + Sass + Pinia + Vue Router + Axios + markdown-it（Markdown 渲染）
- 开发地址：<http://localhost:15173>（`npm run dev` 自动打开浏览器）
- 后端地址：<http://127.0.0.1:15401>，开发期由 Vite 代理 `/api` 转发

### 当前页面清单

| 路由         | 页面     | 说明                                                              |
| ------------ | -------- | ----------------------------------------------------------------- |
| `/dashboard` | 概览     | 展示后端健康状态、PG/Redis 连通性                                 |
| `/chat`      | 会话     | 大模型对话页（参考豆包 / 千问）：左侧会话列表 + 右侧对话区，SSE 流式输出、模型切换、重命名 / 删除 / 清空会话 |
| `/models`    | 模型管理 | LLM / Embedding / Rerank 配置列表与增删改查、连通测试、上下文测试 |
| `/study`     | 智能体开发学习 | Day 01 实验台：工具清单、Function Calling 循环、手写 ReAct 协议的可视化测试（执行轨迹时间线 / 模型原文展示），可切换模型与最大步数 |
| `/about`     | 关于     | 项目技术栈说明                                                    |

## 2. 启动与常用命令

```bash
npm install
npm run dev      # http://localhost:15173，自动打开浏览器
npm run build    # 构建产物在 dist/
npm run preview
```

## 3. 目录结构与约定

```
agent_front/src/
├─ main.js               # 入口：注册 Pinia/Router/Element Plus，全局注册图标
├─ App.vue               # 根组件，仅放 <router-view />
├─ router/index.js       # 路由表；侧边栏菜单由后端布局读取这里的 meta 自动生成
├─ store/                # Pinia：modules/app.js 存侧边栏折叠等全局 UI 状态
├─ api/
│  ├─ request.js         # axios 实例 + 拦截器（自动解包 {code,message,data}）
│  └─ model.js           # 按业务模块一个文件，与后端接口一一对应
├─ layouts/BasicLayout.vue  # 侧边栏 + 顶栏 + 内容区，唯一布局
├─ views/<模块>/index.vue   # 一个业务模块一个目录
├─ styles/               # variables.scss / mixins.scss 已全局自动注入，index.scss 为全局样式
└─ utils/                # 通用工具函数
```

**约定**：

- `@` 别名指向 `src`；禁止跨页面直接 import 另一个 `views/` 里的组件，公共组件放 `src/components/`
- 新增页面 = 在 `views/<模块>/index.vue` 建页面 + `api/<模块>.js` 建接口 + 路由表加一条（菜单会自动出现）
- 路由 `meta` 字段：`title`（菜单/面包屑文案）、`icon`（Element Plus 图标名，必须真实存在）、`hidden`（不在菜单显示）、`fullscreen`（为 true 时 BasicLayout 的内容区去掉内边距，页面自行撑满，用于对话页这类全屏场景）
- 全局状态只放"跨页面共享的 UI 状态"，业务数据由页面自行请求，不塞进 store

## 4. 编码规范

1. **注释用中文，标识符用英文**；学习项目，写好注释。
2. 组件统一 `<script setup>` + Composition API，**禁止** Options API 与 mixin 混用。
3. 每个文件顶部加一段注释说明职责；每个 `const xxx = async () => {}` 业务函数上方加一行注释说明用途（`// 加载列表，params 由当前 Tab 决定`）。
4. 顺序约定：`<template>` → `<script setup>` → `<style scoped lang="scss">`；`script` 内先 import、再常量、再 ref/reactive、再方法、最后 `onMounted`。
5. 样式一律 `scoped` + `lang="scss"`，优先用 `styles/variables.scss` 里的变量（`$primary-color`、`$gap-md`…）和 `mixins.scss` 的 mixin，禁止到处写魔法值。
6. 接口调用只通过 `api/` 层：页面禁止直接 `import axios`；返回值已被 `request.js` 解包为 `data`。
7. 交互反馈统一用 `ElMessage` / `ElMessageBox`；异步操作必须加 loading（按钮 `:loading` 或列表 `v-loading`）。
8. 图标：`@element-plus/icons-vue` 中不存在的名字会导致运行时告警（如 `Robot` 不存在），新增前先确认。

## 5. 新增页面/功能的标准流程

1. `src/api/<模块>.js` 定义接口函数（带注释说明对应后端路径）
2. `src/views/<模块>/index.vue` 写页面：`<el-card>` + 表格/表单 + 弹窗
3. `src/router/index.js` 在 `/` 布局的 `children` 中加路由，填 `meta.title` / `meta.icon`
4. `npm run build` 通过（无未解析组件、无 Sass 报错）
5. 更新本文件「当前页面清单」与「变更记录」

自查清单：

- [ ] `npm run build` 通过
- [ ] 新页面在侧边栏可见，切换正常，`document.title` 正确
- [ ] 接口错误有提示、异步有 loading、删除有二次确认
- [ ] 样式使用 scss 变量，未硬编码颜色/间距
- [ ] 已更新「变更记录」，若与后端联动也已更新后端仓库的记录

## 6. 变更追踪规范（强制）

**任何新增 / 修改 / 删除功能，都必须在下方「变更记录」表追加一行**：

```
| 日期 | 类型 | 模块/改动 | 关键文件 | 说明 |
```

- 类型：`新增` / `修改` / `修复` / `重构` / `规范`
- 关键文件写相对路径，最多列 2~4 个最关键的
- 跨仓库改动（前后端都要改）时，两个仓库的变更记录都要写

## 7. 变更记录

| 日期       | 类型 | 模块/改动  | 关键文件                                                                | 说明                                                                              |
| ---------- | ---- | ---------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| 2026-11-02 | 新增 | 项目骨架   | `src/main.js`, `src/router/index.js`, `src/layouts/BasicLayout.vue`     | Vue3+Vite+Element Plus+Sass 骨架；布局、路由、Pinia、axios 封装、概览/关于/404    |
| 2026-11-02 | 修改 | 端口与代理 | `vite.config.js`, `.env.development`                                    | dev 端口 5173 → 15173 并自动打开浏览器；`/api` 代理指向 15401                     |
| 2026-11-02 | 修复 | 图标解析   | `src/layouts/BasicLayout.vue`                                           | 图标包中不存在 `Robot`，改用 `MagicStick` 并显式引入                              |
| 2026-11-05 | 新增 | 模型管理   | `src/views/models/index.vue`, `src/api/model.js`, `src/router/index.js` | 三类模型 Tab + 表格与操作（编辑/连通测试/上下文测试/启用禁用/删除）+ 新增编辑弹窗 |
| 2026-11-05 | 规范 | 工程规范   | `AGENTS.md`, `CLAUDE.md`                                                | 建立目录约定、编码规范、新增页面流程与变更追踪机制；补齐全仓注释                  |
| 2026-11-06 | 新增 | 智能体     | `src/views/agent/**`, `src/api/agent.js`, `src/router/index.js`         | 大模型对话页：左侧会话列表 + 右侧对话区（欢迎页 / 消息气泡 / 输入框三个子组件），SSE 流式输出（`fetch` + ReadableStream 解析，axios 不支持流式）、停止生成、复制、模型切换、重命名 / 删除 / 清空会话 |
| 2026-11-06 | 修改 | 布局与样式 | `src/layouts/BasicLayout.vue`, `src/router/index.js`, `src/styles/variables.scss` | 路由 `meta.fullscreen` 支持全屏页面（内容区去内边距）；新增智能体主题变量（`$agent-*` 渐变主色 / 气泡底色等） |
| 2026-11-06 | 修改 | 智能体交互 | `src/views/agent/index.vue`, `src/views/agent/components/ChatComposer.vue`, `src/views/agent/components/SessionSidebar.vue`, `src/api/agent.js` | 模型选择移入输入框（composer 底部工具区，预留知识库等后续选择器位置）；移除顶栏「清空对话」入口与对应接口封装；会话列表去掉装饰图标，标题占满 |
| 2026-11-06 | 修改 | 智能体样式 | `src/views/agent/index.vue` | 顶栏「生成中」从 el-tag 改为转圈加载胶囊（`.generating` 自定义 ring 动画） |
| 2026-11-06 | 修改 | 智能体样式 | `src/views/agent/index.vue` | 生成中指示器简化为纯转圈（去掉底色胶囊与文字，仅 14px ring 动画） |
| 2026-11-06 | 修改 | 智能体样式 | `src/views/agent/components/ChatComposer.vue`, `src/views/agent/index.vue` | 发送/停止改为纯图标圆按钮（渐变紫 / 淡紫底，tooltip 提示）；模型选择改为无边框小胶囊；转圈指示器换成 conic-gradient + mask 的渐变彗尾样式 |
| 2026-11-06 | 修改 | 智能体样式 | `src/views/agent/components/MessageItem.vue`, `src/styles/variables.scss` | 消息气泡去掉左右头像（气泡占满行宽 80%），用户消息的操作行跟随右对齐；删除不再使用的 `$agent-user-avatar-bg` 变量 |
| 2026-11-06 | 新增 | 公共组件 | `src/components/MarkdownContent.vue`, `src/views/agent/components/MessageItem.vue`, `package.json` | 新增通用 Markdown 渲染组件（markdown-it@14：html 转义防 XSS、表格/列表/引用/链接新窗口，代码块带语言标签与复制按钮），替换 MessageItem 里手写的围栏解析；后续会话类页面直接复用该组件 |
| 2026-11-06 | 修改 | 智能体样式 | `src/views/agent/index.vue` | 欢迎页去掉图标方块；标题改为流动渐变文字（background-clip: text + 9s 慢速循环，`prefers-reduced-motion` 时停用） |
| 2026-11-06 | 修改 | 智能体样式 | `src/views/agent/index.vue`, `src/styles/variables.scss` | 内容区宽度统一为 `$agent-content-width`（820px）：消息列表 / 欢迎页 / 输入框左右边界对齐（水平内边距统一移到滚动容器 `.message-area`） |
| 2026-11-06 | 修复 | 智能体样式 | `src/views/agent/index.vue` | 经典滚动条只占右侧宽度，导致滚动容器内内容居中轴左移半个滚动条宽（与输入框错位）；`.message-area` 加 `scrollbar-gutter: stable both-edges` 对称预留滚动条槽修复 |
| 2026-11-06 | 修改 | 布局与样式 | `src/layouts/BasicLayout.vue`, `src/styles/variables.scss` | 侧边栏改浅色主题（`$sidebar-bg` / `$sidebar-hover-bg` 替代深色 `$menu-bg`）：白系底 + 右描边，菜单文字深灰、hover 淡灰、当前项淡底加粗；logo 文字改深色（机器人图标 currentColor 自动适配） |
| 2026-11-06 | 新增 | 公共图标 | `src/components/icons/AgentIcon.vue`, `src/layouts/BasicLayout.vue` | 新增机器人 SVG 图标组件（描边 currentColor + 渐变点缀，尺寸随 font-size），替换布局 logo 的 MagicStick；公共图标放 `components/icons/` |
| 2026-11-10 | 重命名 | 会话模块 | `src/views/chat/**`（原 agent）, `src/api/chat.js`, `src/router/index.js` | 页面模块 agent → chat（原「智能体」只是会话功能）：路由 `/agent` → `/chat`（菜单名「会话」）、views 目录与 api 文件更名，接口调用切到 `/api/v1/chat`；`$agent-*` 主题变量保留（全局主题 token，MarkdownContent 等公共组件也在用） |
| 2026-11-11 | 修改 | 布局与概览 | `src/layouts/BasicLayout.vue`, `src/views/dashboard/index.vue` | 移除概览页「操作」卡片（刷新按钮与接口提示）和顶栏右侧后端健康状态标签，并清理随之失效的 `backendStatus` / `getHealth` / `onMounted` 逻辑与 `.tip`、`.header-right` 样式 |
| 2026-11-11 | 新增 | 学习实验台 | `src/views/study/**`, `src/api/study.js`, `src/router/index.js` | 「智能体开发学习」页（路由 `/study`）：三个 Tab 对应后端三个接口——工具清单卡片、Function Calling 循环（el-timeline 时间线展示每步工具调用与观察）、手写 ReAct（模型原文 + 解析结果 + Observation）；支持预设问题、最大步数与模型切换；运行类请求单独放宽 axios 超时到 120s；最终回答复用 MarkdownContent |
| 2026-11-11 | 修改 | 学习实验台 | `src/views/study/components/AgentRunner.vue`, `src/views/study/components/ReactRunner.vue` | 配合后端练习 1（search_news 工具）：两个循环实验区各加一条新闻类预设问题（"帮我查一下某关键词最近的新闻，并总结一下"），页面渲染逻辑不变（工具清单与执行轨迹均动态展示后端返回） |
| 2026-11-12 | 修改 | ReAct 多轮 | `src/views/study/components/ReactRunner.vue` | 配合后端练习 3（ReAct 多轮对话）：前端持有会话 ID（crypto.randomUUID 生成），每次运行随请求携带，实现"接着上一句继续问"；新增会话状态行（当前轮数 / 会话 ID / "新对话"按钮——换 ID 即清空记忆）；轨迹区末尾新增 history 折叠面板，可视化跨轮累计记忆全文 |
