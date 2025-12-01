// Excalidraw 类型定义（使用 any 避免导入问题）
export type ExcalidrawElement = any
export type AppState = any
export type BinaryFiles = any

export const enum DiagramType {
  MERMAID = 'MERMAID',
  EXCALIDRAW = 'EXCALIDRAW'
}

export interface DiagramState {
  mermaidCode: string
  excalidrawElements: ExcalidrawElement[]
  title: string
  // Excalidraw 扩展字段
  excalidrawFiles?: BinaryFiles
  excalidrawAppState?: Partial<AppState>
  sourceType?: 'ai' | 'manual' | 'converted'
  conversionMetadata?: {
    originalMermaidCode?: string
    convertedAt?: number
  }
}

export interface HistoryItem {
  id: string
  timestamp: number
  type: DiagramType
  preview: string
  state: DiagramState
}

// 转换错误类型
export enum ConversionErrorType {
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  UNSUPPORTED_DIAGRAM = 'UNSUPPORTED_DIAGRAM',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  EMPTY_DIAGRAM = 'EMPTY_DIAGRAM'
}

export class ConversionError extends Error {
  constructor(
    public type: ConversionErrorType,
    message: string
  ) {
    super(message)
    this.name = 'ConversionError'
  }
}

// 转换选项
export interface ConversionOptions {
  fontSize?: string
  curve?: 'linear' | 'basis'
  themeVariables?: {
    fontSize?: string
  }
  flowchart?: {
    curve?: 'linear' | 'basis'
  }
}

// 转换结果
export interface ConversionResult {
  elements: ExcalidrawElement[]
  files: BinaryFiles | null
}

export interface MermaidConfig {
  theme: 'dark' | 'default' | 'forest' | 'neutral'
}

export const SUPPORTED_MODELS = [
  { id: 'gpt-5.1', name: 'GPT 5.1' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
]

export const MERMAID_CHART_TYPES = [
  { id: 'flowchart', name: '流程图', keyword: 'graph TD' },
  { id: 'sequence', name: '时序图', keyword: 'sequenceDiagram' },
  { id: 'class', name: '类图', keyword: 'classDiagram' },
  { id: 'state', name: '状态图', keyword: 'stateDiagram-v2' },
  { id: 'er', name: 'ER图', keyword: 'erDiagram' },
  { id: 'gantt', name: '甘特图', keyword: 'gantt' },
  { id: 'pie', name: '饼图', keyword: 'pie' },
  { id: 'journey', name: '旅程图', keyword: 'journey' },
  { id: 'architecture', name: '架构图', keyword: 'architecture-beta' },
]

export const TEMPLATES = [
  {
    name: '流程图',
    type: DiagramType.MERMAID,
    code: `graph TD\n  A[开始] --> B{判断条件}\n  B -- 是 --> C[处理]\n  B -- 否 --> D[结束]`
  },
  {
    name: '时序图',
    type: DiagramType.MERMAID,
    code: `sequenceDiagram\n  用户->>系统: 登录请求\n  系统-->>用户: 返回结果`
  },
  {
    name: '类图',
    type: DiagramType.MERMAID,
    code: `classDiagram
  class Animal{
    +String name
    +move()
  }
  class Dog{
    +bark()
  }
  Animal <|-- Dog`
  },
]
