<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import mermaid from 'mermaid'
import { Download, ZoomIn, ZoomOut, Maximize, AlertCircle, Palette, ArrowRight, FileText, Image, FileDown, Plus, GitBranch, Square } from 'lucide-vue-next'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { saveAs } from 'file-saver'

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

// Mermaid 主题和方向
const currentTheme = ref<'default' | 'dark' | 'forest' | 'neutral' | 'base'>('default')
const currentDirection = ref<string>('TD')
const showThemeMenu = ref(false)
const showDirectionMenu = ref(false)
const showExportMenu = ref(false)

const themes = [
  { value: 'default', label: '默认', color: '#1f77b4' },
  { value: 'dark', label: '深色', color: '#2b2b2b' },
  { value: 'forest', label: '森林', color: '#228b22' },
  { value: 'neutral', label: '中性', color: '#64748b' },
  { value: 'base', label: '基础', color: '#6366f1' }
]

const directions = [
  { value: 'TD', label: '上到下' },
  { value: 'TB', label: '上到下' },
  { value: 'BT', label: '下到上' },
  { value: 'LR', label: '左到右' },
  { value: 'RL', label: '右到左' }
]

// 编辑功能
const showEditMenu = ref(false)
const nodeCounter = ref(1)

// 文本编辑功能
const isEditingText = ref(false)
const editingNodeId = ref<string>('')
const editingText = ref('')
const editPosition = ref({ x: 0, y: 0 })

// 初始化 Mermaid
onMounted(() => {
  mermaid.initialize({
    startOnLoad: false,
    theme: currentTheme.value,
    securityLevel: 'loose',
    fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    themeVariables: {
      primaryColor: '#4f46e5',
      primaryTextColor: '#fff',
      primaryBorderColor: '#6366f1',
      lineColor: '#94a3b8',
      secondaryColor: '#06b6d4',
      tertiaryColor: '#f59e0b',
    }
  })
  renderDiagram()

  // 初次绑定双击事件
  nextTick(() => {
    bindDoubleClickEvent()
  })
})

// 监听代码变化
watch(() => props.code, () => {
  renderDiagram()
})

// 监听主题变化
watch(currentTheme, (newVal) => {
  const themeVariables: Record<string, any> = {
    primaryColor: '#4f46e5',
    primaryTextColor: '#fff',
    primaryBorderColor: '#6366f1',
    lineColor: '#94a3b8',
    secondaryColor: '#06b6d4',
    tertiaryColor: '#f59e0b',
  }

  // 根据不同主题调整颜色
  if (newVal === 'forest') {
    themeVariables.primaryColor = '#10b981'
    themeVariables.secondaryColor = '#059669'
    themeVariables.tertiaryColor = '#84cc16'
  } else if (newVal === 'dark') {
    themeVariables.primaryColor = '#6366f1'
    themeVariables.secondaryColor = '#8b5cf6'
    themeVariables.tertiaryColor = '#ec4899'
  }

  mermaid.initialize({
    startOnLoad: false,
    theme: newVal,
    securityLevel: 'loose',
    themeVariables
  })
  renderDiagram()
})

// 监听方向变化
watch(currentDirection, () => {
  updateDiagramDirection()
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
    
    // 重新绑定双击事件
    nextTick(() => {
      bindDoubleClickEvent()
    })
  } catch (err: any) {
    console.error('Mermaid render error:', err)
    error.value = err?.message || '语法错误'
  }
}

// 更新图表方向
const updateDiagramDirection = () => {
  if (!props.code) return
  
  // 修改第一行的方向定义
  const lines = props.code.split('\n')
  const firstLine = lines[0]
  
  // 匹配 graph/flowchart 类型
  const graphMatch = firstLine.match(/^(graph|flowchart)\s+(TD|TB|BT|LR|RL)/)
  
  if (graphMatch) {
    lines[0] = `${graphMatch[1]} ${currentDirection.value}`
    const newCode = lines.join('\n')
    emit('update:code', newCode)
  }
}

// 切换主题
const changeTheme = (theme: 'default' | 'dark' | 'forest' | 'neutral' | 'base') => {
  currentTheme.value = theme
  showThemeMenu.value = false
}

