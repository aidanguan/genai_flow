export const enum DiagramType {
  MERMAID = 'MERMAID',
  EXCALIDRAW = 'EXCALIDRAW'
}

export interface DiagramState {
  mermaidCode: string
  excalidrawElements: any[]
  title: string
}

export interface HistoryItem {
  id: string
  timestamp: number
  type: DiagramType
  preview: string
  state: DiagramState
}

export interface MermaidConfig {
  theme: 'dark' | 'default' | 'forest' | 'neutral'
}

export const SUPPORTED_MODELS = [
  { id: 'gpt-5.1', name: 'GPT 5.1' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
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
