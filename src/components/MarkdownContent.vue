<template>
  <!-- v-html 渲染 markdown-it 产出的 HTML；html:false 保证原始 HTML 被转义，不会执行脚本 -->
  <div class="markdown-body" v-html="html" @click="handleCodeCopy" />
</template>

<script setup>
// 通用 Markdown 渲染组件：会话气泡、文档预览等场景共用
// - markdown-it 默认预设：支持标题 / 列表 / 表格 / 引用 / 分割线 / 行内代码 / 代码围栏
// - html:false —— 模型输出里的原始 HTML 会被转义，避免 XSS
// - breaks:true —— 单个换行也换行，贴合聊天习惯
// - 代码块额外渲染"语言 + 复制"头部，复制用事件委托处理（v-html 内的节点无法直接绑事件）
import { computed } from 'vue'
import MarkdownIt from 'markdown-it'
import { ElMessage } from 'element-plus'

const props = defineProps({
  content: { type: String, default: '' }
})

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true
})

// 链接统一新窗口打开，并补 rel 防止反向 tabnabbing
const defaultLinkOpen =
  md.renderer.rules.link_open ||
  ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options))
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank')
  tokens[idx].attrSet('rel', 'noopener noreferrer')
  return defaultLinkOpen(tokens, idx, options, env, self)
}

// 代码块：包一层头部（语言名 + 复制按钮），代码本体仍在 <pre><code> 里
md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx]
  const lang = (token.info || '').trim().split(/\s+/)[0]
  const code = md.utils.escapeHtml(token.content)
  const langClass = lang ? ` class="language-${md.utils.escapeHtml(lang)}"` : ''
  return `<div class="md-code">
  <div class="md-code-head">
    <span class="md-code-lang">${lang || 'text'}</span>
    <button class="md-code-copy" type="button">复制</button>
  </div>
  <pre class="md-code-block"><code${langClass}>${code}</code></pre>
</div>`
}

const html = computed(() => md.render(props.content || ''))

// 复制代码：点击头部的「复制」按钮，取同组 <code> 的纯文本
const handleCodeCopy = async (event) => {
  const btn = event.target.closest('.md-code-copy')
  if (!btn) return
  const code = btn.closest('.md-code')?.querySelector('code')?.textContent || ''
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('代码已复制')
  } catch {
    ElMessage.error('复制失败，请手动选择')
  }
}
</script>

<style scoped lang="scss">
.markdown-body {
  font-size: 15px;
  line-height: 1.75;
  color: $text-primary;
  word-break: break-word;

  // ---------- 基础排版 ----------
  :deep(p) {
    margin: 0 0 10px;
  }

  :deep(p:first-child) {
    margin-top: 0;
  }

  :deep(p:last-child) {
    margin-bottom: 0;
  }

  :deep(h1),
  :deep(h2),
  :deep(h3),
  :deep(h4),
  :deep(h5),
  :deep(h6) {
    margin: 18px 0 8px;
    font-weight: 600;
    line-height: 1.4;
  }

  :deep(h1) {
    font-size: 20px;
  }

  :deep(h2) {
    font-size: 18px;
  }

  :deep(h3) {
    font-size: 16px;
  }

  :deep(ul),
  :deep(ol) {
    margin: 0 0 10px;
    padding-left: 22px;
  }

  :deep(li) {
    margin: 3px 0;
  }

  :deep(li > p) {
    margin: 0;
  }

  :deep(blockquote) {
    margin: 10px 0;
    padding: 6px 12px;
    border-left: 3px solid rgba(107, 124, 255, 0.45);
    border-radius: 0 6px 6px 0;
    background: rgba(107, 124, 255, 0.06);
    color: $text-regular;
  }

  :deep(hr) {
    margin: 16px 0;
    border: none;
    border-top: 1px solid $agent-border;
  }

  :deep(a) {
    color: $agent-accent;
    text-decoration: none;
    border-bottom: 1px solid rgba(107, 124, 255, 0.35);

    &:hover {
      border-bottom-color: $agent-accent;
    }
  }

  :deep(img) {
    max-width: 100%;
    border-radius: $radius-md;
  }

  // ---------- 行内代码 ----------
  :deep(code) {
    padding: 1px 5px;
    border-radius: 5px;
    background: rgba(31, 45, 61, 0.06);
    font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
    font-size: 13px;
    color: #d6557c;
  }

  // ---------- 表格 ----------
  :deep(table) {
    display: block;
    width: 100%;
    margin: 12px 0;
    border-collapse: collapse;
    font-size: 14px;
    overflow-x: auto;
  }

  :deep(th),
  :deep(td) {
    padding: 8px 12px;
    border: 1px solid $agent-border;
    text-align: left;
  }

  :deep(th) {
    background: $agent-panel-bg;
    font-weight: 600;
    white-space: nowrap;
  }

  :deep(tbody tr:nth-child(even)) {
    background: #fafbfe;
  }

  // ---------- 代码块 ----------
  :deep(.md-code) {
    margin: 12px 0;
    border-radius: 10px;
    overflow: hidden;
    background: #1f2430;
  }

  :deep(.md-code-head) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: rgba(255, 255, 255, 0.06);
    font-size: 12px;
    color: #98a1ba;
  }

  :deep(.md-code-copy) {
    padding: 2px 8px;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: #98a1ba;
    font-size: 12px;
    cursor: pointer;
    @include transition(all);

    &:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.12);
    }
  }

  :deep(.md-code-block) {
    margin: 0;
    padding: 12px 14px;
    overflow-x: auto;
  }

  :deep(.md-code-block code) {
    padding: 0;
    background: transparent;
    color: #e6e9f2;
    font-size: 13px;
    line-height: 1.65;
  }
}
</style>
