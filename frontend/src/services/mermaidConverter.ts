/**
 * Mermaid 到 Excalidraw 转换服务
 * 负责将 Mermaid 图表代码转换为 Excalidraw 可编辑的元素
 * 参考官方实现：@excalidraw/mermaid-to-excalidraw
 */

import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw'
import { convertToExcalidrawElements } from '@excalidraw/excalidraw'
import { ConversionError, ConversionErrorType, type ConversionOptions, type ConversionResult } from '../types'

// 类型定义（使用 any 类型避免 import 问题）
type ExcalidrawElement = any
type BinaryFiles = any

// 官方默认字体大小（参考官方 constants.ts）
const DEFAULT_FONT_SIZE = 20

/**
 * 支持的 Mermaid 图表类型
 */
const SUPPORTED_DIAGRAM_TYPES = [
  'flowchart', 'graph', 
  'sequenceDiagram', 
  'classDiagram', 
  'stateDiagram', 
  'erDiagram',
  'journey'
]

/**
 * 不支持的图表类型
 */
const UNSUPPORTED_DIAGRAM_TYPES = [
  'gantt', 
  'pie'
]

/**
 * 检测 Mermaid 图表类型
 */
function detectDiagramType(code: string): string | null {
  const trimmedCode = code.trim()
  if (!trimmedCode) return null
  
  const firstLine = trimmedCode.split('\n')[0].trim()
  
  // 检查是否为不支持的类型
  for (const type of UNSUPPORTED_DIAGRAM_TYPES) {
    if (firstLine.toLowerCase().indexOf(type.toLowerCase()) !== -1) {
      return type
    }
  }
  
  // 检查支持的类型
  for (const type of SUPPORTED_DIAGRAM_TYPES) {
    if (firstLine.toLowerCase().indexOf(type.toLowerCase()) !== -1) {
      return type
    }
  }
  
  return null
}

/**
 * 将 Mermaid 代码转换为 Excalidraw 元素
 * @param mermaidCode - Mermaid 图表代码
 * @param options - 转换选项
 * @returns 转换后的 Excalidraw 元素和文件
 */
export async function convertMermaidToExcalidraw(
  mermaidCode: string,
  options?: ConversionOptions
): Promise<ConversionResult> {
  // 1. 验证输入
  if (!mermaidCode || !mermaidCode.trim()) {
    throw new ConversionError(
      ConversionErrorType.EMPTY_DIAGRAM,
      '图表内容为空，无法转换'
    )
  }

  // 2. 检测图表类型
  const diagramType = detectDiagramType(mermaidCode)
  
  if (diagramType && UNSUPPORTED_DIAGRAM_TYPES.indexOf(diagramType) !== -1) {
    throw new ConversionError(
      ConversionErrorType.UNSUPPORTED_DIAGRAM,
      `该图表类型(${diagramType})暂不支持转换到 Excalidraw。支持的类型有：流程图、时序图、类图、状态图、ER图`
    )
  }

  try {
    // 3. 调用官方 parseMermaidToExcalidraw API
    // 完全对齐官方 Playground 的配置
    // - 使用 DEFAULT_FONT_SIZE = 20
    // - parseMermaid 时字体 * 1.25 = 25（用于SVG渲染）
    // - graphToExcalidraw 时用原始字体 20（用于Excalidraw）
    console.log('🔄 [Converter] 开始转换，使用官方配置（fontSize=20）...')
    const config = {
      startOnLoad: false,
      flowchart: { curve: 'linear' as const },
      themeVariables: {
        fontSize: `${DEFAULT_FONT_SIZE}px`, // 传入20px，内部会自动×1.25
      },
      maxEdges: 500,
      maxTextSize: 50000,
    }
    const { elements: skeletonElements, files } = await parseMermaidToExcalidraw(
      mermaidCode,
      config
    )
    
    // 4. 验证转换结果
    if (!skeletonElements || skeletonElements.length === 0) {
      throw new ConversionError(
        ConversionErrorType.CONVERSION_FAILED,
        '转换结果为空，请检查 Mermaid 代码是否正确'
      )
    }

    console.log('✅ [Converter] 步骤1完成: parseMermaidToExcalidraw, skeleton元素数量:', skeletonElements.length)
    if (skeletonElements.length > 0) {
      console.log('📊 [Converter] Skeleton第一个元素:', {
        type: skeletonElements[0].type,
        label: skeletonElements[0].label,
        fontSize: skeletonElements[0].fontSize,
        x: skeletonElements[0].x,
        y: skeletonElements[0].y,
        width: skeletonElements[0].width,
        height: skeletonElements[0].height
      })
    }

    // 5. 转换为完整的 Excalidraw 元素
    const excalidrawElements = convertToExcalidrawElements(skeletonElements)
    
    console.log('✅ [Converter] 步骤2完成: convertToExcalidrawElements, 最终元素数量:', excalidrawElements.length)
    if (excalidrawElements.length > 0) {
      const firstElement: any = excalidrawElements[0]
      console.log('📊 [Converter] 最终第一个元素:', {
        type: firstElement.type,
        fontSize: firstElement.fontSize,
        text: firstElement.text,
        x: firstElement.x,
        y: firstElement.y,
        width: firstElement.width,
        height: firstElement.height
      })
    }

    // 6. 返回结果
    return {
      elements: excalidrawElements as ExcalidrawElement[],
      files: (files as BinaryFiles) || null
    }
  } catch (error) {
    // 7. 错误处理
    if (error instanceof ConversionError) {
      throw error
    }

    // 语法错误
    if (error instanceof Error) {
      if (error.message.indexOf('syntax') !== -1 || error.message.indexOf('parse') !== -1) {
        throw new ConversionError(
          ConversionErrorType.SYNTAX_ERROR,
          'Mermaid 语法错误，请检查代码格式'
        )
      }
    }

    // 其他转换错误
    throw new ConversionError(
      ConversionErrorType.CONVERSION_FAILED,
      `转换失败: ${error instanceof Error ? error.message : '未知错误'}`
    )
  }
}

/**
 * 获取用户友好的错误提示
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ConversionError) {
    return error.message
  }
  
  if (error instanceof Error) {
    return `转换失败: ${error.message}`
  }
  
  return '转换失败，请稍后重试'
}
