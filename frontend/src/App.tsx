import React, { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { DiagramType } from './types'
import type { DiagramState, HistoryItem, ExcalidrawElement, BinaryFiles, AppState } from './types'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import PromptInput from './components/PromptInput'
import MermaidEditor from './components/MermaidEditor'
import ExcalidrawWrapper from './components/ExcalidrawWrapper'
import { generateDiagram, isAuthenticated, removeToken } from './api'
import { convertMermaidToExcalidraw, getErrorMessage } from './services/mermaidConverter'

// 验证并过滤 Excalidraw 元素，确保数据完整性
function validateAndFilterElements(elements: any[]): ExcalidrawElement[] {
  if (!Array.isArray(elements)) {
    console.error('❗ 元素数据不是数组')
    return []
  }

  const validated: any[] = []
  
  elements.forEach((element: any, index: number) => {
    // 基本字段验证
    if (!element || typeof element !== 'object') {
      console.warn(`⚠️ [元素${index}] 无效元素:`, element)
      return
    }

    // 必须字段检查（放宽条件，只检查最基本的）
    if (!element.type) {
      console.warn(`⚠️ [元素${index}] 缺少 type 字段:`, element)
      return
    }

    // 转换后端自定义格式到 Excalidraw 格式
    const converted: any = {
      id: element.id || `generated-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: element.type,
      x: element.x ?? 0,
      y: element.y ?? 0,
      width: element.width ?? 100,
      height: element.height ?? 100,
      angle: element.angle || 0,
      strokeColor: element.strokeColor || '#000000',
      backgroundColor: element.backgroundColor || 'transparent',
      fillStyle: element.fillStyle || 'solid',
      strokeWidth: element.strokeWidth || 2,
      strokeStyle: element.strokeStyle || 'solid',
      roughness: element.roughness || 1,
      opacity: element.opacity || 100,
      groupIds: element.groupIds || [],
      frameId: element.frameId || null,
      roundness: element.roundness || null,
      seed: element.seed || Math.floor(Math.random() * 2147483647),
      version: element.version || 1,
      versionNonce: element.versionNonce || Math.floor(Math.random() * 2147483647),
      isDeleted: element.isDeleted || false,
      boundElements: element.boundElements || null,
      updated: element.updated || Date.now(),
      link: element.link || null,
      locked: element.locked || false,
    }

    // 处理线条/箭头元素
    if (element.type === 'line' || element.type === 'arrow') {
      if (element.points && Array.isArray(element.points)) {
        // 已有 points
        converted.points = element.points
      } else if (element.startX !== undefined && element.startY !== undefined && 
                 element.endX !== undefined && element.endY !== undefined) {
        // 从 startX/Y 和 endX/Y 生成 points（相对坐标）
        converted.points = [
          [0, 0],
          [element.endX - element.startX, element.endY - element.startY]
        ]
        converted.x = element.startX
        converted.y = element.startY
        converted.width = Math.abs(element.endX - element.startX)
        converted.height = Math.abs(element.endY - element.startY)
      } else {
        // 生成默认 points
        converted.points = [[0, 0], [100, 0]]
      }
    }

    // 处理文本元素
    if (element.type === 'text') {
      converted.text = element.text || element.label || ''
      converted.fontSize = element.fontSize || 20
      converted.fontFamily = element.fontFamily || 1
      // 如果是绑定到容器的文本,默认居中对齐
      converted.textAlign = element.textAlign || (element.containerId ? 'center' : 'left')
      converted.verticalAlign = element.verticalAlign || (element.containerId ? 'middle' : 'top')
      converted.baseline = element.baseline || 18
      converted.containerId = element.containerId || null
      converted.originalText = converted.text
      converted.lineHeight = element.lineHeight || 1.25
    }

    // 为带有 label 的形状元素创建独立的文本元素
    // Excalidraw 不支持在形状上直接使用 label，需要创建独立的 text 元素并绑定
    if (element.label && element.type !== 'text' && element.type !== 'line' && element.type !== 'arrow') {
      const textId = `text-${converted.id}`
      
      // 关键：建立双向绑定
      // 1. 形状元素的 boundElements 引用文本元素
      converted.boundElements = [{ type: 'text', id: textId }]
      
      // 计算文本的实际宽高
      // 使用 Canvas API 精确测量文本宽度
      const fontSize = 14  // 字号14比较合适
      
      // 创建临时 canvas 来测量文本
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      let textWidth = 20 // 默认最小宽度
      
      if (context) {
        // 设置字体（需要与 Excalidraw 使用的字体一致）
        context.font = `${fontSize}px Virgil, Segoe UI Emoji`
        const metrics = context.measureText(element.label)
        // 适度的padding（30%），主要通过约束AI生成的文字长度来解决
        textWidth = Math.max(metrics.width * 1.3, 20)
      } else {
        // 如果无法获取 context，使用改进的估算
        textWidth = Math.max(element.label.length * fontSize * 1.0, 20)
      }
      
      const textHeight = fontSize * 1.25 // 正常行高
      
      const textElement: any = {
        id: textId,
        type: 'text',
        text: element.label,
        // 绑定文本的坐标：计算文本左上角位置，确保文本居中
        // 根据 Excalidraw 源码，当 textAlign='center' 和 verticalAlign='middle' 时
        // 文本的 x,y 应该是文本元素的左上角坐标，而不是中心点
        x: converted.x + (converted.width / 2 - textWidth / 2),
        y: converted.y + (converted.height / 2 - textHeight / 2),
        // 使用测量的文本实际宽高
        width: textWidth,
        height: textHeight,
        angle: 0,
        strokeColor: '#000000',
        backgroundColor: 'transparent',
        fillStyle: 'solid',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: null,
        seed: Math.floor(Math.random() * 2147483647),
        version: 1,
        versionNonce: Math.floor(Math.random() * 2147483647),
        isDeleted: false,
        boundElements: null,
        updated: Date.now(),
        link: null,
        locked: false,
        fontSize: fontSize,
        fontFamily: 1,
        textAlign: 'center',
        verticalAlign: 'middle',
        baseline: fontSize * 0.9,
        // 2. 文本元素的 containerId 指向形状元素
        containerId: converted.id,
        originalText: element.label,
        lineHeight: 1.25,
      }
      
      console.log(`📝 [元素${index}] 创建绑定文本:`, {
        shapeId: converted.id,
        textId: textId,
        label: element.label,
        双向绑定: '✓'
      })
      
      validated.push(converted)
      validated.push(textElement)
    } else {
      validated.push(converted)
    }

    console.log(`✅ [元素${index}] 转换完成:`, {
      type: converted.type,
      id: converted.id,
      position: `(${converted.x}, ${converted.y})`,
      size: `${converted.width}x${converted.height}`,
      hasLabel: !!element.label
    })
  })

  console.log(`📊 验证统计: 原始 ${elements.length} 个，转换 ${validated.length} 个`)
  return validated as ExcalidrawElement[]
}

export default function App() {
  // 状态管理
  const [isLoggedIn, setIsLoggedIn] = useState(true) // 临时跳过登录
  const [activeTab, setActiveTab] = useState<DiagramType>(DiagramType.MERMAID)
  const [isLoading, setIsLoading] = useState(false)
  const [diagramState, setDiagramState] = useState<DiagramState>({
    mermaidCode: `graph TD
    A[Start] --> B{Is it working?}
    B -- Yes --> C[Great!]
    B -- No --> D[Debug]`,
    excalidrawElements: [],
    title: 'Untitled Diagram',
  })
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isPromptPanelCollapsed, setIsPromptPanelCollapsed] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 初始化
  useEffect(() => {
    // 从本地存储读取主题
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }

    // 从本地存储加载历史
    const saved = localStorage.getItem('diagram_history')
    if (saved) {
      try {
        setHistory(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load history', e)
      }
    }

    // 临时跳过登录验证
    setIsLoggedIn(true)
  }, [])

  // 主题切换
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  // 保存到历史
  const saveToHistory = (newState: DiagramState) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      type: activeTab,
      preview: newState.title,
      state: newState,
    }
    const newHistory = [newItem, ...history].slice(0, 20)
    setHistory(newHistory)
    localStorage.setItem('diagram_history', JSON.stringify(newHistory))
  }

  // 退出登录
  const handleLogout = () => {
    removeToken()
    setIsLoggedIn(false)
  }

  // AI 生成处理
  const handleGenerate = async (prompt: string, model: string, chartType: string) => {
    setIsLoading(true)
    try {
      const response = await generateDiagram({
        prompt,
        diagram_type: activeTab === DiagramType.MERMAID ? 'MERMAID' : 'EXCALIDRAW',
        model,
        chart_type: chartType,
      })

      if (activeTab === DiagramType.MERMAID) {
        // Mermaid 模式：直接使用返回的 code
        const mermaidCode = response.code || ''
        const newState = {
          ...diagramState,
          mermaidCode,
          title: prompt.slice(0, 50),
        }
        setDiagramState(newState)
        saveToHistory(newState)
      } else if (activeTab === DiagramType.EXCALIDRAW) {
        // Excalidraw 模式：后端可能返回 Excalidraw JSON 或 Mermaid 代码
        const dataContent = response.data || response.code || ''
        
        console.log('📦 [AI生成] 后端返回数据:', {
          hasData: !!response.data,
          hasCode: !!response.code,
          dataLength: dataContent.length,
          dataPreview: dataContent.substring(0, 200)
        })
        
        if (!dataContent || dataContent.trim() === '') {
          throw new Error('后端返回的图表数据为空')
        }
        
        try {
          // 尝试解析为 JSON，判断是否为 Excalidraw 格式
          let parsedData: any
          try {
            parsedData = JSON.parse(dataContent)
          } catch {
            parsedData = null
          }

          let elements: ExcalidrawElement[] = []
          let files: BinaryFiles = {}
          let mermaidCode = ''

          // 判断数据格式
          if (parsedData && Array.isArray(parsedData)) {
            // 后端返回的是 Excalidraw 元素数组
            console.log('📦 [AI生成] 检测到数组格式，原始元素数:', parsedData.length)
            elements = validateAndFilterElements(parsedData)
            console.log('✅ [AI生成] 验证后保留元素数:', elements.length)
            if (elements.length === 0 && parsedData.length > 0) {
              console.error('⚠️ [AI生成] 所有元素都被过滤，原始数据:', parsedData)
            }
          } else if (parsedData && typeof parsedData === 'object' && parsedData.elements) {
            // 后端返回的是包含 elements 的对象
            console.log('📦 [AI生成] 检测到场景对象格式，原始元素数:', parsedData.elements.length)
            elements = validateAndFilterElements(parsedData.elements)
            files = parsedData.files || {}
            console.log('✅ [AI生成] 验证后保留元素数:', elements.length)
            if (elements.length === 0 && parsedData.elements.length > 0) {
              console.error('⚠️ [AI生成] 所有元素都被过滤，原始数据:', parsedData.elements)
            }
          } else {
            // 后端返回的是 Mermaid 代码，需要转换
            console.log('📦 [AI生成] 检测到 Mermaid 代码，执行转换')
            mermaidCode = dataContent
            const converted = await convertMermaidToExcalidraw(mermaidCode)
            elements = converted.elements
            files = converted.files
            console.log('✅ [AI生成] Mermaid 转换完成，元素数:', elements.length)
          }
          
          const newState: DiagramState = {
            ...diagramState,
            excalidrawElements: elements,
            excalidrawFiles: files,
            sourceType: 'ai',
            mermaidCode, // 如果有原始 Mermaid 代码则保存
            title: prompt.slice(0, 50),
          }
          
          console.log('📦 [AI生成] 更新状态:', {
            elementsCount: newState.excalidrawElements.length,
            filesCount: Object.keys(newState.excalidrawFiles || {}).length,
            title: newState.title
          })
          
          // 调试：输出前3个元素的完整数据
          console.log('🔍 [调试] 完整元素数据（前3个）:', 
            JSON.stringify(elements.slice(0, 3), null, 2)
          )
          
          setDiagramState(newState)
          saveToHistory(newState)
        } catch (conversionError) {
          console.error('处理失败:', conversionError)
          const errorMsg = getErrorMessage(conversionError)
          alert('AI 生成成功但处理失败: ' + errorMsg)
        }
      }
    } catch (error) {
      console.error('生成失败:', error)
      const errorMessage = error instanceof Error ? error.message : '生成失败,请稍后重试'
      alert(errorMessage)

      if (errorMessage.includes('登录已过期')) {
        handleLogout()
      }
    } finally {
      setIsLoading(false)
    }
  }

  // 历史记录选择
  const handleHistorySelect = (item: HistoryItem) => {
    setActiveTab(item.type)
    setDiagramState(item.state)
  }

  // Mermaid 转 Excalidraw
  const handleConvertToExcalidraw = async (mermaidCode: string) => {
    setIsLoading(true)
    try {
      const { elements, files } = await convertMermaidToExcalidraw(mermaidCode)

      // 切换到 Excalidraw 标签
      setActiveTab(DiagramType.EXCALIDRAW)

      const newState: DiagramState = {
        ...diagramState,
        excalidrawElements: elements,
        excalidrawFiles: files,
        sourceType: 'converted',
        conversionMetadata: {
          originalMermaidCode: mermaidCode,
          convertedAt: Date.now(),
        },
        title: diagramState.title || 'Converted Diagram',
      }

      setDiagramState(newState)
      saveToHistory(newState)
    } catch (error) {
      console.error('转换失败:', error)
      const errorMsg = getErrorMessage(error)
      alert(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }

  // 处理 Mermaid 代码更新
  const handleMermaidCodeChange = (code: string) => {
    setDiagramState({ ...diagramState, mermaidCode: code })
  }

  // 处理 Excalidraw 元素更新
  const handleExcalidrawElementsChange = (elements: ExcalidrawElement[]) => {
    // 防止无限循环：只有当元素真正变化时才更新状态
    // 不更新状态可以避免触发 ExcalidrawWrapper 的 useEffect
    // ExcalidrawWrapper 会自己管理内部的元素状态
    // 这里我们不需要将每次变化都同步回父组件状态
    // 只在需要保存时才同步
  }

  if (!isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* 侧边栏 */}
      <Sidebar
        history={history}
        activeTab={activeTab}
        collapsed={isSidebarCollapsed}
        onSelectHistory={handleHistorySelect}
        onTabChange={setActiveTab}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onLogout={handleLogout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header
          title={diagramState.title}
          isDarkMode={isDarkMode}
          onToggleTheme={() => setIsDarkMode(!isDarkMode)}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* 编辑面板 */}
          <div className={`flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10 shadow-xl shrink-0 transition-all duration-300 ${isPromptPanelCollapsed ? 'w-12' : 'w-[400px]'}`}>
            {/* 折叠按钮 */}
            <div className="h-14 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 relative transition-colors shrink-0">
              {!isPromptPanelCollapsed && (
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">AI 助手</span>
              )}
              <button
                onClick={() => setIsPromptPanelCollapsed(!isPromptPanelCollapsed)}
                title={isPromptPanelCollapsed ? '展开 AI 助手' : '收起 AI 助手'}
                className="absolute right-2 p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-300 ${isPromptPanelCollapsed ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </div>

            {/* 提示词输入区域 */}
            {!isPromptPanelCollapsed && (
              <div className="flex-1 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[200px] flex flex-col overflow-y-auto">
                <PromptInput
                  disabled={isLoading}
                  diagramType={activeTab}
                  onGenerate={handleGenerate}
                />
              </div>
            )}

            {/* Mermaid 代码编辑器显示区域 */}
            {!isPromptPanelCollapsed && activeTab === DiagramType.MERMAID && (
              <div className="h-[50%] flex flex-col bg-slate-50 dark:bg-slate-925 transition-all duration-300 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 select-none h-10 shrink-0 transition-colors">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="text-sm font-semibold">Code</span>
                  </div>
                </div>

                <div className="flex-1 relative group bg-white dark:bg-[#0d1117]">
                  <textarea
                    value={diagramState.mermaidCode}
                    onChange={(e) => handleMermaidCodeChange(e.target.value)}
                    className="absolute inset-0 w-full h-full pl-2 sm:pl-10 p-4 bg-transparent text-slate-800 dark:text-slate-300 font-mono text-xs leading-relaxed resize-none focus:outline-none scrollbar-thin"
                    spellCheck={false}
                    placeholder="Enter Mermaid syntax here..."
                  />
                </div>
              </div>
            )}

            {/* Excalidraw 提示 */}
            {!isPromptPanelCollapsed && activeTab === DiagramType.EXCALIDRAW && (
              <div className="p-8 flex flex-col items-center justify-center text-slate-500 text-center space-y-2 opacity-50 border-t border-slate-200 dark:border-slate-800">
                <p className="text-sm">Excalidraw Mode</p>
                <p className="text-xs">Use the canvas to edit elements directly.</p>
              </div>
            )}
          </div>

          {/* 画布区域 */}
          <div className="flex-1 relative bg-slate-100 dark:bg-slate-800 overflow-hidden flex flex-col transition-colors duration-300">
            {isLoading && (
              <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-lg font-medium text-slate-900 dark:text-blue-100">
                    Architecting Diagram...
                  </p>
                </div>
              </div>
            )}

            <div className="flex-1 w-full h-full relative">
              {activeTab === DiagramType.MERMAID ? (
                <MermaidEditor
                  code={diagramState.mermaidCode}
                  isDarkMode={isDarkMode}
                  onCodeChange={handleMermaidCodeChange}
                  onConvertToExcalidraw={handleConvertToExcalidraw}
                />
              ) : (
                <ExcalidrawWrapper
                  elements={diagramState.excalidrawElements}
                  files={diagramState.excalidrawFiles}
                  initialAppState={diagramState.excalidrawAppState}
                  isDarkMode={isDarkMode}
                  onElementsChange={handleExcalidrawElementsChange}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
