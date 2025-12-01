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
        const newState = {
          ...diagramState,
          mermaidCode: response.code,
          title: prompt.slice(0, 50),
        }
        setDiagramState(newState)
        saveToHistory(newState)
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
          <div className="w-[400px] flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-10 shadow-xl shrink-0 transition-colors duration-300">
            {/* 提示词输入区域 */}
            <div className="flex-1 p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 min-h-[200px] flex flex-col overflow-y-auto">
              <PromptInput
                disabled={isLoading}
                diagramType={activeTab}
                onGenerate={handleGenerate}
              />
            </div>

            {/* Mermaid 代码编辑器显示区域 */}
            {activeTab === DiagramType.MERMAID && (
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
            {activeTab === DiagramType.EXCALIDRAW && (
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
