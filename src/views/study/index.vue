<template>
  <div class="page-container">
    <!-- 页面说明：Agent = LLM + 工具 + 循环 + 状态 -->
    <el-card shadow="never" class="intro-card">
      <div class="intro">
        <h2 class="intro-title">Agent 开发学习 · Day 01 实验台</h2>
        <p class="intro-text">
          Agent = <b>LLM</b> + <b>工具</b> + <b>循环</b> + <b>状态</b>。
          下面三个实验区对应课程的三个核心对象：模型眼里的<b>工具说明书</b>、
          Function Calling 的<b>最小 Agent 循环</b>、以及拆掉黑盒后的<b>手写 ReAct 文本协议</b>。
          每次运行都会展示完整执行轨迹（模型每一轮的决策、工具调用与观察结果）。
        </p>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="工具清单" name="tools">
          <ToolList v-if="activeTab === 'tools'" />
        </el-tab-pane>
        <el-tab-pane label="Function Calling 循环" name="agent">
          <AgentRunner v-if="activeTab === 'agent'" />
        </el-tab-pane>
        <el-tab-pane label="手写 ReAct 协议" name="react">
          <ReactRunner v-if="activeTab === 'react'" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
// 智能体开发学习页：可视化测试 Day 01 的后端接口（工具清单 / Agent 循环 / ReAct 循环）
// 三个实验区拆成独立组件，懒渲染（切到对应 Tab 才挂载，避免互相干扰）
import { ref } from 'vue'
import ToolList from './components/ToolList.vue'
import AgentRunner from './components/AgentRunner.vue'
import ReactRunner from './components/ReactRunner.vue'

const activeTab = ref('agent')
</script>

<style lang="scss" scoped>
.page-container {
  max-width: 960px;
  margin: 0 auto;
}

.intro-card {
  margin-bottom: $gap-md;

  .intro {
    text-align: left;

    .intro-title {
      margin: 0 0 $gap-sm;
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
    }

    .intro-text {
      margin: 0;
      font-size: 13px;
      line-height: 1.8;
      color: $text-regular;

      b {
        color: $agent-accent;
      }
    }
  }
}
</style>