// 切换方向
const changeDirection = (direction: string) => {
  currentDirection.value = direction
  showDirectionMenu.value = false
}

// 增加节点
const addNode = (shape: string = 'rectangle') => {
  const newNodeId = `Node${nodeCounter.value++}`
  let newNodeCode = ''
  
  switch(shape) {
    case 'rectangle':
      newNodeCode = `\n    ${newNodeId}[新节点]`
      break
    case 'rounded':
      newNodeCode = `\n    ${newNodeId}(圆角节点)`
      break
    case 'circle':
      newNodeCode = `\n    ${newNodeId}((圆形))`
      break
    case 'diamond':
      newNodeCode = `\n    ${newNodeId}{菱形}`
      break
    case 'hexagon':
      newNodeCode = `\n    ${newNodeId}{{六边形}}`
      break
    default:
      newNodeCode = `\n    ${newNodeId}[新节点]`
  }
  
  const newCode = props.code + newNodeCode
  emit('update:code', newCode)
  showEditMenu.value = false
}

// 增加连线
const addConnection = (style: string = 'arrow') => {
  const lines = props.code.split('\n')
  // 查找最后两个节点
  const nodeRegex = /(\w+)[(\[{]/g
  const nodes: string[] = []
  props.code.replace(nodeRegex, (match, p1) => {
    nodes.push(p1)
    return match
  })
  
  if (nodes.length >= 2) {
    const lastNode = nodes[nodes.length - 1]
    const secondLastNode = nodes[nodes.length - 2]
    let connection = ''
    
    switch(style) {
      case 'arrow':
        connection = `\n    ${secondLastNode} --> ${lastNode}`
        break
      case 'line':
        connection = `\n    ${secondLastNode} --- ${lastNode}`
        break
      case 'dotted':
        connection = `\n    ${secondLastNode} -.-> ${lastNode}`
        break
      case 'thick':
        connection = `\n    ${secondLastNode} ==> ${lastNode}`
        break
      default:
        connection = `\n    ${secondLastNode} --> ${lastNode}`
    }
    
    const newCode = props.code + connection
    emit('update:code', newCode)
  }
  showEditMenu.value = false
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
  saveAs(blob, 'mermaid-diagram.svg')
  showExportMenu.value = false
}

// 导出 PNG
const downloadPNG = async () => {
  if (!svgContent.value) {
    alert('没有图表内容')
    return
  }
  
  try {
    showExportMenu.value = false
    
    // 创建一个临时 SVG 元素
    const parser = new DOMParser()
    const svgDoc = parser.parseFromString(svgContent.value, 'image/svg+xml')
    const svgElement = svgDoc.documentElement as unknown as SVGSVGElement
    
    // 获取 SVG 实际内容边界
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.visibility = 'hidden'
    tempDiv.innerHTML = svgContent.value
    document.body.appendChild(tempDiv)
    
    const tempSvg = tempDiv.querySelector('svg') as SVGSVGElement
    if (!tempSvg) {
      document.body.removeChild(tempDiv)
      alert('SVG 解析失败')
      return
    }
    
    // 获取实际边界框
    const bbox = tempSvg.getBBox()
    const padding = 20 // 添加一些内边距
    const svgWidth = bbox.width + padding * 2
    const svgHeight = bbox.height + padding * 2
    
    // 设置 viewBox 以包含所有内容
    tempSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${svgWidth} ${svgHeight}`)
    tempSvg.setAttribute('width', String(svgWidth))
    tempSvg.setAttribute('height', String(svgHeight))
    
    // 创建 canvas
    const canvas = document.createElement('canvas')
    const scale = 2 // 高清导出
    canvas.width = svgWidth * scale
    canvas.height = svgHeight * scale
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      document.body.removeChild(tempDiv)
      alert('Canvas 创建失败')
      return
    }
    
    ctx.scale(scale, scale)
    
    // 将 SVG 转换为 Data URI
    const img = document.createElement('img') as HTMLImageElement
    const svgData = new XMLSerializer().serializeToString(tempSvg)
    const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0)
        document.body.removeChild(tempDiv)
        
        // 导出 PNG
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, 'mermaid-diagram.png')
          } else {
            alert('PNG 生成失败')
          }
        })
      } catch (err) {
        document.body.removeChild(tempDiv)
        console.error('Canvas draw error:', err)
        alert('PNG 导出失败: ' + err)
      }
    }
    
    img.onerror = (err) => {
      document.body.removeChild(tempDiv)
      console.error('Image load error:', err)
      alert('PNG 导出失败: 图片加载错误')
    }
    
    img.src = svgDataUri
  } catch (error) {
    console.error('PNG export failed:', error)
    alert('PNG 导出失败: ' + error)
  }
}

// 导出 PDF - 使用 Canvas 转 PNG 再嵌入 PDF
const downloadPDF = async () => {
  if (!svgContent.value) {
    alert('没有图表内容')
    return
  }
  
  try {
    showExportMenu.value = false
    
    // 创建临时 SVG 元素获取实际边界
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.visibility = 'hidden'
    tempDiv.innerHTML = svgContent.value
    document.body.appendChild(tempDiv)
    
    const tempSvg = tempDiv.querySelector('svg') as SVGSVGElement
    if (!tempSvg) {
      document.body.removeChild(tempDiv)
      alert('SVG 解析失败')
      return
    }
    
    // 获取实际边界框
    const bbox = tempSvg.getBBox()
    const padding = 20
    const svgWidth = bbox.width + padding * 2
    const svgHeight = bbox.height + padding * 2
    
    // 设置 viewBox
    tempSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${svgWidth} ${svgHeight}`)
    tempSvg.setAttribute('width', String(svgWidth))
    tempSvg.setAttribute('height', String(svgHeight))
    
    // 创建 canvas 进行转换
    const canvas = document.createElement('canvas')
    const scale = 2 // 高清
    canvas.width = svgWidth * scale
    canvas.height = svgHeight * scale
    
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      document.body.removeChild(tempDiv)
      alert('Canvas 创建失败')
      return
    }
    
    // 白色背景
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.scale(scale, scale)
    
    // SVG 转 Data URI
    const svgData = new XMLSerializer().serializeToString(tempSvg)
    const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
    
    const img = document.createElement('img') as HTMLImageElement
    
    img.onload = () => {
      try {
        ctx.drawImage(img, 0, 0)
        document.body.removeChild(tempDiv)
        
        // 创建 PDF
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: svgWidth > svgHeight ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [svgWidth, svgHeight]
        })
        
        pdf.addImage(imgData, 'PNG', 0, 0, svgWidth, svgHeight)
        pdf.save('mermaid-diagram.pdf')
      } catch (err) {
        document.body.removeChild(tempDiv)
        console.error('PDF generation error:', err)
        alert('PDF 导出失败: ' + err)
      }
    }
    
    img.onerror = (err) => {
      document.body.removeChild(tempDiv)
      console.error('Image load error:', err)
      alert('PDF 导出失败: 图片加载错误')
    }
    
    img.src = svgDataUri
  } catch (error) {
    console.error('PDF export failed:', error)
    alert('PDF 导出失败: ' + error)
  }
}

