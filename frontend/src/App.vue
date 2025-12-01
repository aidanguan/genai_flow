<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Code2, BookOpen, X, ChevronUp, Loader2 } from 'lucide-vue-next'
import { DiagramType } from './types'
import type { DiagramState, HistoryItem } from './types'
import Sidebar from './components/Sidebar.vue'
import Header from './components/Header.vue'
import PromptInput from './components/PromptInput.vue'
import MermaidEditor from './components/MermaidEditor.vue'
import ExcalidrawWrapper from './components/ExcalidrawWrapper.vue'
import Auth from './views/Auth.vue'
import { generateDiagram, isAuthenticated, removeToken } from './api'

// 状态管理
const isLoggedIn = ref(false)
const activeTab = ref<DiagramType>(DiagramType.MERMAID)
const isLoading = ref(false)
const diagramState = ref<DiagramState>({
  mermaidCode: `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]`,
  excalidrawElements: [],
  title: 'Untitled Diagram'
})
const history = ref<HistoryItem[]>([])

// UI 状态
const isSidebarCollapsed = ref(false)
const showCodeEditor = ref(true)

// 主题状态 - 默认浅色模式
const isDarkMode = ref(false)

// 初始化主题
onMounted(async () => {
  // 从本地存储读取主题偏好,默认浅色
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark') {
    isDarkMode.value = true
    document.documentElement.classList.add('dark')
  } else {
    isDarkMode.value = false
    document.documentElement.classList.remove('dark')
  }
  
  // 从本地存储加载历史
  const saved = localStorage.getItem('diagram_history')
  if (saved) {
    try {
      history.value = JSON.parse(saved)
    } catch (e) {
      console.error('Failed to load history', e)
    }
  }
  
  // 检查登录状态
  isLoggedIn.value = isAuthenticated()
})

// 监听主题变化
watch(isDarkMode, (newVal) => {
  console.log('🎨 主题切换:', newVal ? '深色模式' : '浅色模式')
  if (newVal) {
    document.documentElement.classList.add('dark')
    localStorage.setItem('theme', 'dark')
    console.log('✅ 已添加 dark class 到 <html>')
  } else {
    document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', 'light')
    console.log('✅ 已移除 dark class 从 <html>')
  }
  console.log('📝 当前 HTML class:', document.documentElement.className)
})

// 保存到历史
const saveToHistory = (newState: DiagramState) => {
  const newItem: HistoryItem = {
    id: Date.now().toString(),
    timestamp: Date.now(),
    type: activeTab.value,
    preview: newState.title,
    state: newState
  }
  history.value = [newItem, ...history.value].slice(0, 20)
  localStorage.setItem('diagram_history', JSON.stringify(history.value))
}

// 登录成功处理
const handleLoginSuccess = () => {
  isLoggedIn.value = true
  console.log('✅ 登录成功')
}

// 退出登录
const handleLogout = () => {
  removeToken()
  isLoggedIn.value = false
  console.log('🚪 已退出登录')
}

// AI 生成处理
const handleGenerate = async (prompt: string, model: string) => {
  isLoading.value = true
  try {
    console.log('🚀 开始生成图表:', { prompt, model, type: activeTab.value })
    
    // 调用后端 API
    const response = await generateDiagram({
      prompt,
      diagram_type: activeTab.value === DiagramType.MERMAID ? 'MERMAID' : 'EXCALIDRAW',
      model
    })
    
    console.log('✅ 生成成功:', response)
    
    if (activeTab.value === DiagramType.MERMAID) {
      const newState = { 
        ...diagramState.value, 
        mermaidCode: response.code, 
        title: prompt.slice(0, 50) 
      }
      diagramState.value = newState
      saveToHistory(newState)
      showCodeEditor.value = true
    }
  } catch (error) {
    console.error('❌ 生成失败:', error)
    const errorMessage = error instanceof Error ? error.message : '生成失败,请稍后重试'
    alert(errorMessage)
    
    // 如果是 401 错误，退出登录
    if (errorMessage.includes('登录已过期')) {
      handleLogout()
    }
  } finally {
    isLoading.value = false
  }
}

// 历史记录选择
const handleHistorySelect = (item: HistoryItem) => {
  activeTab.value = item.type
  diagramState.value = item.state
}

// 主题切换
const toggleTheme = () => {
  console.log('👆 点击主题切换按钮')
  console.log('📊 切换前:', isDarkMode.value)
  isDarkMode.value = !isDarkMode.value
  console.log('📊 切换后:', isDarkMode.value)
}
</script>

