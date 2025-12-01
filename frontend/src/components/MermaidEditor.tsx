import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Download, Send, AlertCircle, FileText, Image, FileDown } from 'lucide-react'
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
  const [svgContent, setSvgContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showExportMenu, setShowExportMenu] = useState(false)

  // 初始化 Mermaid
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: isDarkMode ? 'dark' : 'default',
      securityLevel: 'loose',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
    })
  }, [])

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
        const id = `mermaid-${Date.now()}`
        const { svg } = await mermaid.render(id, code)
        setSvgContent(svg)
      } catch (err: any) {
        console.error('Mermaid render error:', err)
        setError(err?.message || '语法错误')
      }
    }

    renderDiagram()
  }, [code])

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
          <div className="relative">
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
      <div className="w-full h-full flex items-center justify-center">
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
            className="flex items-center justify-center relative"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </div>
  )
}
