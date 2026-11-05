# AGENTS.md — agent_front 智能体协作指南

> 本文件是**人与 AI 智能体共同遵守**的项目说明书。任何智能体（Claude / CodeBuddy / Cursor…）在本仓库写代码前，必须先读完本文件并严格遵循。改动项目结构或规范时，同步更新本文件。

## 1. 项目简介

从零学习 Agent 开发的前端工程，与后端 `agent_backend` 配套。当前定位：**通用管理台骨架 + 按模块逐步扩展**（概览、模型管理 → 会话 → 知识库 …）。

- 技术栈：Vue 3（`<script setup>`）+ Vite 5 + Element Plus + Sass + Pinia + Vue Router + Axios
- 开发地址：<http://localhost:15173>（`npm run dev` 自动打开浏览器）
- 后端地址：<http://127.0.0.1:15401>，开发期由 Vite 代理 `/api` 转发

### 当前页面清单

| 路由         | 页面     | 说明                                                              |
| ------------ | -------- | ----------------------------------------------------------------- |
| `/dashboard` | 概览     | 展示后端健康状态、PG/Redis 连通性                                 |
| `/models`    | 模型管理 | LLM / Embedding / Rerank 配置列表与增删改查、连通测试、上下文测试 |
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
- 路由 `meta` 字段：`title`（菜单/面包屑文案）、`icon`（Element Plus 图标名，必须真实存在）、`hidden`（不在菜单显示）
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
