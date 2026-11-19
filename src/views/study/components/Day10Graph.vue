<template>
  <!-- Day 10 通用图卡片：节点 + 边（条件边高亮）+ mermaid 源码 + ascii（可选） -->
  <div class="day10-graph">
    <div class="block-head">
      <h4>{{ title }}</h4>
      <div class="meta-row">
        <el-tag size="small" effect="plain">{{ structure.nodes.length }} 个节点</el-tag>
        <el-tag size="small" effect="plain">{{ structure.edges.length }} 条边</el-tag>
        <el-tag v-if="conditionalCount" size="small" type="warning" effect="plain">
          条件边 {{ conditionalCount }}
        </el-tag>
      </div>
    </div>

    <div class="node-row">
      <span
        v-for="node in structure.nodes"
        :key="node"
        class="node-chip"
        :class="nodeClass(node)"
      >
        {{ nodeLabel(node) }}
      </span>
    </div>

    <div class="edge-list">
      <div v-for="(edge, index) in structure.edges" :key="index" class="edge-row">
        <span class="node-chip small">{{ nodeLabel(edge.source) }}</span>
        <span class="edge-arrow" :class="{ conditional: edge.conditional }">
          ──<template v-if="edge.label">（{{ edge.label }}）</template>──▶
        </span>
        <span class="node-chip small">{{ nodeLabel(edge.target) }}</span>
      </div>
    </div>

    <el-collapse class="mt">
      <el-collapse-item title="mermaid 源码（可直接贴进文档 / PR）" name="mermaid">
        <pre class="code-block">{{ structure.mermaid }}</pre>
      </el-collapse-item>
      <el-collapse-item title="ascii 图（draw_ascii）" name="ascii">
        <pre v-if="structure.ascii" class="code-block">{{ structure.ascii }}</pre>
        <p v-else class="hint">{{ structure.ascii_hint || '（本图没有 ascii 版本）' }}</p>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup>
// Day 10 图卡片：五个实验共用（线性图 / 条件边 / ReAct 环 / 扇出 / 子图）
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: '图结构' },
  structure: { type: Object, required: true }
})

// START / END 显示成课程里的写法，其余节点原样展示
const nodeLabel = (node) => (node === '__start__' ? 'START' : node === '__end__' ? 'END' : node)

const nodeClass = (node) =>
  node === '__start__' || node === '__end__' ? 'terminal' : 'normal'

const conditionalCount = computed(
  () => props.structure.edges.filter((edge) => edge.conditional).length
)
</script>

<style lang="scss" scoped>
.day10-graph {
  padding: $gap-md;
  margin-bottom: $gap-md;
  border: 1px solid #e8e9f0;
  border-radius: $radius-md;
  background: #fff;

  h4 {
    margin: 0 0 $gap-sm;
    font-size: 13px;
    color: $text-primary;
  }
}

.block-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: $gap-sm;

  h4 {
    margin: 0;
  }
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.node-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: $gap-sm;
}

.node-chip {
  padding: 2px 8px;
  border-radius: $radius-sm;
  background: #f2f3fa;
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  font-size: 11px;
  color: $text-regular;

  &.terminal {
    background: #f6f0ff;
    color: $agent-accent;
  }

  &.small {
    font-size: 11px;
    white-space: nowrap;
  }
}

.edge-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.edge-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.edge-arrow {
  padding: 0 2px;
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  color: $agent-text-muted;

  &.conditional {
    color: #d98a00;
    font-weight: 600;
  }
}

.mt {
  margin-top: 8px;
}

.hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.7;
  color: $agent-text-muted;
}

.code-block {
  margin: 0;
  padding: 10px 12px;
  border-radius: $radius-sm;
  background: #f7f8fc;
  font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
  font-size: 11px;
  line-height: 1.8;
  color: $text-regular;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 280px;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