<template>
  <!-- 未登录状态：显示登录/注册页面 -->
  <Auth v-if="!isLoggedIn" :onSuccess="handleLoginSuccess" />
  
  <!-- 已登录状态：显示主应用 -->
  <div v-else class="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
    <!-- 1. 导航侧边栏 -->
    <Sidebar 
      :history="history"
      :activeTab="activeTab"
      :collapsed="isSidebarCollapsed"
      @select-history="handleHistorySelect"
      @tab-change="activeTab = $event"
      @toggle-collapse="isSidebarCollapsed = !isSidebarCollapsed"
      @logout="handleLogout"
    />

    <div class="flex-1 flex flex-col min-w-0">
      <Header 
        :title="diagramState.title"
        :isDarkMode="isDarkMode"
        @toggle-theme="toggleTheme"
      />
      
      <div class="flex-1 flex overflow-hidden">
        
        <!-- 2. 编辑面板 (提示词 + 代码) -->
        <div class="w-[400px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10 shadow-xl shrink-0 transition-colors duration-300">
          
          <!-- 提示词输入区域 -->
          <div class="flex-1 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[200px] flex flex-col overflow-y-auto">
            <PromptInput 
              :disabled="isLoading"
              @generate="handleGenerate"
            />
          </div>

          <!-- Mermaid 代码编辑器 (可折叠) -->
          <div v-if="activeTab === DiagramType.MERMAID" 
               :class="['flex flex-col bg-slate-50 dark:bg-slate-925 transition-all duration-300 border-t border-slate-200 dark:border-slate-800', showCodeEditor ? 'h-[50%]' : 'h-10']">
            
            <!-- 编辑器头部 - 模仿 Mermaid Live Editor -->
            <div class="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 select-none h-10 shrink-0 transition-colors">
              <div class="flex items-center gap-3" @click="showCodeEditor = !showCodeEditor">
                <div class="flex items-center gap-2 text-slate-600 dark:text-slate-300 cursor-pointer">
                  <Code2 :size="16" />
                  <span class="text-sm font-semibold">Code</span>
                </div>
              </div>

              <div v-if="showCodeEditor" class="flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-4 bg-blue-600 rounded-full relative cursor-pointer opacity-90 hover:opacity-100 transition-opacity">
                    <div class="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                  </div>
                  <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Auto-Sync</span>
                </div>
                <div class="w-[1px] h-4 bg-slate-300 dark:bg-slate-700"></div>
                <button class="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 text-xs">
                  <BookOpen :size="14" />
                  <span>Docs</span>
                </button>
                <button 
                  @click.stop="showCodeEditor = false"
                  class="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white ml-2"
                >
                  <X :size="16" />
                </button>
              </div>
              <button v-else @click="showCodeEditor = true" class="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
                <ChevronUp :size="16" />
              </button>
            </div>
            
            <!-- 代码文本区 -->
            <div v-if="showCodeEditor" class="flex-1 relative group bg-white dark:bg-[#0d1117]">
              <!-- 行号模拟 -->
              <div class="absolute left-0 top-0 bottom-0 w-8 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-600 text-xs font-mono pt-4 text-center select-none hidden sm:block transition-colors">
                <div v-for="(_, i) in diagramState.mermaidCode.split('\n')" :key="i" class="leading-relaxed">{{ i + 1 }}</div>
              </div>

              <textarea
                v-model="diagramState.mermaidCode"
                class="absolute inset-0 w-full h-full pl-2 sm:pl-10 p-4 bg-transparent text-slate-800 dark:text-slate-300 font-mono text-xs leading-relaxed resize-none focus:outline-none scrollbar-thin selection:bg-blue-100 dark:selection:bg-blue-900/40"
                spellcheck="false"
                placeholder="Enter Mermaid syntax here..."
              />
            </div>
          </div>
           
          <!-- Excalidraw 提示 -->
          <div v-if="activeTab === DiagramType.EXCALIDRAW" 
               class="p-8 flex flex-col items-center justify-center text-slate-500 text-center space-y-2 opacity-50 border-t border-slate-200 dark:border-slate-800">
            <p class="text-sm">Excalidraw Mode</p>
            <p class="text-xs">Use the canvas to edit elements directly.</p>
          </div>
        </div>

        <!-- 3. 画布区域 -->
        <div class="flex-1 relative bg-slate-100 dark:bg-slate-800 overflow-hidden flex flex-col transition-colors duration-300">
          <div v-if="isLoading" class="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
            <div class="flex flex-col items-center space-y-4">
              <div class="relative">
                <div class="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
                <Loader2 class="w-12 h-12 text-blue-500 animate-spin relative z-10" />
              </div>
              <p class="text-lg font-medium text-slate-900 dark:text-blue-100">Architecting Diagram...</p>
              <p class="text-sm text-slate-500 dark:text-slate-400">Translating your thoughts to structure</p>
            </div>
          </div>

          <div class="flex-1 w-full h-full relative">
            <MermaidEditor 
              v-if="activeTab === DiagramType.MERMAID"
              :code="diagramState.mermaidCode"
              :isDarkMode="isDarkMode"
              @update:code="diagramState.mermaidCode = $event"
            />
            <ExcalidrawWrapper 
              v-else
              :elements="diagramState.excalidrawElements"
              :isDarkMode="isDarkMode"
              @update:elements="diagramState.excalidrawElements = $event"
            />
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
/* 组件特定样式 */
</style>
