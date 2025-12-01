import React, { useEffect, useRef, useCallback } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/index.css'
import type { ExcalidrawElement, AppState, BinaryFiles } from '../types'

interface ExcalidrawWrapperProps {
  elements: ExcalidrawElement[]
  files?: BinaryFiles
  isDarkMode?: boolean
  initialAppState?: Partial<AppState>
  onElementsChange?: (elements: ExcalidrawElement[]) => void
  onFilesChange?: (files: BinaryFiles | null) => void
  onAppStateChange?: (appState: Partial<AppState>) => void
}

export default function ExcalidrawWrapper({
  elements,
  files,
  isDarkMode = false,
  initialAppState,
  onElementsChange,
  onFilesChange,
  onAppStateChange,
}: ExcalidrawWrapperProps) {
  const apiRef = useRef<any>(null)
  const elementsRef = useRef<ExcalidrawElement[]>(elements)
  const lastUpdateTimestamp = useRef<number>(0)

  // 更新 elementsRef 但不触发重渲染
  useEffect(() => {
    elementsRef.current = elements
  }, [elements])

  // 处理 Excalidraw API 回调
  const handleExcalidrawAPI = useCallback((api: any) => {
    apiRef.current = api
    console.log('✅ [ExcalidrawWrapper] Excalidraw API ready')
    
    // API 就绪后，如果有初始元素，更新场景
    if (elementsRef.current && elementsRef.current.length > 0) {
      console.log('🔄 [ExcalidrawWrapper] 更新初始元素:', elementsRef.current.length)
      setTimeout(() => {
        if (apiRef.current) {
          apiRef.current.updateScene({ elements: elementsRef.current })
          
          // 滚动到内容（添加错误处理）
          try {
            const sceneElements = apiRef.current.getSceneElements()
            if (sceneElements && sceneElements.length > 0) {
              apiRef.current.scrollToContent(sceneElements, { fitToContent: true })
            }
          } catch (error) {
            console.error('⚠️ [ExcalidrawWrapper] 滚动到内容失败:', error)
          }
        }
      }, 100)
    }
  }, [])

  // 监听外部 elements 变化（来自转换操作）
  useEffect(() => {
    console.log('🔄 [ExcalidrawWrapper] useEffect 触发:', {
      hasAPI: !!apiRef.current,
      elementsCount: elements?.length || 0,
      elementsPreview: elements?.slice(0, 2).map(e => ({ type: e.type, id: e.id }))
    })
    
    if (!apiRef.current || !elements || elements.length === 0) {
      console.log('⚠️ [ExcalidrawWrapper] 跳过更新:', {
        noAPI: !apiRef.current,
        noElements: !elements,
        emptyElements: elements?.length === 0
      })
      return
    }
    
    const now = Date.now()
    // 防抖：500ms 内只更新一次
    if (now - lastUpdateTimestamp.current < 500) {
      return
    }
    
    // 检查是否是真正的新元素（不是来自 onChange 的回传）
    const currentElements = apiRef.current.getSceneElements()
    if (currentElements.length === elements.length) {
      // 可能是同一批元素，避免重复更新
      return
    }
    
    lastUpdateTimestamp.current = now
    console.log('🔄 [ExcalidrawWrapper] 外部元素更新:', elements.length)
    apiRef.current.updateScene({ elements })
    
    // 滚动到内容（添加错误处理）
    setTimeout(() => {
      if (apiRef.current) {
        try {
          const sceneElements = apiRef.current.getSceneElements()
          if (sceneElements && sceneElements.length > 0) {
            apiRef.current.scrollToContent(sceneElements, { fitToContent: true })
          }
        } catch (error) {
          console.error('⚠️ [ExcalidrawWrapper] 滚动到内容失败:', error)
        }
      }
    }, 50)
  }, [elements])

  // 处理变化事件
  const handleChange = useCallback((
    newElements: readonly ExcalidrawElement[],
    newAppState: AppState,
    newFiles: BinaryFiles
  ) => {
    // 防止空数组覆盖现有元素
    if (elementsRef.current && elementsRef.current.length > 0 && 
        (!newElements || newElements.length === 0)) {
      console.log('🚫 [ExcalidrawWrapper] 忽略空数组change事件')
      return
    }
    
    onElementsChange?.(newElements as ExcalidrawElement[])
    onFilesChange?.(newFiles)
    onAppStateChange?.(newAppState)
  }, [onElementsChange, onFilesChange, onAppStateChange])

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-slate-100 dark:bg-[#1e293b]">
      <Excalidraw
        excalidrawAPI={handleExcalidrawAPI}
        theme={isDarkMode ? 'dark' : 'light'}
        langCode="zh-CN"
        initialData={{
          appState: {
            viewBackgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
            currentItemFontFamily: 1,
            theme: isDarkMode ? 'dark' : 'light',
            ...(initialAppState || {}),
          },
        }}
        UIOptions={{
          canvasActions: {
            changeViewBackgroundColor: true,
            clearCanvas: true,
            export: { saveFileToDisk: true },
            saveAsImage: true,
            toggleTheme: true,
          },
          tools: {
            image: true,
          },
        }}
        onChange={handleChange}
      />
    </div>
  )
}