// 重置视图
const resetView = () => {
  scale.value = 1
  position.value = { x: 0, y: 0 }
}

// 绑定双击事件
const bindDoubleClickEvent = () => {
  if (containerRef.value) {
    // 移除旧的监听器避免重复绑定
    containerRef.value.removeEventListener('dblclick', handleDoubleClick)
    // 添加新的监听器
    containerRef.value.addEventListener('dblclick', handleDoubleClick)
  }
}

// 双击编辑节点文本
const handleDoubleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  
  // 查找最近的节点元素或文本元素
  let nodeElement: HTMLElement | null = target
  
  // 向上遍历寻找 .node 类或包含文本的元素
  let searchDepth = 0
  const maxDepth = 10
  while (nodeElement && 
         !nodeElement.classList.contains('node') && 
         !nodeElement.classList.contains('nodeLabel') &&
         nodeElement.tagName !== 'text' &&
         nodeElement.tagName !== 'tspan' &&
         searchDepth < maxDepth) {
    nodeElement = nodeElement.parentElement
    searchDepth++
  }
  
  if (!nodeElement) return
  
  // 如果点击的是 nodeLabel 或 text 或 tspan,找到其父 .node 节点
  if (nodeElement.classList.contains('nodeLabel') || 
      nodeElement.tagName === 'text' || 
      nodeElement.tagName === 'tspan') {
    let parent = nodeElement.parentElement
    let parentSearchDepth = 0
    while (parent && !parent.classList.contains('node') && parentSearchDepth < maxDepth) {
      parent = parent.parentElement
      parentSearchDepth++
    }
    if (parent && parent.classList.contains('node')) {
      // 获取文本内容
      const currentText = nodeElement.textContent?.trim() || ''
      if (!currentText) return
      
      // 匹配代码
      if (!matchAndEditNode(currentText)) return
      return
    }
  }
  
  // 如果点击的是 .node 节点,寻找其中的文本
  if (nodeElement.classList.contains('node')) {
    let textElement = nodeElement.querySelector('.nodeLabel')
    if (!textElement) textElement = nodeElement.querySelector('text')
    if (!textElement) textElement = nodeElement.querySelector('tspan')
    if (!textElement) textElement = nodeElement.querySelector('span')
    
    if (!textElement) return
    
    const currentText = textElement.textContent?.trim() || ''
    if (!currentText) return
    
    // 匹配代码
    if (!matchAndEditNode(currentText)) return
  }
}

