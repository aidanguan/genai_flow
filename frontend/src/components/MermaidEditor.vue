<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import mermaid from 'mermaid'
import { Download, ZoomIn, ZoomOut, Maximize, AlertCircle } from 'lucide-vue-next'

interface Props {
  code: string
  isDarkMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDarkMode: false
})

const emit = defineEmits<{
  'update:code': [code: string]
}>()

const containerRef = ref<HTMLDivElement>()
const error = ref<string | null>(null)
const svgContent = ref('')
const scale = ref(1)
const position = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

// 初始化 Mermaid
onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: props.isDarkMode ? 'dark' : 'default',
    securityLevel: 'loose',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
  })
  renderDiagram()
})

// 监听代码变化
watch(() => props.code, () => {
  renderDiagram()
})

// 监听主题变化
watch(() => props.isDarkMode, (newVal) => {
  mermaid.initialize({
    startOnLoad: false,
    theme: newVal ? 'dark' : 'default',
    securityLevel: 'loose',
  })
  renderDiagram()
})

// 渲染图形
const renderDiagram = async () => {
  if (!props.code.trim()) {
    svgContent.value = ''
    error.value = null
    return
  }

  try {
    error.value = null
    const id = `mermaid-${Date.now()}`
    const { svg } = await mermaid.render(id, props.code)
    svgContent.value = svg
  } catch (err: any) {
    console.error('Mermaid render error:', err)
    error.value = err?.message || '语法错误'
  }
}

// 鼠标拖动
const handleMouseDown = (e: MouseEvent) => {
  isDragging.value = true
  dragStart.value = { x: e.clientX - position.value.x, y: e.clientY - position.value.y }
}

const handleMouseMove = (e: MouseEvent) => {
  if (isDragging.value) {
    position.value = {
      x: e.clientX - dragStart.value.x,
      y: e.clientY - dragStart.value.y
    }
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

// 导出 SVG
const downloadSVG = () => {
  if (!svgContent.value) return
  const blob = new Blob([svgContent.value], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'diagram.svg'
  a.click()
  URL.revokeObjectURL(url)
}

// 重置视图
const resetView = () => {
  scale.value = 1
  position.value = { x: 0, y: 0 }
}
</script>

<template>
  <div class="w-full h-full relative bg-slate-100 dark:bg-[#1e293b] overflow-hidden select-none transition-colors duration-300">
    <!-- 背景网格 -->
    <div class="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none"></div>
    
    <!-- 工具栏 -->
    <div class="absolute top-6 left-1/2 -translate-x-1/2 z-30">
      <div class="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-2">
        <button 
          @click="downloadSVG"
          class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
          title="导出 SVG"
        >
          <Download :size="18" />
        </button>
      </div>
    </div>

    <!-- 缩放控制 -->
    <div class="absolute bottom-6 right-6 z-30 flex gap-2">
      <div class="flex items-center bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl overflow-hidden">
        <button 
          @click="scale = Math.max(0.1, scale - 0.1)" 
          class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          <ZoomOut :size="18" />
        </button>
        <button 
          @click="resetView" 
          class="p-2 px-3 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono font-medium border-x border-slate-200 dark:border-slate-700 min-w-[3rem]"
        >
          {{ Math.round(scale * 100) }}%
        </button>
        <button 
          @click="scale = Math.min(5, scale + 0.1)" 
          class="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        >
          <ZoomIn :size="18" />
        </button>
      </div>
      
      <button 
        @click="resetView" 
        class="bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg p-2 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-600 dark:text-slate-300"
      >
        <Maximize :size="18" />
      </button>
    </div>

    <!-- 画布 -->
    <div 
      class="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div v-if="error" class="flex flex-col items-center text-red-500 dark:text-red-400 gap-3 p-8 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-red-200 dark:border-red-900/30 backdrop-blur-sm shadow-2xl">
        <AlertCircle :size="32" />
        <div class="text-center max-w-sm">
          <p class="font-bold text-lg mb-2">渲染失败</p>
          <p class="text-sm opacity-80 font-mono bg-red-50 dark:bg-slate-900 p-2 rounded">{{ error }}</p>
        </div>
      </div>
      <div 
        v-else
        ref="containerRef"
        :style="{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDragging ? 'none' : 'transform 0.1s ease-out',
          transformOrigin: 'center'
        }"
        class="flex items-center justify-center"
        v-html="svgContent"
      />
    </div>
  </div>
</template>
