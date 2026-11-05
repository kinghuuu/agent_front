<template>
  <div class="page-container">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>模型管理</span>
          <el-button type="primary" @click="openCreate">
            <el-icon class="btn-icon"><Plus /></el-icon>新增模型
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="loadList">
        <el-tab-pane label="大模型 (LLM)" name="llm" />
        <el-tab-pane label="向量模型 (Embedding)" name="embedding" />
        <el-tab-pane label="重排序模型 (Rerank)" name="rerank" />
      </el-tabs>

      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column label="展示名称" min-width="160">
          <template #default="{ row }">
            <span class="model-name">{{ row.name }}</span>
            <el-tag v-if="row.is_default" type="info" size="small" class="default-tag">默认</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="model_name" label="实际模型名" min-width="150" />
        <el-table-column prop="base_url" label="服务地址" min-width="220" show-overflow-tooltip />
        <el-table-column label="可用性" width="90" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled"
              :loading="row._toggling"
              @change="(val) => handleToggle(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="330" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" :loading="row._testing" @click="handleTest(row)">
              连通测试
            </el-button>
            <el-button
              link
              type="primary"
              :loading="row._testingCtx"
              @click="handleTestContext(row)"
            >
              上下文测试
            </el-button>
            <el-button
              link
              :type="row.enabled ? 'warning' : 'success'"
              @click="handleToggle(row, !row.enabled)"
            >
              {{ row.enabled ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无模型，点击右上角「新增模型」添加" />
        </template>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑模型' : '新增模型'" width="520px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="展示名称" prop="name">
          <el-input v-model="form.name" placeholder="如：DeepSeek" maxlength="100" />
        </el-form-item>
        <el-form-item label="实际模型名" prop="model_name">
          <el-input v-model="form.model_name" placeholder="如：deepseek-chat" maxlength="100" />
        </el-form-item>
        <el-form-item label="模型类型" prop="model_type">
          <el-radio-group v-model="form.model_type">
            <el-radio-button value="llm">LLM</el-radio-button>
            <el-radio-button value="embedding">Embedding</el-radio-button>
            <el-radio-button value="rerank">Rerank</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="服务地址" prop="base_url">
          <el-input
            v-model="form.base_url"
            placeholder="如：https://api.deepseek.com（OpenAI 兼容）"
          />
        </el-form-item>
        <el-form-item label="API Key" prop="api_key">
          <el-input
            v-model="form.api_key"
            type="password"
            show-password
            placeholder="选填；编辑时留空表示不修改"
          />
        </el-form-item>
        <el-form-item label="设为默认" prop="is_default">
          <el-switch v-model="form.is_default" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
// 模型管理页：
// - Tab 对应模型类型（llm / embedding / rerank），切换时按类型重新拉取列表
// - 行内操作：编辑、连通测试、上下文测试、启用/禁用、删除
// - 新增与编辑共用一个弹窗（form.id 有值即为编辑）
// - 每行带独立 loading 标记（_testing / _toggling 等），避免整表 loading
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  listModels,
  createModel,
  updateModel,
  toggleModel,
  deleteModel,
  testModel,
  testModelContext
} from '@/api/model'

const activeTab = ref('llm')
const loading = ref(false)
const list = ref([])

const dialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref()
const form = reactive({
  id: null,
  name: '',
  model_name: '',
  model_type: 'llm',
  base_url: '',
  api_key: '',
  is_default: false,
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入展示名称', trigger: 'blur' }],
  model_name: [{ required: true, message: '请输入实际模型名', trigger: 'blur' }],
  base_url: [
    { required: true, message: '请输入服务地址', trigger: 'blur' },
    { type: 'url', message: '地址需以 http(s):// 开头', trigger: 'blur' }
  ]
}

// 拉取当前 Tab 的模型列表，并为每行附加独立 loading 标记（行内操作时只锁当前行）
const loadList = async () => {
  loading.value = true
  try {
    const data = await listModels({ model_type: activeTab.value })
    list.value = (data || []).map((item) => ({
      ...item,
      _toggling: false,
      _testing: false,
      _testingCtx: false
    }))
  } finally {
    loading.value = false
  }
}

// 打开新增弹窗：清空表单，模型类型默认取当前 Tab
const openCreate = () => {
  Object.assign(form, {
    id: null,
    name: '',
    model_name: '',
    model_type: activeTab.value,
    base_url: '',
    api_key: '',
    is_default: false,
    remark: ''
  })
  dialogVisible.value = true
}

// 打开编辑弹窗：回填数据；后端不回传 api_key，所以这里固定置空
const openEdit = (row) => {
  Object.assign(form, { ...row, api_key: '' })
  dialogVisible.value = true
}

// 提交表单：校验 → 新增/更新 → 关闭弹窗 → 刷新列表
const handleSubmit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    const payload = { ...form }
    delete payload.id
    // 编辑时留空 api_key 表示不修改
    if (form.id && !payload.api_key) delete payload.api_key
    if (form.id) {
      await updateModel(form.id, payload)
      ElMessage.success('更新成功')
    } else {
      await createModel(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadList()
  } finally {
    submitting.value = false
  }
}

// 启用/禁用：接口成功后再更新本地状态，失败保持原值
const handleToggle = async (row, enabled) => {
  row._toggling = true
  try {
    await toggleModel(row.id, enabled)
    row.enabled = enabled
    ElMessage.success(enabled ? '已启用' : '已禁用')
  } finally {
    row._toggling = false
  }
}

// 连通测试：真实调用一次模型接口（短消息），验证地址 / 模型名 / Key 是否可用
const handleTest = async (row) => {
  row._testing = true
  try {
    const result = await testModel(row.id)
    if (result.success) {
      ElMessage.success(`${result.message}（${result.latency_ms}ms）`)
    } else {
      ElMessage.error(`连通失败：${result.message}`)
    }
  } finally {
    row._testing = false
  }
}

// 上下文测试：发送约 4000 tokens 的长文本，验证模型的长上下文处理能力
const handleTestContext = async (row) => {
  row._testingCtx = true
  try {
    const result = await testModelContext(row.id)
    if (result.success) {
      ElMessage.success(`上下文测试通过（${result.latency_ms}ms）`)
    } else {
      ElMessage.error(`上下文测试失败：${result.message}`)
    }
  } finally {
    row._testingCtx = false
  }
}

// 删除：二次确认 → 调接口 → 刷新列表（取消确认时 promise 会 reject，直接中断）
const handleDelete = async (row) => {
  await ElMessageBox.confirm(`确定删除模型「${row.name}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  await deleteModel(row.id)
  ElMessage.success('删除成功')
  await loadList()
}

onMounted(loadList)
</script>

<style scoped lang="scss">
.model-name {
  font-weight: 600;
}

.default-tag {
  margin-left: $gap-sm;
}

.btn-icon {
  margin-right: 4px;
}
</style>
