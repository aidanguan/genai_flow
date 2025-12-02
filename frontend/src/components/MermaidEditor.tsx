import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Download, Send, AlertCircle, FileText, Image, FileDown, Palette, ArrowLeftRight, ArrowUpDown, Check, ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'

interface MermaidEditorProps {
  code: string
  isDarkMode?: boolean
  onCodeChange?: (code: string) => void
  onConvertToExcalidraw?: (code: string) => void
}

export default function MermaidEditor({
  code,
  isDarkMode = false,
  onCodeChange,
  onConvertToExcalidraw,
}: MermaidEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const themeMenuRef = useRef<HTMLDivElement>(null)
  const [svgContent, setSvgContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [currentTheme, setCurrentTheme] = useState<'default' | 'dark' | 'forest' | 'neutral' | 'base'>('default')
  const [direction, setDirection] = useState<'TB' | 'LR'>('TB')
  
  // 文本编辑状态
  const [isEditingText, setIsEditingText] = useState(false)
  const [editingNodeId, setEditingNodeId] = useState('')
  const [editingText, setEditingText] = useState('')
  
  // 缩放和平移状态
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Mermaid 主题配色方案
  const themes: Array<{
    value: 'default' | 'dark' | 'forest' | 'neutral' | 'base'
    label: string
    description: string
  }> = [
    { value: 'default', label: '默认', description: '经典浅色主题' },
    { value: 'dark', label: '深色', description: '深色护眼主题' },
    { value: 'forest', label: '森林', description: '清新绿色主题' },
    { value: 'neutral', label: '中性', description: '简约灰色主题' },
    { value: 'base', label: '基础', description: '简洁蓝色主题' },
  ]

  // 初始化 Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: currentTheme,
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    })
  }, [currentTheme])

  // 渲染图表
  useEffect(() => {
    const renderDiagram = async () => {
      if (!code.trim()) {
        setSvgContent('')
        setError(null)
        return
      }

      try {
        setError(null)
        // 替换代码中的方向定义
        let processedCode = code
        if (code.includes('graph ')) {
          processedCode = code.replace(/graph\s+(TD|TB|BT|RL|LR)/, `graph ${direction}`)
        } else if (code.includes('flowchart ')) {
          processedCode = code.replace(/flowchart\s+(TD|TB|BT|RL|LR)/, `flowchart ${direction}`)
        }
        
        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, processedCode)
        setSvgContent(svg)
        
        // 延迟绑定双击事件，确保 DOM 已更新
        setTimeout(() => {
          bindDoubleClickEvent()
        }, 100)
      } catch (err: any) {
        console.error('Mermaid render error:', err)
        setError(err?.message || '语法错误')
      }
    }

    renderDiagram()
  }, [code, direction, currentTheme])

  // 点击外部关闭导出菜单
  useEffect(() => {
    if (!showExportMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      const el = exportMenuRef.current
      if (el && !el.contains(e.target as Node)) {
        setShowExportMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  // 点击外部关闭主题菜单
  useEffect(() => {
    if (!showThemeMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      const el = themeMenuRef.current
      if (el && !el.contains(e.target as Node)) {
        setShowThemeMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showThemeMenu])

  // 导出 SVG
  const downloadSVG = () => {
    if (!svgContent) return
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    saveAs(blob, 'mermaid-diagram.svg')
    setShowExportMenu(false)
  }

  // 导出 PNG
  const downloadPNG = async () => {
    if (!svgContent) {
      alert('没有图表内容')
      return
    }

    try {
      setShowExportMenu(false)
      
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.visibility = 'hidden'
      tempDiv.innerHTML = svgContent
      document.body.appendChild(tempDiv)
      
      const tempSvg = tempDiv.querySelector('svg') as SVGSVGElement
      if (!tempSvg) {
        document.body.removeChild(tempDiv)
        alert('SVG 解析失败')
        return
      }
      
      const bbox = tempSvg.getBBox()
      const padding = 20
      const svgWidth = bbox.width + padding * 2
      const svgHeight = bbox.height + padding * 2
      
      tempSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${svgWidth} ${svgHeight}`)
      tempSvg.setAttribute('width', String(svgWidth))
      tempSvg.setAttribute('height', String(svgHeight))
      
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = svgWidth * scale
      canvas.height = svgHeight * scale
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        document.body.removeChild(tempDiv)
        alert('Canvas 创建失败')
        return
      }
      
      ctx.scale(scale, scale)
      
      const img = document.createElement('img') as HTMLImageElement
      const svgData = new XMLSerializer().serializeToString(tempSvg)
      const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        document.body.removeChild(tempDiv)
        
        canvas.toBlob((blob) => {
          if (blob) {
            saveAs(blob, 'mermaid-diagram.png')
          }
        })
      }
      
      img.src = svgDataUri
    } catch (error) {
      console.error('PNG export failed:', error)
      alert('PNG 导出失败')
    }
  }

  // 绑定双击事件
  const bindDoubleClickEvent = () => {
    if (containerRef.current) {
      // 移除旧的监听器避免重复绑定
      containerRef.current.removeEventListener('dblclick', handleDoubleClick)
      // 添加新的监听器
      containerRef.current.addEventListener('dblclick', handleDoubleClick)
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
        matchAndEditNode(currentText)
        return
      }
    }
    
    // 如果点击的是 .node 节点,寻找其中的文本
    if (nodeElement.classList.contains('node')) {
      let textElement = nodeElement.querySelector('.nodeLabel') ||
                        nodeElement.querySelector('text') ||
                        nodeElement.querySelector('tspan') ||
                        nodeElement.querySelector('span')
      
      if (!textElement) return
      
      const currentText = textElement.textContent?.trim() || ''
      if (!currentText) return
      
      // 匹配代码
      matchAndEditNode(currentText)
    }
  }

  // 匹配并编辑节点
  const matchAndEditNode = (currentText: string) => {
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
      nodeMatch = code.match(pattern)
      if (nodeMatch) break
    }
    
    if (!nodeMatch) {
      console.warn('未找到匹配的节点:', currentText)
      return
    }
    
    setEditingNodeId(nodeMatch[1])
    setEditingText(currentText)
    setIsEditingText(true)
    
    // 聚焦输入框
    setTimeout(() => {
      const input = document.querySelector('.text-edit-input') as HTMLInputElement
      if (input) {
        input.focus()
        input.select()
      }
    }, 50)
  }

  // 保存文本编辑
  const saveTextEdit = () => {
    if (!editingNodeId || !isEditingText) return
    
    const newText = editingText.trim()
    if (!newText) {
      cancelTextEdit()
      return
    }
    
    // 更新代码
    const nodePattern = new RegExp(
      `(${editingNodeId})[\\[(\\{]+([^\\])\\}]+)[\\])\\}]+`,
      'g'
    )
    
    const updatedCode = code.replace(nodePattern, (match, id) => {
      // 保留原有形状符号
      const openChar = match.match(/[\[({]+/)?.[0] || '['
      const closeChar = openChar === '[[' ? ']]' : 
                        openChar === '((' ? '))' : 
                        openChar === '{{' ? '}}' :
                        openChar === '{' ? '}' :
                        openChar === '(' ? ')' : ']'
      return `${id}${openChar}${newText}${closeChar}`
    })
    
    onCodeChange?.(updatedCode)
    cancelTextEdit()
  }

  // 取消文本编辑
  const cancelTextEdit = () => {
    setIsEditingText(false)
    setEditingNodeId('')
    setEditingText('')
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      saveTextEdit()
    } else if (e.key === 'Escape') {
      cancelTextEdit()
    }
  }

  // 鼠标拖动
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // 缩放功能
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 6))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.3))
  }

  // 自适应画布
  const fitToCanvas = () => {
    if (!containerRef.current) return
    
    const container = containerRef.current.parentElement
    if (!container) return
    
    const svg = containerRef.current.querySelector('svg')
    if (!svg) return
    
    const bbox = svg.getBBox()
    const svgWidth = bbox.width
    const svgHeight = bbox.height
    
    const containerWidth = container.clientWidth - 100 // 留出边距
    const containerHeight = container.clientHeight - 100
    
    // 计算缩放比例（取较小的比例以确保完全显示）
    const scaleX = containerWidth / svgWidth
    const scaleY = containerHeight / svgHeight
    const newScale = Math.min(scaleX, scaleY, 1) // 最大不超过 1
    
    // 应用缩放并居中
    setScale(newScale)
    setPosition({ x: 0, y: 0 })
  }

  // 导出 PDF
  const downloadPDF = async () => {
    if (!svgContent) {
      alert('没有图表内容')
      return
    }

    try {
      setShowExportMenu(false)
      
      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'absolute'
      tempDiv.style.visibility = 'hidden'
      tempDiv.innerHTML = svgContent
      document.body.appendChild(tempDiv)
      
      const tempSvg = tempDiv.querySelector('svg') as SVGSVGElement
      if (!tempSvg) {
        document.body.removeChild(tempDiv)
        return
      }
      
      const bbox = tempSvg.getBBox()
      const padding = 20
      const svgWidth = bbox.width + padding * 2
      const svgHeight = bbox.height + padding * 2
      
      tempSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${svgWidth} ${svgHeight}`)
      
      const canvas = document.createElement('canvas')
      const scale = 2
      canvas.width = svgWidth * scale
      canvas.height = svgHeight * scale
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        document.body.removeChild(tempDiv)
        return
      }
      
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.scale(scale, scale)
      
      const svgData = new XMLSerializer().serializeToString(tempSvg)
      const svgDataUri = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
      
      const img = document.createElement('img') as HTMLImageElement
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        document.body.removeChild(tempDiv)
        
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF({
          orientation: svgWidth > svgHeight ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [svgWidth, svgHeight],
        })
        
        pdf.addImage(imgData, 'PNG', 0, 0, svgWidth, svgHeight)
        pdf.save('mermaid-diagram.pdf')
      }
      
      img.src = svgDataUri
    } catch (error) {
      console.error('PDF export failed:', error)
    }
  }

  return (
    <div className="w-full h-full relative bg-slate-100 dark:bg-[#1e293b] overflow-hidden select-none transition-colors duration-300">
      {/* 工具栏 */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center gap-2">
          
          {/* 主题配色选择器 */}
          <div className="relative" ref={themeMenuRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="选择主题配色"
            >
              <Palette size={18} />
            </button>
            {showThemeMenu && (
              <div className="absolute top-full mt-2 left-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[200px] z-50">
                {themes.map((theme) => (
                  <button
                    key={theme.value}
                    onClick={() => {
                      setCurrentTheme(theme.value)
                      setShowThemeMenu(false)
                    }}
                    className="w-full px-4 py-2.5 text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-between group"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {theme.label}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {theme.description}
                      </div>
                    </div>
                    {currentTheme === theme.value && (
                      <Check size={16} className="text-blue-600 dark:text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 方向切换按钮 */}
          <button
            onClick={() => setDirection(direction === 'TB' ? 'LR' : 'TB')}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            title={direction === 'TB' ? '切换到横向布局' : '切换到纵向布局'}
          >
            {direction === 'TB' ? <ArrowUpDown size={18} /> : <ArrowLeftRight size={18} />}
          </button>

          {/* 分隔线 */}
          <div className="h-6 w-px bg-slate-300 dark:bg-slate-600"></div>
          
          {/* 转换到 Excalidraw 按钮 */}
          <button
            onClick={() => onConvertToExcalidraw?.(code)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all border border-blue-200 dark:border-blue-700/50 hover:border-blue-300 dark:hover:border-blue-600"
            title="转换为 Excalidraw 白板"
          >
            <Send size={16} />
            <span className="hidden sm:inline">转换为 Excalidraw</span>
          </button>

          {/* 导出按钮 */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
              title="导出"
            >
              <Download size={18} />
            </button>
            {showExportMenu && (
              <div className="absolute top-full mt-2 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 py-1 min-w-[140px] z-50">
                <button
                  onClick={downloadSVG}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <FileText size={16} />
                  SVG
                </button>
                <button
                  onClick={downloadPNG}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <Image size={16} />
                  PNG
                </button>
                <button
                  onClick={downloadPDF}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <FileDown size={16} />
                  PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 画布 */}
      <div 
        className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {error ? (
          <div className="flex flex-col items-center text-red-500 dark:text-red-400 gap-3 p-8 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-red-200 dark:border-red-900/30 backdrop-blur-sm shadow-2xl">
            <AlertCircle size={32} />
            <div className="text-center max-w-sm">
              <p className="font-bold text-lg mb-2">渲染失败</p>
              <p className="text-sm opacity-80 font-mono bg-red-50 dark:bg-slate-900 p-2 rounded">
                {error}
              </p>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              transformOrigin: 'center'
            }}
            className="flex items-center justify-center relative"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>

      {/* 缩放控制按钮 - 右下角 */}
      <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-2">
        <button 
          onClick={handleZoomIn}
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg p-2 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="放大"
        >
          <ZoomIn size={18} />
        </button>
        <button 
          onClick={handleZoomOut}
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg p-2 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="缩小"
        >
          <ZoomOut size={18} />
        </button>
        <button 
          onClick={fitToCanvas}
          className="bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-lg p-2 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          title="自适应画布"
        >
          <Maximize size={18} />
        </button>
      </div>

      {/* 文本编辑弹窗 */}
      {isEditingText && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(2px)' }}
          onClick={cancelTextEdit}
        >
          <div 
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl border-2 border-blue-500 dark:border-blue-400 p-6 min-w-[320px] max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">编辑节点文字</h3>
            
            <input 
              value={editingText}
              onChange={(e) => setEditingText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-edit-input w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-base text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
              placeholder="输入文本..."
              autoFocus
            />
            
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">Enter</kbd> 保存
                <span className="mx-2">·</span>
                <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs">Esc</kbd> 取消
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={cancelTextEdit}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={saveTextEdit}
                  className="px-4 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
