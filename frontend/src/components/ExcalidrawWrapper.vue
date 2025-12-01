<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount, markRaw, nextTick } from 'vue'
import { applyReactInVue } from 'veaury'
import type { ExcalidrawElement, AppState, BinaryFiles } from '../types'

interface Props {
  elements: ExcalidrawElement[]
  files?: BinaryFiles
  isDarkMode?: boolean
  initialAppState?: Partial<AppState>
}

const props = withDefaults(defineProps<Props>(), {
  isDarkMode: false
})

const emit = defineEmits<{
  'update:elements': [elements: ExcalidrawElement[]]
  'update:files': [files: BinaryFiles | null]
  'update:appState': [appState: Partial<AppState>]
}>()

const excalidrawAPI = ref<any>(null)
const ExcalidrawComponent = ref<any>(null)
const isLoading = ref(true)
let autoSaveTimer: number | null = null

// 动态加载 Excalidraw
onMounted(async () => {
  console.log('✅ ExcalidrawWrapper mounting...')
  try {
    const { Excalidraw } = await import('@excalidraw/excalidraw')
    ExcalidrawComponent.value = markRaw(applyReactInVue(Excalidraw))
    isLoading.value = false
    console.log('✅ Excalidraw loaded successfully')
  } catch (error) {
    console.error('❌ Failed to load Excalidraw:', error)
  }
  
  startAutoSave()
  window.addEventListener('beforeunload', autoSave)
})

// 自动保存到 localStorage
const autoSave = () => {
  if (!excalidrawAPI.value) return
  
  try {
    const elements = excalidrawAPI.value.getSceneElements()
    const appState = excalidrawAPI.value.getAppState()
    const files = excalidrawAPI.value.getFiles()
    
    const saveData = {
      elements,
      appState: {
        viewBackgroundColor: appState?.viewBackgroundColor,
        gridSize: appState?.gridSize,
        theme: appState?.theme
      },
      files,
      timestamp: Date.now()
    }
    
    localStorage.setItem('excalidraw_autosave', JSON.stringify(saveData))
  } catch (e) {
    console.error('自动保存失败:', e)
  }
}

// 定时自动保存（30秒）
const startAutoSave = () => {
  stopAutoSave()
  autoSaveTimer = window.setInterval(autoSave, 30000)
}

const stopAutoSave = () => {
  if (autoSaveTimer) {
    clearInterval(autoSaveTimer)
    autoSaveTimer = null
  }
}

// 组件卸载
onBeforeUnmount(() => {
  stopAutoSave()
  autoSave()
  window.removeEventListener('beforeunload', autoSave)
})

// 同步主题
watch(() => props.isDarkMode, (newVal) => {
  if (!excalidrawAPI.value) return
  
  const bgColor = newVal ? '#1e293b' : '#f1f5f9'
  
  excalidrawAPI.value.updateScene({
    appState: {
      viewBackgroundColor: bgColor,
      theme: newVal ? 'dark' : 'light',
    }
  })
})

// 同步元素 - 关键修复: 先重置再更新，避免 React-Vue 桥接的状态冲突
watch(() => props.elements, (newElements) => {
  console.log('🔄 [ExcalidrawWrapper] watch触发，elements数量:', newElements?.length || 0)
  console.log('🔍 [ExcalidrawWrapper] API状态:', excalidrawAPI.value ? '已就绪' : '未就绪')
  
  if (!excalidrawAPI.value) {
    console.warn('⚠️ [ExcalidrawWrapper] API未就绪，跳过更新')
    return
  }
  
  if (!newElements || newElements.length === 0) {
    console.warn('⚠️ [ExcalidrawWrapper] elements为空，跳过更新')
    return
  }
  
  console.log('✅ [ExcalidrawWrapper] 开始更新场景，elements数量:', newElements.length)
  console.log('📊 [ExcalidrawWrapper] 第一个元素类型:', newElements[0]?.type)
  
  // 关键修复: 使用 setTimeout 延迟更新，确保 React 组件完全就绪
  setTimeout(() => {
    if (!excalidrawAPI.value) return
    
    console.log('🔄 [ExcalidrawWrapper] 开始执行 resetScene + updateScene')
    
    // 步骤1: 先重置场景(清空 React 内部状态)
    excalidrawAPI.value.resetScene()
    
    // 步骤2: 使用 requestAnimationFrame 确保在下一帧更新
    requestAnimationFrame(() => {
      if (!excalidrawAPI.value) return
      
      // 步骤3: 更新场景元素
      excalidrawAPI.value.updateScene({ 
        elements: newElements
      })
      console.log('✅ [ExcalidrawWrapper] updateScene完成')
      
      // 步骤4: 再次使用 RAF 确保元素已渲染后再滚动
      requestAnimationFrame(() => {
        if (!excalidrawAPI.value) return
        
        const sceneElements = excalidrawAPI.value.getSceneElements()
        console.log('📏 [ExcalidrawWrapper] 场景中的元素数量:', sceneElements.length)
        
        if (sceneElements.length > 0) {
          excalidrawAPI.value.scrollToContent(sceneElements, { fitToContent: true })
          console.log('✅ [ExcalidrawWrapper] scrollToContent完成')
        }
        
        // 步骤5: 添加文件
        if (props.files) {
          excalidrawAPI.value.addFiles(Object.values(props.files))
          console.log('✅ [ExcalidrawWrapper] addFiles完成')
        }
      })
    })
  }, 100) // 延迟100ms，确保 React-Vue 桥接完成
}, { deep: true, flush: 'post' })

