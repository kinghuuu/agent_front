<template>
  <div class="page-container">
    <!-- 页面说明：Agent = LLM + 工具 + 循环 + 状态 -->
    <el-card shadow="never" class="intro-card">
      <div class="intro">
        <h2 class="intro-title">Agent 开发学习 · Day 01–09 实验台</h2>
        <p class="intro-text">
          Agent = <b>LLM</b> + <b>工具</b> + <b>循环</b> + <b>状态</b>。
          下面实验区对应课程的核心对象：模型眼里的<b>工具说明书</b>（Day 04 起由
          Pydantic 参数模型自动生成，带三层校验与结构化纠错）、 Function Calling
          的<b>最小 Agent 循环</b>（并行多工具、self-heal 观测、Day 05
          起装上<b>四层终止与强制收敛</b>：动作/结果双指纹防自旋、预算熔断、
          事实支撑校验）、拆掉黑盒后的<b>手写 ReAct 文本协议</b>、 Day 02
          的<b>结构化输出三级方案</b>、Day 06 的<b>短期记忆</b>（messages
          只是每轮现算的视图，<b>SessionState</b> 才是记忆真相源：硬约束进锚点永不裁剪、
          事实进结构化槽位、旧轮进增量摘要并做实体反向核查、按“轮”裁剪避免孤儿 tool 消息、
          三档水位线 60% / 80% / 95% 分级处理），Day 07 的三条外部知识管道——
          <b>画像注入</b>（长期记忆 KV，跨会话落库）、<b>文档检索</b>（按结构切块 +
          向量与 BM25 混合检索 + RRF 融合 + 来源标注）、<b>事实走工具</b>
          （实时数据不放进检索索引），以及 Day 08 的<b>上下文工程</b>——
          把前面所有原料按<b>四层结构</b>编排进有限预算：指令层永不裁、状态层按条裁、
          检索块先去重再按 U 型曲线摆放（top1 头 / top2 尾）、对话层按轮裁，
          最后跑一遍<b>七问退化自检</b>并产出可肉眼审查的 dump；
          Day 09 起进入框架篇，用 <b>LangChain</b> 给手写管线换工业零件——
          消息对象、ChatPromptTemplate、with_structured_output、
          <b>LCEL 竖线</b>（stream / batch / with_retry 自动继承）与 @tool + bind_tools 的框架版循环，
          每个 API 都能在对照表里找到手写的对应物。
          每次运行都会展示完整执行轨迹（决策、工具调用、观察结果、停止原因与成本）。
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
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
// 智能体开发学习页：可视化测试 Day 01–09 的后端接口（工具清单 / Agent 循环 / ReAct / 结构化输出 / 多轮会话 / 长期记忆与 RAG / 上下文工程 / LangChain）
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
