<template>
  <div class="page-container">
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
        <el-tab-pane label="结构化输出（Day 02）" name="extract">
          <Extractor v-if="activeTab === 'extract'" />
        </el-tab-pane>
        <el-tab-pane label="短期记忆（Day 06）" name="session">
          <SessionChat v-if="activeTab === 'session'" />
        </el-tab-pane>
        <el-tab-pane label="长期记忆与 RAG（Day 07）" name="day07">
          <Day07Panel v-if="activeTab === 'day07'" />
        </el-tab-pane>
        <el-tab-pane label="上下文工程（Day 08）" name="day08">
          <Day08Panel v-if="activeTab === 'day08'" />
        </el-tab-pane>
        <el-tab-pane label="LangChain 初探（Day 09）" name="day09">
          <Day09Panel v-if="activeTab === 'day09'" />
        </el-tab-pane>
        <el-tab-pane label="LangGraph 状态图（Day 10）" name="day10">
          <Day10Panel v-if="activeTab === 'day10'" />
        </el-tab-pane>
        <el-tab-pane label="Checkpointer（Day 11）" name="day11">
          <Day11Panel v-if="activeTab === 'day11'" />
        </el-tab-pane>
        <el-tab-pane label="多智能体 Supervisor（Day 12）" name="day12">
          <Day12Panel v-if="activeTab === 'day12'" />
        </el-tab-pane>
        <el-tab-pane label="流式输出（Day 13）" name="day13">
          <Day13Panel v-if="activeTab === 'day13'" />
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
// 智能体开发学习页：可视化测试 Day 01–13 的后端接口（工具清单 / Agent 循环 / ReAct / 结构化输出 / 多轮会话 / 长期记忆与 RAG / 上下文工程 / LangChain / LangGraph / Checkpointer / 多智能体 Supervisor / 流式输出）
// 各实验区拆成独立组件，懒渲染（切到对应 Tab 才挂载，避免互相干扰）
import { ref } from "vue";
import ToolList from "./components/ToolList.vue";
import AgentRunner from "./components/AgentRunner.vue";
import ReactRunner from "./components/ReactRunner.vue";
import Extractor from "./components/Extractor.vue";
import SessionChat from "./components/SessionChat.vue";
import Day07Panel from "./components/Day07Panel.vue";
import Day08Panel from "./components/Day08Panel.vue";
import Day09Panel from "./components/Day09Panel.vue";
import Day10Panel from "./components/Day10Panel.vue";
import Day11Panel from "./components/Day11Panel.vue";
import Day12Panel from "./components/Day12Panel.vue";
import Day13Panel from "./components/Day13Panel.vue";

const activeTab = ref("agent");
</script>

<style lang="scss" scoped>
.page-container {
  max-width: 100%;
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
