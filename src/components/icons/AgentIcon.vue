<template>
  <!-- 智能体图标：机器人头像（天线 + 双眼 + 微笑），描边取 currentColor 以适配深浅背景，
       眼睛/天线/耳朵用主题渐变点缀 -->
  <svg
    class="agent-icon"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <linearGradient
        id="agent-icon-gradient"
        x1="3"
        y1="3"
        x2="21"
        y2="20"
        gradientUnits="userSpaceOnUse"
      >
        <stop stop-color="#6b7cff" />
        <stop offset="1" stop-color="#a06bff" />
      </linearGradient>
    </defs>

    <!-- 天线 -->
    <circle cx="12" cy="2.7" r="1.3" fill="url(#agent-icon-gradient)" />
    <path d="M12 4.1v1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />

    <!-- 头部 -->
    <rect
      x="3.1"
      y="5.9"
      width="17.8"
      height="13.4"
      rx="4.4"
      stroke="currentColor"
      stroke-width="1.6"
    />

    <!-- 两侧耳朵 -->
    <rect x="1.2" y="10.6" width="1.8" height="3.8" rx="0.9" fill="url(#agent-icon-gradient)" />
    <rect x="21" y="10.6" width="1.8" height="3.8" rx="0.9" fill="url(#agent-icon-gradient)" />

    <!-- 眼睛 -->
    <circle cx="8.9" cy="11.6" r="1.55" fill="url(#agent-icon-gradient)" />
    <circle cx="15.1" cy="11.6" r="1.55" fill="url(#agent-icon-gradient)" />

    <!-- 微笑 -->
    <path d="M9.5 15.7h5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
  </svg>
</template>

<script setup>
// 通用图标组件：尺寸跟随 font-size（1em），颜色跟随文字色（currentColor）
</script>

<style scoped lang="scss">
.agent-icon {
  width: 1em;
  height: 1em;
  display: block;
  flex: 0 0 auto;
}
</style>
