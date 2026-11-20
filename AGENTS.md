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
| `/study`     | 智能体开发学习 | Day 01–12 实验台：工具清单（Schema 自动生成 + 副作用分级 + 说明书预算）、Function Calling 循环（并行多工具 / self-heal / 四层终止：停止原因、强制收敛降级、结果指纹、事实支撑校验、成本统计）、手写 ReAct 协议、结构化输出三级方案、短期记忆（多轮对话 + SessionState 真相源可视化）、长期记忆与 RAG（画像 KV / 知识库切块索引 / 混合检索 / 三管道组装问答）、上下文工程（四层预算账单 / 检索块去重与摆放轨迹 / 七问自检 / 最终上下文与 dump）、LangChain 初探（零件对照表 / 消息抽象 / Prompt 模板 / 结构化输出降级轨迹 / LCEL 五模式 / 框架版 Agent 循环）、LangGraph 状态图（reducer 四实验 / 线性图逐节点补丁 / 条件边四条分支与转人工阈值 / ReAct 环双刹车与子图 / 静态与 Send 动态并行，附 mermaid 与 ascii 出图）、Checkpointer 与人机协同（Day 11：三实验存档续跑与隔离、交互续聊 + 快照四要素与历史帧、确认门暂停/放行/拒绝/改参数、审批队列与超时自动驳回、节点重放副作用对照、时间旅行、SQLite 重启续跑）、多智能体 Supervisor（Day 12：单 Agent 三堵墙复现 wide/narrow、主管派单时间线与账本/messages 双视图、去重守卫与交接预算、完整版审批闸门 + 改写金额放行 + 退款流水、Send 并行扇出与 writer 调用次数校验） |
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
| 2026-11-13 | 新增 | 学习·结构化输出 | `src/views/study/components/Extractor.vue`, `src/api/study.js`, `src/views/study/index.vue` | 配合后端 Day 02 接口 `/extract/run`：新增"结构化输出"实验区 Tab——三级方案切换（口头要求反面教材 / JSON Mode / Pydantic Schema，切换时展示方案说明）、尝试轨迹时间线（原文 / 报错 / 降级说明 / 通过标签）、最终工单 el-descriptions 展示（含嵌套商品标签）；支持失败重试次数、模型切换与 5 条预设客户原话；页面升级为 Day 01–02 实验台 |
| 2026-11-13 | 修改 | 学习·多工具调度 | `src/views/study/components/AgentRunner.vue`, `src/views/study/components/ToolList.vue`, `src/api/study.js` | 配合后端 Day 03：Agent 循环轨迹新增并行调用标签（一步多个 tool_calls 时展示"并行调用 × N"）、每次调用的耗时 / 报错 / `[self-heal] 自我纠正` 标记；预设问题补两条 Day 03 场景（"杭州天气+几点了"并行多工具、"摄氏换算华氏"串行依赖）；工具清单页新增"工具调用日志"面板（时间/工具/参数/耗时/结果表格 + 刷新按钮，对接 `GET /tools/calls`）；页面升级为 Day 01–03 实验台 |
| 2026-11-16 | 修改 | 学习·工具设计 | `src/views/study/components/AgentRunner.vue`, `src/views/study/components/ToolList.vue`, `src/api/study.js` | 配合后端 Day 04：Agent 循环新增"已获用户确认"勾选框（放行退款等资金操作，配合确认门）与熔断升级红色提示（`escalated`）；报错标签细化展示错误类型（bad_json/invalid_args/business_rule/need_confirmation/tool_crash）；预设问题补两条 Day 04 场景（"帮我看下 U000123 最近两单"订单查询、"把订单 O20260012 全额退了吧"确认门流程）；工具卡片新增副作用分级标签（read/write）与"需用户确认"标记；工具清单页顶部新增说明书预算提示条（总字符数 / 预算 / 最长 description，对接 `GET /tools/budget`，超限变警告）；页面升级为 Day 01–04 实验台 |
| 2026-11-16 | 修改 | 学习·工具清单布局 | `src/views/study/components/ToolList.vue` | 工具卡片固定一行两个（窄屏回落单列）；卡片限高 360px，内容超出时在卡片内部纵向滚动（细滚动条 + `overscroll-behavior: contain` 防滚动穿透），避免长 Schema 把页面拉长 |
| 2026-11-16 | 修改 | 学习·终止条件 | `src/views/study/components/AgentRunner.vue`, `src/views/study/index.vue` | 配合后端 Day 05：新增预算档位选择（自动 / 简单 6 步 / 复杂 20 步）与覆盖步数（0 = 按档位）；结果区新增停止原因标签（六种 stop_reason 配色）、成本行（档位/步数/tokens/耗时）、强制收敛降级提示、结果校验（第 4 层）提示与终止诊断；每步轨迹展示结果指纹 `progress_fp`（连续相同即无进展）；预设问题补三条 Day 05 场景（空结果自旋、导出轮询、可能假收敛的闲聊事实问题） |
| 2026-11-17 | 新增 | 学习·短期记忆 | `src/views/study/components/SessionChat.vue`, `src/views/study/index.vue`, `src/api/study.js` | 配合后端 Day 06：新增"短期记忆"Tab——左侧多轮对话（预设追问验证约束锚点与事实槽位、消息气泡带停止原因/水位/成本标签、自动滚底），右侧 SessionState 真相源面板（轮数/上下文/水位/近轮统计、约束锚点永不裁剪、事实槽位 JSON、摘要质检补回硬事实、滚动摘要、淘汰与水位记录）；api 新增 `chatStudySession` / `getStudySession` / `resetStudySession`；页面升级为 Day 01–06 实验台，`npm run build` 通过 |
| 2026-11-17 | 修改 | 学习·会话输入 | `src/views/study/components/SessionChat.vue` | 发送按钮由输入框外的文字按钮改为内嵌在 textarea 右下角的圆形渐变图标键（Promotion 图标，复用 `$agent-gradient`，与会话页发送键同风格）；用定位容器 + 文本框右侧 44px 留白实现，不依赖 el-input slot；包一层 span 承接 tooltip 的 hover，避免 disabled 时提示失效；placeholder 补 Enter 发送 / Shift+Enter 换行说明 |
| 2026-11-17 | 修改 | 学习·会话加载态 | `src/views/study/components/SessionChat.vue`, `src/api/study.js`, `src/api/request.js` | 请求进行中在消息列表末尾显示"正在思考…"跳动圆点气泡（发送后/回答后各滚一次底）；内嵌按钮加载中切换为暂停图标（VideoPause）+ 淡紫"停止"样式，点击经 AbortController 真正取消请求，tooltip 同步切换"停止生成/发送"；`chatStudySession` 新增可选 signal 参数，公共响应拦截器对 ERR_CANCELED 静默（停止不留失败气泡、不误弹错误），主动停止与真实失败分流 |
| 2026-11-17 | 修改 | 模型管理·上下文测试 | `src/views/models/index.vue` | 「上下文测试」按钮仅对 LLM 类型展示（Embedding / Rerank 没有对话上下文概念），避免用户点到必然失败的请求；连通测试按钮保持全类型（后端已按类型分流到 chat / embeddings） |
| 2026-11-17 | 新增 | 学习·长期记忆与 RAG | `src/views/study/components/Day07Panel.vue`, `src/views/study/index.vue`, `src/api/study.js` | 配合后端 Day 07：新增"长期记忆与 RAG"Tab，内含四个子区——① 长期记忆（写入/覆盖、事实列表、遗忘与清空、注入文本预览、同义键冲突提示）；② 知识库（Markdown 录入 + 切块向量化、文档列表与删除、一键填入示例文档）；③ 检索测试（α 权重滑块、doc_id 元数据过滤、展示 RRF / 向量排名 / BM25 排名）；④ 组装问答（预设问题、最终回答、三管道摘要、检索命中与冲突裁决、工具调用轨迹）；api 新增 9 个 Day07 接口；页面升级为 Day 01–07 实验台，`npm run build` 通过 |
| 2026-11-18 | 新增 | 学习·上下文工程 | `src/views/study/components/Day08Panel.vue`, `src/views/study/index.vue`, `src/api/study.js` | 配合后端 Day 08：新增"上下文工程"Tab——左列原料区（当前问题 + 预设、真实画像用户 ID、真实混合检索 query 与 top_k、总预算、工具说明书开关、dump 开关，折叠区可编辑手填检索块 / 对话历史 JSON / 系统提示词 / 硬约束），右列结果区（预算总览进度条 + 原料来源标签、四层编排的分层用量条与层文本折叠、检索块"命运"表格：处理方式 / 摆放位次 / 说明、七问自检清单（未通过标红并给出信号）、编排报警、最终上下文与整体 dump，支持一键复制上下文）；`buildStudyContext` 超时放宽到 60s；页面升级为 Day 01–08 实验台，`npm run build` 通过 |
| 2026-11-18 | 新增 | 学习·LangChain 初探 | `src/views/study/components/Day09Panel.vue`, `src/views/study/index.vue`, `src/api/study.js` | 配合后端 Day 09：新增"LangChain 初探"Tab，顶部展示**手写零件 ↔ 框架零件对照表**（含"谁更省事"标签）与已安装的 langchain-core 版本，五个子区——① 消息抽象（四类消息表 + 裸 dict 反例 / ToolMessage 校验失败正例 + 转回 OpenAI 格式）；② Prompt 模板（company/question/history 输入、"故意漏填"勾选、必填与 placeholder 可选变量标签、填充后的消息与 fail-fast 现场）；③ 结构化输出（三字段抽取、可跑 1~3 次 + temperature 滑块看抖动、下发方式标签与降级轨迹折叠、下发 JSON Schema）；④ LCEL 管道（invoke / stream 分片 / batch 并发与串行耗时 + `with_retry` 纯本地重试轨迹 / RunnableLambda 后处理，用"竖线链"渲染组件顺序）；⑤ 框架版循环（预设问题、description 变体 full/vague/missing、MAX_STEPS、时间线轨迹与 bind_tools 真实下发 schema）；api 新增 6 个 Day09 接口；页面升级为 Day 01–09 实验台，`npm run build` 通过 |
| 2026-11-18 | 新增 | 学习·LangGraph 状态图 | `src/views/study/components/Day10Panel.vue`, `src/views/study/components/Day10Graph.vue`, `src/views/study/index.vue`, `src/api/study.js` | 配合后端 Day 10：新增「LangGraph 状态图」Tab——顶部展示 State/Node/Edge 三件套表 + 已安装 langgraph 版本，折叠区放「手写 while ↔ 图」七行对照与六个坑；五个子区：① 状态与 reducer（四个对照实验，逐节点列出「读到 / 交出」、最终状态与结论，附 reducer 速查表）；② 最小线性图（预设问题、updates/values 逐节点事件表、最终回答与 trace）；③ 条件边（多行问题批量跑 + 置信度阈值滑块触发转人工，结果表展示 intent / 置信度 / 路径 / 回答）；④ ReAct 环（recursion_limit 物理保险丝 + step_limit 语义刹车 + 工具正常/永远失败 + 练习 3 子图开关，时间线按「作用域 · 节点」展示决策与工具返回）；⑤ 并行扇出（静态实测耗时对比串行、Send 分支列表、子图命名空间事件与「子图 + reducer 重复追加」警示）；新增通用组件 `Day10Graph.vue` 统一渲染节点 / 边（条件边高亮）/ mermaid 源码 / ascii（缺 grandalf 时给安装提示）；api 新增 6 个 Day10 接口；页面升级为 Day 01–10 实验台，`npm run build` 通过 |
| 2026-11-19 | 新增 | 学习·Checkpointer | `src/views/study/components/Day11Panel.vue`, `src/views/study/components/Day11Frames.vue`, `src/views/study/index.vue`, `src/api/study.js` | 配合后端 Day 11：新增「Checkpointer」Tab——顶部 StateSnapshot 四要素表 + 折叠区（动态中断 ↔ 静态断点对照 / 三档存档器 / 六个坑）；五个子区：① 存档与续跑（课程三实验、实验 1/2/3 结果卡、快照四要素、历史帧，另加交互续聊：thread_id 跨请求、重置开关）；② 确认门（预设问题、发起后展示 next/interrupt/checkpoint_id，同意 / 拒绝 / 改参数三选一后 `Command(resume=)`，结果表标注执行 / 拦截，附待审批队列与「模拟超时自动驳回」）；③ 节点重放（纯本地：副作用在 interrupt 前 → 暂停 1 次 / 恢复后 2 次；决策·审批·执行拆分 → 0 / 1 次，附三条铁律）；④ 时间旅行（主题改写、两答案对比、原历史保留标签、分叉前后帧表）；⑤ SQLite 重启（thread_id + 重置开关、第一轮 / 模拟重启后继续、落盘路径与文件大小、文件里的历史帧）；新增通用组件 `Day11Frames.vue` 统一渲染历史帧（next / state / 消息数 / 时间）；api 新增 10 个 Day11 接口；页面升级为 Day 01–11 实验台，`npm run build` 通过 |
| 2026-11-19 | 新增 | 学习·多智能体 Supervisor | `src/views/study/components/Day12Panel.vue`, `src/views/study/index.vue`, `src/api/study.js` | 配合后端 Day 12：新增「多智能体 Supervisor」Tab——顶部三堵墙表 + 折叠区（三角色分工 / 三种交接方式 / 状态三层 / 三层终止 / 五个坑 / 选型判据与成本量级 / 必掌握清单）；四个子区：① 单 Agent 复现（wide 5 工具 / narrow 3 只读一键对比，执行轨迹表、工具调用次数、假收敛与越权告警）；② 最小 Supervisor（去重守卫开关 + 交接预算 + recursion_limit，派单时间线、账本 findings、带 name 的共享 messages 表、图结构）；③ 完整版（发起后展示 next/interrupt/thread_id，放行 / 驳回 / 改金额三选一后 `Command(resume=)`，恢复后展示退款流水与结论账本）；④ 并行专家（Send 两分支耗时与结论、合并后 findings、writer 调用次数校验）；复用 `Day10Graph` 出图；api 新增 6 个 Day12 接口；页面升级为 Day 01–12 实验台，`npm run build` 通过 |
