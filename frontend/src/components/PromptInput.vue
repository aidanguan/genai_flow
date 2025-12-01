<script setup lang="ts">
import { ref } from 'vue'
import { Send, Sparkles } from 'lucide-vue-next'
import { SUPPORTED_MODELS } from '../types'

interface Props {
  disabled: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  generate: [prompt: string, model: string]
}>()

const prompt = ref('')
const selectedModel = ref(SUPPORTED_MODELS[0].id)

const handleSubmit = () => {
  if (prompt.value.trim()) {
    emit('generate', prompt.value, selectedModel.value)
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    handleSubmit()
  }
}
</script>

<template>
  <div class="w-full flex flex-col gap-3 h-full">
    <!-- 头部 / 模型选择器 -->
    <div class="flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2 text-blue-600 dark:text-blue-400">
        <Sparkles :size="16" />
        <span class="text-xs font-bold uppercase tracking-wider">AI 助手</span>
      </div>
      <select 
        v-model="selectedModel"
        class="bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[150px] transition-colors"
        :disabled="disabled"
      >
        <option v-for="m in SUPPORTED_MODELS" :key="m.id" :value="m.id">
          {{ m.name?.split?.('(')?.[0]?.trim?.() || m.name }}
        </option>
      </select>
    </div>

    <!-- 输入区 -->
    <div class="relative group flex-1 flex flex-col min-h-[160px]">
      <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
      <div class="relative bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col flex-1 overflow-hidden transition-colors">
        <textarea
          v-model="prompt"
          @keydown="handleKeyDown"
          placeholder="详细描述您的图形需求，越详细生成效果越好...&#10;&#10;示例：创建一个用户注册和登录流程图，需要包含：&#10;1. 注册流程：邮箱验证、密码强度检查、验证码校验&#10;2. 登录流程：账号密码验证、登录成功/失败分支、异常处理&#10;3. 请包含所有可能的分支和错误处理"
          class="w-full flex-1 p-4 bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm resize-none focus:outline-none scrollbar-thin leading-relaxed transition-colors"
          :disabled="disabled"
        />
        
        <div class="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 transition-colors">
          <span class="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:inline">Ctrl + Enter 发送</span>
          <button
            @click="handleSubmit"
            :disabled="disabled || !prompt.trim()"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 ml-auto"
          >
            <template v-if="disabled">
              <div class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </template>
            <template v-else>
              <span>生成</span>
              <Send :size="14" />
            </template>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