// 监听变化并触发 emit
const handleChange = (elements: any, state: any, files: any) => {
  // 防止初始化时空数组覆盖已有元素
  // 如果当前 props 有元素但传入的 elements 为空，不触发更新
  if (props.elements && props.elements.length > 0 && (!elements || elements.length === 0)) {
    console.log('🚫 [ExcalidrawWrapper] 忽略空数组change事件，防止覆盖现有元素')
    return
  }
  
  console.log('🔄 [ExcalidrawWrapper] handleChange，elements数量:', elements?.length || 0)
  emit('update:elements', elements)
  if (files) {
    emit('update:files', files)
  }
  if (state) {
    emit('update:appState', state)
  }
}

// 处理 API 回调 - 关键修复: 延迟更新避免 React-Vue 桥接时序问题
const handleExcalidrawAPI = (api: any) => {
  excalidrawAPI.value = api
  console.log('✅ [ExcalidrawWrapper] Excalidraw API ready')
  console.log('📊 [ExcalidrawWrapper] 当前props.elements数量:', props.elements?.length || 0)
  
  // API就绪后，如果 props 已有元素，延迟更新场景
  if (props.elements && props.elements.length > 0) {
    console.log('🔄 [ExcalidrawWrapper] API就绪，延迟更新现有元素:', props.elements.length)
    
    // 关键修复: 使用 setTimeout + RAF 确保 React 组件完全就绪
    setTimeout(() => {
      if (!api) return
      
      console.log('🔄 [ExcalidrawWrapper] API就绪时 resetScene')
      api.resetScene()
      
      requestAnimationFrame(() => {
        if (!api) return
        
        api.updateScene({ elements: props.elements })
        console.log('✅ [ExcalidrawWrapper] API就绪时updateScene完成')
        
        requestAnimationFrame(() => {
          if (!api) return
          
          const sceneElements = api.getSceneElements()
          console.log('📏 [ExcalidrawWrapper] API就绪时场景元素数量:', sceneElements.length)
          
          if (sceneElements.length > 0) {
            api.scrollToContent(sceneElements, { fitToContent: true })
            console.log('✅ [ExcalidrawWrapper] API就绪时scrollToContent完成')
          }
        })
      })
    }, 150) // 延迟150ms，确保 React 组件完全挂载
  }
}
</script>

<template>
  <div class="absolute inset-0 w-full h-full overflow-hidden bg-slate-100 dark:bg-[#1e293b]">
    <!-- 加载中 -->
    <div v-if="isLoading" class="flex items-center justify-center w-full h-full">
      <div class="text-slate-500 dark:text-slate-400">
        Loading Excalidraw...
      </div>
    </div>
    
    <!-- Excalidraw 组件 -->
    <component
      v-else-if="ExcalidrawComponent"
      :is="ExcalidrawComponent"
      :excalidrawAPI="handleExcalidrawAPI"
      :theme="isDarkMode ? 'dark' : 'light'"
      :langCode="'zh-CN'"
      :initialData="{
        appState: {
          viewBackgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
          currentItemFontFamily: 1,
          theme: isDarkMode ? 'dark' : 'light',
          ...(initialAppState || {})
        }
      }"
      :UIOptions="{
        canvasActions: {
          changeViewBackgroundColor: true,
          clearCanvas: true,
          export: { saveFileToDisk: true },
          saveAsImage: true,
          theme: true
        },
        tools: {
          image: true
        }
      }"
      @change="handleChange"
    />
  </div>
</template>