// 匹配并编辑节点
const matchAndEditNode = (currentText: string): boolean => {
  // 更宽松的正则匹配,支持所有节点类型
  const escapedText = currentText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    // 标准格式: A[文本]
    new RegExp(`(\\w+)\\[${escapedText}\\]`, 'i'),
    // 圆角: A(文本)
    new RegExp(`(\\w+)\\(${escapedText}\\)`, 'i'),
    // 圆形: A((文本))
    new RegExp(`(\\w+)\\(\\(${escapedText}\\)\\)`, 'i'),
    // 菱形: A{文本}
    new RegExp(`(\\w+)\\{${escapedText}\\}`, 'i'),
    // 六边形: A{{文本}}
    new RegExp(`(\\w+)\\{\\{${escapedText}\\}\\}`, 'i'),
    // 通用匹配
    new RegExp(`(\\w+)[\\[(\\{]+${escapedText}[\\])\\}]+`, 'i')
  ]
  
  let nodeMatch = null
  for (const pattern of patterns) {
    nodeMatch = props.code.match(pattern)
    if (nodeMatch) break
  }
  
  if (!nodeMatch) {
    console.warn('未找到匹配的节点:', currentText)
    return false
  }
  
  editingNodeId.value = nodeMatch[1]
  editingText.value = currentText
  
  // 弹窗居中显示
  isEditingText.value = true
  
  // 聚焦输入框
  nextTick(() => {
    const input = document.querySelector('.text-edit-input') as HTMLInputElement
    if (input) {
      input.focus()
      input.select()
    }
  })
  
  return true
}

