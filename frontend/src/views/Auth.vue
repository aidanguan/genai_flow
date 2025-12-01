<script setup lang="ts">
import { ref } from 'vue'
import { Sparkles, Mail, Lock, User, LogIn, UserPlus, ArrowRight } from 'lucide-vue-next'
import { login, register } from '../api'

interface Props {
  onSuccess?: () => void
}

const props = defineProps<Props>()

const isLogin = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')

// 表单数据
const email = ref('')
const password = ref('')
const username = ref('')

const handleSubmit = async () => {
  if (isLoading.value) return
  
  errorMessage.value = ''
  
  // 表单验证
  if (!email.value || !password.value) {
    errorMessage.value = '请填写所有必填项'
    return
  }
  
  if (!isLogin.value && !username.value) {
    errorMessage.value = '请输入用户名'
    return
  }
  
  isLoading.value = true
  
  try {
    if (isLogin.value) {
      // 登录
      await login({ email: email.value, password: password.value })
      props.onSuccess?.()
    } else {
      // 注册
      await register({
        email: email.value,
        password: password.value,
        username: username.value
      })
      props.onSuccess?.()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '操作失败，请重试'
  } finally {
    isLoading.value = false
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMessage.value = ''
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
    <!-- 背景装饰 -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      <div class="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl"></div>
    </div>

    <!-- 认证卡片 -->
    <div class="relative w-full max-w-md">
      <!-- Logo 和标题 -->
      <div class="text-center mb-8">
        <div class="inline-flex items-center gap-2 mb-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center shadow-lg">
            <Sparkles :size="20" class="text-white" />
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">DiagramAI</h1>
        </div>
        <p class="text-sm text-slate-600 dark:text-slate-400">
          {{ isLogin ? '欢迎回来！登录继续使用' : '创建账户，开始你的旅程' }}
        </p>
      </div>

      <!-- 主表单卡片 -->
      <div class="relative group">
        <div class="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl transition-colors">
          
          <!-- Tab 切换 -->
          <div class="flex gap-2 mb-6 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              @click="toggleMode"
              :class="[
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all',
                isLogin
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              ]"
            >
              <LogIn :size="16" />
              <span>登录</span>
            </button>
            <button
              @click="toggleMode"
              :class="[
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all',
                !isLogin
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              ]"
            >
              <UserPlus :size="16" />
              <span>注册</span>
            </button>
          </div>

          <!-- 错误提示 -->
          <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
            {{ errorMessage }}
          </div>

          <!-- 表单 -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- 用户名（仅注册时显示） -->
            <div v-if="!isLogin" class="space-y-2">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">用户名</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User :size="18" class="text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  v-model="username"
                  type="text"
                  placeholder="请输入用户名"
                  @keydown="handleKeyDown"
                  :disabled="isLoading"
                  class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <!-- 邮箱 -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail :size="18" class="text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  v-model="email"
                  type="email"
                  placeholder="your@email.com"
                  @keydown="handleKeyDown"
                  :disabled="isLoading"
                  class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <!-- 密码 -->
            <div class="space-y-2">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
              <div class="relative group">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock :size="18" class="text-slate-400 dark:text-slate-500" />
                </div>
                <input
                  v-model="password"
                  type="password"
                  placeholder="••••••••"
                  @keydown="handleKeyDown"
                  :disabled="isLoading"
                  class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <!-- 提交按钮 -->
            <button
              type="submit"
              :disabled="isLoading"
              class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-medium rounded-lg shadow-lg shadow-blue-900/20 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              <template v-if="isLoading">
                <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>处理中...</span>
              </template>
              <template v-else>
                <span>{{ isLogin ? '登录' : '注册' }}</span>
                <ArrowRight :size="18" />
              </template>
            </button>
          </form>

          <!-- 底部提示 -->
          <div class="mt-6 text-center">
            <p class="text-sm text-slate-600 dark:text-slate-400">
              {{ isLogin ? '还没有账户？' : '已有账户？' }}
              <button
                @click="toggleMode"
                class="text-blue-600 dark:text-blue-400 font-medium hover:underline"
              >
                {{ isLogin ? '立即注册' : '立即登录' }}
              </button>
            </p>
          </div>
        </div>
      </div>

      <!-- 底部装饰文字 -->
      <p class="text-center text-xs text-slate-500 dark:text-slate-600 mt-8">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  </div>
</template>
