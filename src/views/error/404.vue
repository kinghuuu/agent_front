<template>
  <!-- 404：未匹配到路由时展示 -->
  <div class="not-found">
    <el-empty description="页面不存在">
      <el-button type="primary" @click="$router.push('/dashboard')">回到首页</el-button>
    </el-empty>
  </div>
</template>

<style scoped lang="scss">
.not-found {
  height: 100%;
  @include flex-center;
}
</style>