// 保存文本编辑
const saveTextEdit = () => {
  if (!editingNodeId.value || !isEditingText.value) return
  
  const newText = editingText.value.trim()
  if (!newText) {
    cancelTextEdit()
    return
  }
  
  // 更新代码
  const nodePattern = new RegExp(
    `(${editingNodeId.value})[\\[(\\{]+([^\\])\\}]+)[\\])\\}]+`,
    'g'
  )
  
  let updatedCode = props.code.replace(nodePattern, (match, id, oldText) => {
    // 保留原有形状符号
    const openChar = match.match(/[\[(\{]+/)?.[0] || '['
    const closeChar = openChar === '[[' ? ']]' : 
                      openChar === '((' ? '))' : 
                      openChar === '{{' ? '}}' :
                      openChar === '{' ? '}' :
                      openChar === '(' ? ')' : ']'
    return `${id}${openChar}${newText}${closeChar}`
  })
  
  emit('update:code', updatedCode)
  cancelTextEdit()
}

// 取消文本编辑
const cancelTextEdit = () => {
  isEditingText.value = false
  editingNodeId.value = ''
  editingText.value = ''
}

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    saveTextEdit()
  } else if (e.key === 'Escape') {
    cancelTextEdit()
  }
}
</script>

<template>
  <div class="w-full h-full relative bg-slate-100 dark:bg-[#1e293b] overflow-hidden select-none transition-colors duration-300">
    <!-- 背景网格 -->
    <div class="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none"></div>
    
    <!-- 工具栏 -->
    <div class="absolute top-6 left-1/2 -translate-x-1/2 z-30">
      <div class="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-2">
        
        <!-- 主题切换 -->
        <div class="relative">
          <button 
            @click="showThemeMenu = !showThemeMenu"
            class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors flex items-center gap-1"
            title="主题"
          >
            <Palette :size="18" />
          </button>
          <div v-if="showThemeMenu" class="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[140px] z-50">
            <button 
              v-for="theme in themes" 
              :key="theme.value"
              @click="changeTheme(theme.value as any)"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between gap-2"
              :class="currentTheme === theme.value ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'"
            >
              <span>{{ theme.label }}</span>
              <span class="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600" :style="{ backgroundColor: theme.color }"></span>
            </button>
          </div>
        </div>

        <!-- 方向切换 -->
        <div class="relative">
          <button 
            @click="showDirectionMenu = !showDirectionMenu"
            class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="方向"
          >
            <ArrowRight :size="18" />
          </button>
          <div v-if="showDirectionMenu" class="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[120px] z-50">
            <button 
              v-for="dir in directions" 
              :key="dir.value"
              @click="changeDirection(dir.value)"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              :class="currentDirection === dir.value ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-700 dark:text-slate-300'"
            >
              {{ dir.label }}
            </button>
          </div>
        </div>

        <!-- 导出按钮 -->
        <div class="relative">
          <button 
            @click="showExportMenu = !showExportMenu"
            class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="导出"
          >
            <Download :size="18" />
          </button>
          <div v-if="showExportMenu" class="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[140px] z-50">
            <button 
              @click="downloadSVG"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <FileText :size="16" />
              SVG
            </button>
            <button 
              @click="downloadPNG"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <Image :size="16" />
              PNG
            </button>
            <button 
              @click="downloadPDF"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <FileDown :size="16" />
              PDF
            </button>
          </div>
        </div>

        <!-- 编辑功能 -->
        <div class="relative">
          <button 
            @click="showEditMenu = !showEditMenu"
            class="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title="编辑"
          >
            <Plus :size="18" />
          </button>
          <div v-if="showEditMenu" class="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-2 min-w-[180px] z-50">
            <div class="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">增加节点</div>
            <button 
              @click="addNode('rectangle')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <Square :size="14" />
              矩形
            </button>
            <button 
              @click="addNode('rounded')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              圆角矩形
            </button>
            <button 
              @click="addNode('circle')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              圆形
            </button>
            <button 
              @click="addNode('diamond')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              菱形
            </button>
            <button 
              @click="addNode('hexagon')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              六边形
            </button>
            
            <div class="border-t border-slate-200 dark:border-slate-700 my-1"></div>
            <div class="px-3 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400">增加连线</div>
            <button 
              @click="addConnection('arrow')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <GitBranch :size="14" />
              箭头
            </button>
            <button 
              @click="addConnection('line')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              直线
            </button>
            <button 
              @click="addConnection('dotted')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              虚线
            </button>
            <button 
              @click="addConnection('thick')"
              class="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
            >
              粗箭头
            </button>
          </div>
        </div>
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
        class="flex items-center justify-center relative"
        v-html="svgContent"
      />
    </div>

    <!-- 文本编辑弹窗 -->
    <div 
      v-if="isEditingText" 
      class="fixed inset-0 z-50 flex items-center justify-center"
      style="background: rgba(0,0,0,0.3); backdrop-filter: blur(2px);"
      @click.self="cancelTextEdit"
    >
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-blue-500 dark:border-blue-400 p-6 min-w-[320px] max-w-md animate-in fade-in zoom-in duration-200">
        <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">编辑节点文字</h3>
        
        <input 
          v-model="editingText"
          @keydown="handleKeyDown"
          class="text-edit-input w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
          placeholder="输入文本..."
          autofocus
        />
        
        <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div class="text-xs text-slate-500 dark:text-slate-400">
            <kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">Enter</kbd> 保存
            <span class="mx-2">·</span>
            <kbd class="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd> 取消
          </div>
          
          <div class="flex gap-2">
            <button 
              @click="cancelTextEdit"
              class="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              取消
            </button>
            <button 
              @click="saveTextEdit"
              class="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
