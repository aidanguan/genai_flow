# AI 图形应用开发设计文档

## 1. 项目概述

### 1.1 项目目标

构建一个基于 AI 的图形生成应用，支持用户通过自然语言描述自动生成流程图、架构图、数据结构图等多种技术图形。系统提供 Mermaid 和 Excalidraw 两种渲染引擎，支持在线编辑、团队实时协作、多格式导出等核心功能。

### 1.2 核心价值

- 降低技术图形绘制门槛，通过自然语言即可快速生成专业图形
- 支持多种图形类型和渲染方式，满足不同场景需求
- 提供团队实时协作能力，提升团队沟通效率
- 丰富的模板库和编辑功能，兼顾效率与灵活性

### 1.3 技术栈选型

| 层次 | 技术选型 | 说明 |
|------|---------|------|
| 前端框架 | Vue 3 + TypeScript | 现代化前端框架,类型安全 |
| UI 组件库 | Tailwind CSS | 实用优先的 CSS 框架 |
| 图标库 | lucide-vue-next | 轻量级图标库 |
| 后端框架 | Python FastAPI | 高性能异步 API 框架 |
| 数据库 | MySQL | 关系型数据库,存储用户和图形数据 |
| 图形渲染 | Mermaid.js + Excalidraw | 双引擎支持 |
| 图形转换 | mermaid-to-excalidraw | Mermaid 到 Excalidraw 转换 |
| AI 模型 | Google Gemini 3, GPT-5.1 (via AIHubMix) | 自然语言理解与转换 |
| 实时通信 | WebSocket | 支持实时协同编辑 |
| 部署方式 | Docker (单机部署) | 容器化部署 |

## 2. 系统架构设计

### 2.1 整体架构

系统采用前后端分离架构，通过 RESTful API 和 WebSocket 进行通信。

```mermaid
graph TB
    subgraph 客户端层
        A[Vue 前端应用]
        A1[Mermaid 渲染器]
        A2[Excalidraw 编辑器]
        A3[实时协作客户端]
    end
    
    subgraph 网关层
        B[Nginx 反向代理]
    end
    
    subgraph 应用层
        C[FastAPI 服务]
        C1[认证授权模块]
        C2[AI 处理模块]
        C3[图形管理模块]
        C4[WebSocket 服务]
    end
    
    subgraph 外部服务
        D1[Google Gemini API]
        D2[AIHubMix API]
    end
    
    subgraph 数据层
        E[MySQL 数据库]
        F[Redis 缓存]
        G[文件存储]
    end
    
    A -->|HTTP/WS| B
    B --> C
    C --> C1
    C --> C2
    C --> C3
    C --> C4
    C2 -->|API 调用| D1
    C2 -->|API 调用| D2
    C --> E
    C --> F
    C --> G
    A1 -.->|渲染| A
    A2 -.->|渲染| A
    A3 -.->|WebSocket| C4
```

### 2.2 核心模块划分

| 模块名称 | 职责范围 | 关键功能 |
|---------|---------|---------|
| 用户认证模块 | 用户身份管理 | 注册、登录、JWT 令牌管理 |
| AI 转换模块 | 自然语言处理 | 接收用户输入，调用 AI 模型生成 Mermaid/Excalidraw 数据 |
| 图形管理模块 | 图形生命周期管理 | 创建、保存、查询、更新、删除图形 |
| 渲染引擎模块 | 前端图形渲染 | Mermaid.js 渲染、Excalidraw 集成 |
| 导出模块 | 格式转换与导出 | 将图形导出为 PNG、SVG、PDF 格式 |
| 协作模块 | 实时协同编辑 | WebSocket 通信、操作同步、冲突处理 |
| 模板管理模块 | 模板库管理 | 提供分类模板、模板应用 |
| 权限管理模块 | 访问控制 | 个人文件、团队文件访问控制 |

## 3. 前端界面设计

### 3.1 整体布局结构

系统采用经典的三栏布局,从参考项目提炼的设计理念:

```mermaid
graph LR
    A[侧边栏<br/>导航与历史] --> B[编辑面板<br/>提示词+代码]
    B --> C[画布区域<br/>图形渲染]
```

#### 3.1.1 布局区域划分

| 区域 | 宽度 | 功能 | 可折叠 |
|------|------|------|--------|
| 左侧边栏 | 256px (展开) / 64px (折叠) | 模式切换、模板库、历史记录、用户信息 | 是 |
| 中间编辑面板 | 400px 固定 | AI 提示词输入、Mermaid 代码编辑 | 代码区可折叠 |
| 右侧画布区 | 自适应剩余空间 | 图形渲染、交互编辑、工具栏 | 否 |

#### 3.1.2 顶部导航栏

| 区域 | 内容 | 功能 |
|------|------|------|
| 左侧 | 文档标题 + 自动保存状态 | 显示当前图形名称,实时保存提示 |
| 右侧 | 主题切换 + 协作按钮 + 分享按钮 | 暗黑/明亮模式切换,团队协作入口,分享功能 |

### 3.2 左侧边栏详细设计

#### 3.2.1 应用标识区

- 位置:侧边栏顶部,高度 56px
- 内容:应用 Logo (渐变蓝紫色正方形图标) + 应用名称 "DiagramAI"
- 折叠状态:仅显示 Logo 图标

#### 3.2.2 模式切换器

设计规格:

| 元素 | 展开状态 | 折叠状态 |
|------|---------|----------|
| 布局 | 2列网格 | 2行垂直堆叠 |
| Mermaid 按钮 | 蓝色激活态 (bg-blue-600) | 显示字母 "M" |
| Excalidraw 按钮 | 紫色激活态 (bg-violet-600) | 显示字母 "E" |
| 背景 | 浅灰色容器 (bg-slate-100) | 同左 |

#### 3.2.3 模板库

显示逻辑:
- 仅展示与当前模式匹配的模板
- 折叠状态:显示模板名称首字母
- 展开状态:完整模板名称 + 悬浮显示右箭头
- 预设模板:流程图、时序图、类图等

#### 3.2.4 历史记录

| 特性 | 设计方案 |
|------|----------|
| 显示数量 | 最近 5 条 |
| 卡片内容 | 标题、类型标签 (蓝色/紫色)、日期 |
| 折叠状态 | 仅显示时钟图标 |
| 交互 | 点击加载历史图形到画布 |
| 存储 | 本地 LocalStorage (前端) + 数据库 (后端) |

#### 3.2.5 底部用户区

- 用户头像:渐变圆形头像 (emerald-cyan 渐变)
- 用户信息:用户名 + 套餐类型
- 折叠按钮:展开/收起侧边栏切换按钮

### 3.3 中间编辑面板设计

#### 3.3.1 AI 提示词输入区

视觉设计:

| 元素 | 样式规格 |
|------|----------|
| 外层容器 | 渐变光晕效果 (蓝紫渐变 blur) |
| 输入框 | 多行文本域,最小高度 160px |
| 占位文本 | 灰色提示 + 示例说明 |
| 模型选择器 | 下拉菜单,位于右上角 |
| 发送按钮 | 蓝色主题 (bg-blue-600) + 发送图标 |
| 快捷键提示 | "Ctrl + Enter to send" |
| 底部提示 | "Powered by Gemini" 小字提示 |

交互逻辑:
- 键盘快捷键:Ctrl/Cmd + Enter 触发生成
- 加载状态:按钮显示旋转加载动画
- 禁用状态:生成中禁用输入和按钮

#### 3.3.2 Mermaid 代码编辑器

布局设计:

```mermaid
stateDiagram-v2
    [*] --> 展开状态: 默认
    展开状态 --> 折叠状态: 点击关闭
    折叠状态 --> 展开状态: 点击展开
    
    展开状态 : 占用50%高度
    展开状态 : 显示代码编辑器
    折叠状态 : 仅显示标题栏(40px)
```

编辑器功能:

| 功能 | 实现方式 |
|------|----------|
| 行号显示 | 左侧行号列 (灰色背景) |
| 语法高亮 | 等宽字体 (font-mono) |
| 自动同步 | 开关按钮控制实时渲染 |
| 文档链接 | 快速访问 Mermaid 官方文档 |
| 代码编辑 | 原生 textarea 实现,支持滚动 |

标题栏设计:
- 左侧:代码图标 + "Code" 标签
- 右侧:自动同步开关 + 文档按钮 + 关闭/展开按钮
- 背景:浅灰色 (bg-slate-100)

#### 3.3.3 Excalidraw 模式提示

当切换到 Excalidraw 模式时,编辑面板下半部分显示:
- 居中提示文本:"Excalidraw Mode"
- 说明文字:"Use the canvas to edit elements directly."
- 半透明样式,提示用户直接在画布操作

### 3.4 右侧画布区域设计

#### 3.4.1 通用画布特性

| 特性 | 设计方案 |
|------|----------|
| 背景 | 浅灰色 (bg-slate-100) + 点状网格 |
| 加载蒙层 | 全屏半透明 + 模糊背景 + 加载动画 |
| 加载动画 | 蓝色旋转图标 + 渐变光晕脉冲效果 |
| 加载文案 | "Architecting Diagram..." + 副标题 |

#### 3.4.2 Mermaid 画布工具栏

浮动工具栏设计:

位置:画布顶部居中,距顶部 24px
样式:白色半透明胶囊 (backdrop-blur) + 阴影

工具分组:

**第一组:交互模式**
| 工具 | 图标 | 功能 |
|------|------|------|
| 选择模式 | 鼠标指针 | 双击节点可编辑文本 |
| 平移模式 | 手掌图标 | 拖拽移动画布 |

**第二组:图形元素**
| 工具 | 图标 | 功能 |
|------|------|------|
| 矩形 | Square | 插入矩形节点语法 |
| 圆形 | Circle | 插入圆形节点语法 |
| 菱形 | Diamond | 插入决策节点语法 |
| 箭头 | ArrowRight | 插入连接箭头语法 |
| 用户图标 | User | 插入带图标节点语法 |

**第三组:配置**
| 工具 | 图标 | 功能 |
|------|------|------|
| 主题 | Palette | 下拉菜单:dark/default/forest/neutral |
| 方向 | MoveVertical/Horizontal | 切换 TD/LR 布局方向 |

**第四组:导出**
| 工具 | 图标 | 功能 |
|------|------|------|
| 导出 | Image | 下拉菜单:SVG/PNG/转 Excalidraw |

#### 3.4.3 缩放控制器

位置:画布右下角,距边缘 24px
布局:横向排列

| 按钮 | 功能 | 显示内容 |
|------|------|----------|
| 缩小 | scale - 0.1 | ZoomOut 图标 |
| 比例显示 | 重置为 100% | 当前缩放百分比 |
| 放大 | scale + 0.1 | ZoomIn 图标 |
| 适应画布 | 重置位置和缩放 | Maximize 图标 |

#### 3.4.4 画布交互能力

**Mermaid 画布:**

| 交互 | 触发方式 | 功能 |
|------|---------|------|
| 平移 | 平移模式 + 拖拽 / 鼠标中键拖拽 | 移动画布视图 |
| 缩放 | Ctrl/Cmd + 鼠标滚轮 | 放大缩小图形 |
| 编辑节点 | 选择模式 + 双击节点 | 弹出文本编辑框,修改节点文本 |
| 保存编辑 | Enter 键 / 失焦 | 自动替换代码中的文本 |

节点编辑框设计:
- 浮动定位在节点上方
- 白色背景 + 蓝色边框
- 按 Enter 确认,按 Esc 取消
- 自动匹配节点大小

**Excalidraw 画布:**

使用 Excalidraw 原生交互:
- 自由绘制和拖拽
- 丰富的图形工具
- 手绘风格
- 颜色和样式调整

#### 3.4.5 错误状态显示

当 Mermaid 语法错误时:
- 居中显示错误卡片
- 红色警告图标
- 错误标题:"Rendering Failed"
- 错误详情:等宽字体显示错误信息
- 白色半透明背景 + 模糊效果

### 3.5 主题系统设计

#### 3.5.1 暗黑模式

| 元素 | 暗黑模式颜色 | 明亮模式颜色 |
|------|-------------|-------------|
| 页面背景 | slate-950 (#0f172a) | slate-50 (#f8fafc) |
| 侧边栏背景 | slate-950 | white |
| 编辑面板背景 | slate-900 (#0f172a) | white |
| 画布背景 | slate-800 (#1e293b) | slate-100 |
| 边框颜色 | slate-800 | slate-200 |
| 主要文本 | slate-100 | slate-900 |
| 次要文本 | slate-400 | slate-500 |
| 输入框背景 | slate-950 | white |
| 代码编辑器背景 | #0d1117 (GitHub 暗色) | white |

#### 3.5.2 主题切换

- 切换按钮:顶部导航栏右侧
- 图标:太阳 (明亮模式) / 月亮 (暗黑模式)
- 过渡动画:300ms 颜色渐变
- 默认主题:暗黑模式
- Mermaid 主题同步:暗黑模式使用 'dark' 主题
- Excalidraw 主题同步:自动切换 dark/light 主题

### 3.6 响应式设计

| 断点 | 适配策略 |
|------|----------|
| < 768px | 隐藏侧边栏,通过汉堡菜单调出;编辑面板宽度自适应 |
| 768px - 1024px | 侧边栏默认折叠;编辑面板 350px |
| > 1024px | 完整三栏布局;编辑面板 400px |

### 3.7 动画与过渡效果

| 场景 | 动画效果 |
|------|----------|
| 侧边栏展开/折叠 | 300ms 宽度过渡 |
| 代码编辑器展开/折叠 | 300ms 高度过渡 |
| 下拉菜单显示 | fade-in + zoom-in (200ms) |
| 按钮激活 | transform scale(0.95) |
| 主题切换 | 300ms 颜色过渡 |
| 加载蒙层 | fade-in + 脉冲光晕动画 |
| 工具栏悬浮 | 背景色渐变 + 阴影增强 |

### 3.8 辅助功能与用户体验

| 功能 | 实现方式 |
|------|----------|
| 键盘快捷键 | Ctrl+Enter 生成,Escape 关闭菜单/编辑 |
| 工具提示 | 所有图标按钮显示 title 提示 |
| 焦点管理 | 弹窗自动聚焦,Tab 键导航 |
| 加载反馈 | 按钮旋转动画 + 全屏蒙层 |
| 错误提示 | Alert 弹窗 + 画布错误卡片 |
| 自动保存提示 | 顶部 "Auto-saved" 标签 |
| 点击外部关闭 | 菜单和编辑框监听外部点击 |

## 4. 功能设计

### 4.1 AI 图形生成流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端API
    participant AI as AI模型
    participant DB as 数据库
    participant R as 渲染引擎
    
    U->>F: 输入自然语言描述
    F->>B: 发送生成请求
    B->>AI: 调用AI模型(Gemini/GPT)
    AI->>B: 返回Mermaid/Excalidraw语法
    B->>DB: 保存原始数据
    B->>DB: 生成并保存图片缓存
    B->>F: 返回图形数据
    F->>R: 渲染图形
    R->>F: 显示图形
    F->>U: 展示结果
```

#### 4.1.1 AI 模型配置

AI 模型配置通过环境变量管理，存储在 `.env` 文件中：

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| AI_PROVIDER | 当前使用的 AI 提供商 | gemini / aihubmix |
| GEMINI_API_KEY | Google Gemini API 密钥 | - |
| GEMINI_MODEL | Gemini 模型版本 | gemini-3-pro |
| AIHUBMIX_API_KEY | AIHubMix API 密钥 | - |
| AIHUBMIX_BASE_URL | AIHubMix API 地址 | https://api.aihubmix.com |
| AIHUBMIX_MODEL | AIHubMix 模型名称 | gpt-5.1 |
| AI_MAX_TOKENS | 最大生成令牌数 | 2048 |
| AI_TEMPERATURE | 生成温度参数 | 0.7 |

#### 4.1.2 提示词策略

系统针对不同图形类型设计专门的提示词模板：

| 图形类型 | 提示词重点 | 输出格式 |
|---------|-----------|---------|
| 流程图 | 强调步骤顺序、决策分支、开始结束节点 | Mermaid flowchart 语法 |
| 架构图 | 强调组件关系、层次结构、数据流向 | Mermaid graph 语法 |
| 数据结构图 | 强调实体关系、字段类型、主外键 | Mermaid ER 或 classDiagram 语法 |
| 时序图 | 强调交互顺序、参与者、消息传递 | Mermaid sequenceDiagram 语法 |
| 自由画板 | 强调空间布局、图形元素、连接关系 | Excalidraw JSON 格式 |

### 4.2 双渲染引擎设计

系统支持两种渲染引擎，用户可根据需求选择：

#### 4.2.1 Mermaid 渲染引擎

| 特性 | 设计方案 |
|------|---------|
| 渲染方式 | 前端通过 Mermaid.js 库将文本语法实时渲染为 SVG |
| 编辑能力 | 用户可直接编辑 Mermaid 语法文本，实时预览 |
| 样式定制 | 支持主题切换、颜色配置、字体大小调整 |
| 支持图形类型 | 流程图、时序图、类图、甘特图、ER图、状态图等 |

#### 4.2.2 Excalidraw 渲染引擎

| 特性 | 设计方案 |
|------|---------|
| 集成方式 | 嵌入 Excalidraw 开源组件，使用其原生编辑器 |
| 编辑能力 | 支持拖拽、手绘风格、图形元素自由编排 |
| 样式定制 | 支持颜色、线条粗细、填充样式、字体等全面定制 |
| 在线评论 | 在画布上添加评论标记，支持线程式讨论 |
| 数据格式 | Excalidraw JSON 格式，包含所有元素和样式信息 |

### 4.3 编辑与样式调整

```mermaid
stateDiagram-v2
    [*] --> 查看模式
    查看模式 --> 编辑模式: 点击编辑
    编辑模式 --> 查看模式: 保存/取消
    
    编辑模式 --> 修改内容: Mermaid语法编辑
    编辑模式 --> 图形编辑: Excalidraw拖拽
    编辑模式 --> 样式调整: 打开样式面板
    
    样式调整 --> 颜色设置
    样式调整 --> 主题切换
    样式调整 --> 字体调整
    样式调整 --> 线条样式
    
    修改内容 --> 实时预览
    图形编辑 --> 实时预览
    样式调整 --> 实时预览
    
    实时预览 --> 编辑模式: 继续编辑
    实时预览 --> 查看模式: 保存
```

#### 4.3.1 样式配置选项

| 配置类别 | Mermaid 支持 | Excalidraw 支持 |
|---------|-------------|----------------|
| 主题模板 | 内置主题(default, forest, dark, neutral) | 自定义配色方案 |
| 颜色设置 | 节点颜色、边框颜色、文字颜色 | 元素填充色、边框色、文字色、背景色 |
| 字体设置 | 字体大小、字体族 | 字体族、字体大小、字体样式(粗体/斜体) |
| 线条样式 | 线条类型(实线/虚线)、箭头样式 | 线条粗细、线条类型、箭头类型、圆角 |
| 布局方向 | TB(从上到下)、LR(从左到右) | 自由布局 |

### 4.4 多格式导出

系统支持将图形导出为多种格式，满足不同使用场景：

| 导出格式 | 实现方式 | 使用场景 |
|---------|---------|---------|
| PNG | 前端通过 Canvas API 将 SVG 转换为位图 | 嵌入文档、分享预览 |
| SVG | Mermaid 直接输出 SVG；Excalidraw 通过导出 API 生成 | 矢量图编辑、高质量打印 |
| PDF | 后端使用 Python 库(如 weasyprint)将 SVG/Canvas 转换为 PDF | 正式文档、报告 |

导出流程设计：

```mermaid
flowchart LR
    A[用户选择导出格式] --> B{格式类型}
    B -->|PNG| C[前端Canvas渲染]
    B -->|SVG| D[前端直接导出SVG]
    B -->|PDF| E[发送至后端]
    
    C --> F[生成Blob]
    D --> F
    E --> G[后端转换为PDF]
    G --> H[返回PDF文件]
    
    F --> I[浏览器下载]
    H --> I
```

### 4.5 用户认证与历史记录

#### 4.5.1 用户认证流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant B as 后端
    participant DB as 数据库
    
    U->>F: 注册/登录
    F->>B: 提交凭证
    B->>DB: 验证用户信息
    DB->>B: 返回用户数据
    B->>B: 生成JWT令牌
    B->>F: 返回令牌和用户信息
    F->>F: 存储令牌(localStorage)
    F->>U: 登录成功
    
    U->>F: 后续API请求
    F->>B: 请求头携带JWT
    B->>B: 验证令牌
    B->>F: 返回响应
```

#### 4.5.2 历史图形管理

用户的历史图形支持以下操作：

| 功能 | 说明 |
|------|------|
| 列表查看 | 按创建时间倒序展示用户所有图形，支持分页 |
| 快速搜索 | 根据图形标题、类型、标签进行模糊搜索 |
| 分类筛选 | 按图形类型(流程图/架构图等)、渲染引擎筛选 |
| 重新编辑 | 加载历史图形数据，进入编辑模式 |
| 版本历史 | 记录图形的修改历史，支持版本回退 |
| 删除管理 | 软删除机制，30天内可恢复 |

### 4.6 团队实时协作

#### 4.6.1 协作模式

系统支持多用户同时编辑同一图形，实现类似 Google Docs 的实时协同：

```mermaid
graph TB
    A[用户A打开图形] --> B[建立WebSocket连接]
    C[用户B打开同一图形] --> B
    D[用户C打开同一图形] --> B
    
    B --> E[协作房间]
    
    E --> F{操作类型}
    F -->|编辑| G[广播操作到其他用户]
    F -->|光标移动| H[显示其他用户光标]
    F -->|选中元素| I[高亮显示]
    
    G --> J[操作转换OT算法]
    J --> K[应用到本地副本]
    K --> L[实时渲染更新]
```

#### 4.6.2 冲突处理策略

| 场景 | 处理策略 |
|------|---------|
| 同时编辑同一元素 | 使用操作转换(OT)算法或 CRDT 数据结构保证最终一致性 |
| 网络延迟 | 客户端乐观更新，服务端确认后同步 |
| 连接断开 | 本地缓存操作，重连后自动同步 |
| 版本冲突 | 自动合并，无法自动合并时提示用户手动解决 |

#### 4.6.3 在线评论功能

支持在 Excalidraw 图形上添加评论：

| 特性 | 设计方案 |
|------|---------|
| 评论锚点 | 评论关联到具体的图形元素或坐标位置 |
| 评论线程 | 支持对评论进行回复，形成讨论线程 |
| 实时通知 | 新评论通过 WebSocket 实时推送给在线用户 |
| 评论状态 | 支持标记为已解决/未解决 |
| 权限控制 | 根据文件权限控制评论的查看和添加 |

### 4.7 模板库

提供丰富的预设模板，加速图形创建：

#### 4.7.1 模板分类

| 分类 | 模板示例 | 数量 |
|------|---------|------|
| 流程图模板 | 审批流程、业务流程、算法流程 | 10+ |
| 架构图模板 | 微服务架构、前后端分离架构、云原生架构 | 15+ |
| 数据结构图模板 | 常见数据库表结构、ER图模板 | 10+ |
| 时序图模板 | 登录流程、支付流程、消息传递 | 8+ |
| 组织结构图模板 | 公司组织架构、项目团队架构 | 5+ |
| 思维导图模板 | 项目规划、知识梳理 | 5+ |

#### 4.7.2 模板应用流程

```mermaid
flowchart TD
    A[用户选择创建图形] --> B{选择方式}
    B -->|从模板创建| C[浏览模板库]
    B -->|从头创建| D[输入自然语言]
    
    C --> E[选择模板分类]
    E --> F[预览模板]
    F --> G[应用模板]
    G --> H[加载模板数据]
    
    D --> I[AI生成图形]
    
    H --> J[进入编辑模式]
    I --> J
    
    J --> K[用户自定义编辑]
    K --> L[保存图形]
```

## 5. 数据模型设计

### 5.1 核心数据实体

#### 5.1.1 用户表 (users)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 用户唯一标识 |
| username | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| email | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱 |
| password_hash | VARCHAR(255) | NOT NULL | 密码哈希 |
| avatar_url | VARCHAR(500) | NULL | 头像URL |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| is_active | BOOLEAN | DEFAULT TRUE | 账号状态 |

#### 5.1.2 图形表 (diagrams)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 图形唯一标识 |
| user_id | BIGINT | FOREIGN KEY, NOT NULL | 创建者ID |
| title | VARCHAR(200) | NOT NULL | 图形标题 |
| diagram_type | ENUM | NOT NULL | 图形类型(flowchart, sequence, er, class等) |
| render_engine | ENUM | NOT NULL | 渲染引擎(mermaid, excalidraw) |
| mermaid_code | TEXT | NULL | Mermaid 语法代码 |
| excalidraw_data | JSON | NULL | Excalidraw JSON 数据 |
| thumbnail_url | VARCHAR(500) | NULL | 缩略图URL |
| cache_image_url | VARCHAR(500) | NULL | 渲染后图片缓存URL |
| description | TEXT | NULL | 图形描述 |
| tags | JSON | NULL | 标签数组 |
| is_public | BOOLEAN | DEFAULT FALSE | 是否公开 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |
| is_deleted | BOOLEAN | DEFAULT FALSE | 软删除标记 |
| deleted_at | TIMESTAMP | NULL | 删除时间 |

#### 5.1.3 团队表 (teams)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 团队唯一标识 |
| name | VARCHAR(100) | NOT NULL | 团队名称 |
| owner_id | BIGINT | FOREIGN KEY, NOT NULL | 团队所有者ID |
| description | TEXT | NULL | 团队描述 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

#### 5.1.4 团队成员表 (team_members)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| team_id | BIGINT | FOREIGN KEY, NOT NULL | 团队ID |
| user_id | BIGINT | FOREIGN KEY, NOT NULL | 用户ID |
| role | ENUM | NOT NULL | 角色(owner, admin, member) |
| joined_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 加入时间 |

#### 5.1.5 图形权限表 (diagram_permissions)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 记录ID |
| diagram_id | BIGINT | FOREIGN KEY, NOT NULL | 图形ID |
| entity_type | ENUM | NOT NULL | 实体类型(user, team) |
| entity_id | BIGINT | NOT NULL | 实体ID |
| permission | ENUM | NOT NULL | 权限(view, edit) |
| granted_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 授权时间 |

#### 5.1.6 版本历史表 (diagram_versions)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 版本ID |
| diagram_id | BIGINT | FOREIGN KEY, NOT NULL | 图形ID |
| version_number | INT | NOT NULL | 版本号 |
| mermaid_code | TEXT | NULL | Mermaid 代码快照 |
| excalidraw_data | JSON | NULL | Excalidraw 数据快照 |
| changed_by | BIGINT | FOREIGN KEY, NOT NULL | 修改者ID |
| change_description | VARCHAR(500) | NULL | 修改说明 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

#### 5.1.7 评论表 (comments)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 评论ID |
| diagram_id | BIGINT | FOREIGN KEY, NOT NULL | 图形ID |
| user_id | BIGINT | FOREIGN KEY, NOT NULL | 评论者ID |
| parent_id | BIGINT | FOREIGN KEY, NULL | 父评论ID(用于回复) |
| content | TEXT | NOT NULL | 评论内容 |
| position_x | FLOAT | NULL | X坐标(Excalidraw) |
| position_y | FLOAT | NULL | Y坐标(Excalidraw) |
| element_id | VARCHAR(100) | NULL | 关联元素ID |
| is_resolved | BOOLEAN | DEFAULT FALSE | 是否已解决 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | ON UPDATE CURRENT_TIMESTAMP | 更新时间 |

#### 5.1.8 模板表 (templates)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 模板ID |
| name | VARCHAR(100) | NOT NULL | 模板名称 |
| category | VARCHAR(50) | NOT NULL | 模板分类 |
| diagram_type | ENUM | NOT NULL | 图形类型 |
| render_engine | ENUM | NOT NULL | 渲染引擎 |
| mermaid_code | TEXT | NULL | Mermaid 代码 |
| excalidraw_data | JSON | NULL | Excalidraw 数据 |
| thumbnail_url | VARCHAR(500) | NOT NULL | 预览图URL |
| description | TEXT | NULL | 模板描述 |
| usage_count | INT | DEFAULT 0 | 使用次数 |
| is_featured | BOOLEAN | DEFAULT FALSE | 是否精选 |
| created_at | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 5.2 数据关系图

```mermaid
erDiagram
    users ||--o{ diagrams : creates
    users ||--o{ team_members : belongs_to
    users ||--o{ comments : writes
    users ||--o{ diagram_versions : modifies
    
    teams ||--o{ team_members : has
    teams ||--o{ diagram_permissions : granted_to
    
    diagrams ||--o{ diagram_permissions : has
    diagrams ||--o{ diagram_versions : has
    diagrams ||--o{ comments : has
    
    comments ||--o{ comments : replies_to
    
    templates ||--o{ diagrams : generates
```

## 6. API 设计

### 6.1 认证相关 API

| 端点 | 方法 | 功能 | 请求参数 | 响应数据 |
|------|------|------|---------|---------|
| /api/auth/register | POST | 用户注册 | username, email, password | user_id, token |
| /api/auth/login | POST | 用户登录 | email, password | user_id, token, user_info |
| /api/auth/logout | POST | 用户登出 | - | success |
| /api/auth/refresh | POST | 刷新令牌 | refresh_token | new_token |
| /api/users/me | GET | 获取当前用户信息 | - | user_info |
| /api/users/me | PATCH | 更新用户信息 | username, avatar_url | updated_user_info |

### 6.2 AI 生成相关 API

| 端点 | 方法 | 功能 | 请求参数 | 响应数据 |
|------|------|------|---------|---------|
| /api/ai/generate | POST | AI 生成图形 | prompt, diagram_type, render_engine | diagram_id, diagram_data |
| /api/ai/regenerate | POST | 重新生成图形 | diagram_id, prompt | updated_diagram_data |
| /api/ai/optimize | POST | 优化现有图形 | diagram_id, optimization_hint | optimized_data |

### 6.3 图形管理 API

| 端点 | 方法 | 功能 | 请求参数 | 响应数据 |
|------|------|------|---------|---------|
| /api/diagrams | GET | 获取图形列表 | page, size, type, search | diagram_list, total |
| /api/diagrams | POST | 创建图形 | title, diagram_type, render_engine, data | diagram_id |
| /api/diagrams/{id} | GET | 获取图形详情 | - | diagram_detail |
| /api/diagrams/{id} | PATCH | 更新图形 | title, data, tags | success |
| /api/diagrams/{id} | DELETE | 删除图形 | - | success |
| /api/diagrams/{id}/versions | GET | 获取版本历史 | - | version_list |
| /api/diagrams/{id}/versions/{version_id} | POST | 恢复到指定版本 | - | success |

### 6.4 导出相关 API

| 端点 | 方法 | 功能 | 请求参数 | 响应数据 |
|------|------|------|---------|---------|
| /api/export/png | POST | 导出 PNG | diagram_id, width, height | image_url |
| /api/export/svg | POST | 导出 SVG | diagram_id | svg_content |
| /api/export/pdf | POST | 导出 PDF | diagram_id, page_size | pdf_url |

### 6.5 团队协作 API

| 端点 | 方法 | 功能 | 请求参数 | 响应数据 |
|------|------|------|---------|---------|
| /api/teams | GET | 获取团队列表 | - | team_list |
| /api/teams | POST | 创建团队 | name, description | team_id |
| /api/teams/{id}/members | GET | 获取团队成员 | - | member_list |
| /api/teams/{id}/members | POST | 添加团队成员 | user_id, role | success |
| /api/teams/{id}/members/{user_id} | DELETE | 移除团队成员 | - | success |
| /api/diagrams/{id}/permissions | GET | 获取图形权限 | - | permission_list |
| /api/diagrams/{id}/permissions | POST | 授予权限 | entity_type, entity_id, permission | success |
| /api/diagrams/{id}/permissions/{permission_id} | DELETE | 撤销权限 | - | success |

### 6.6 评论相关 API

| 端点 | 方法 | 功能 | 请求参数 | 响应数据 |
|------|------|------|---------|---------|
| /api/diagrams/{id}/comments | GET | 获取评论列表 | - | comment_list |
| /api/diagrams/{id}/comments | POST | 添加评论 | content, position_x, position_y, element_id, parent_id | comment_id |
| /api/comments/{id} | PATCH | 更新评论 | content, is_resolved | success |
| /api/comments/{id} | DELETE | 删除评论 | - | success |

### 6.7 模板相关 API

| 端点 | 方法 | 功能 | 请求参数 | 响应数据 |
|------|------|------|---------|---------|
| /api/templates | GET | 获取模板列表 | category, diagram_type | template_list |
| /api/templates/{id} | GET | 获取模板详情 | - | template_detail |
| /api/templates/{id}/use | POST | 使用模板创建图形 | title | diagram_id |

### 6.8 WebSocket 协议

实时协作通过 WebSocket 实现，路径为 `/ws/diagrams/{diagram_id}`

#### 6.8.1 消息类型

| 消息类型 | 方向 | 说明 | 数据结构 |
|---------|------|------|---------|
| join | Client -> Server | 用户加入协作 | {user_id, user_name} |
| leave | Client -> Server | 用户离开协作 | {user_id} |
| edit | Client -> Server | 编辑操作 | {operation, data, timestamp} |
| cursor | Client -> Server | 光标位置 | {user_id, x, y} |
| user_joined | Server -> Client | 通知用户加入 | {user_id, user_name} |
| user_left | Server -> Client | 通知用户离开 | {user_id} |
| operation | Server -> Client | 广播编辑操作 | {user_id, operation, data} |
| cursor_update | Server -> Client | 广播光标位置 | {user_id, x, y} |

## 7. 部署架构设计

### 7.1 Docker 容器化设计

系统采用单机 Docker 部署方案，所有服务通过容器编排：

```mermaid
graph TB
    subgraph Docker Host
        A[Nginx 容器<br/>端口: 80, 443]
        B[Vue 前端容器<br/>端口: 8080]
        C[FastAPI 后端容器<br/>端口: 8000]
        D[MySQL 容器<br/>端口: 3306]
        E[Redis 容器<br/>端口: 6379]
        
        A --> B
        A --> C
        C --> D
        C --> E
    end
    
    F[外部用户] --> A
    C -.->|API调用| G[AI 服务<br/>Gemini/AIHubMix]
```

### 7.2 容器配置

#### 7.2.1 Nginx 容器

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 基础镜像 | nginx:alpine | 轻量级 Nginx 镜像 |
| 端口映射 | 80:80, 443:443 | HTTP 和 HTTPS 端口 |
| 配置挂载 | ./nginx.conf:/etc/nginx/nginx.conf | Nginx 配置文件 |
| SSL 证书挂载 | ./ssl:/etc/nginx/ssl | SSL 证书目录 |
| 静态资源挂载 | ./dist:/usr/share/nginx/html | 前端构建产物 |

#### 7.2.2 Vue 前端容器

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 基础镜像 | node:18-alpine | Node.js 运行环境 |
| 构建阶段 | npm run build | 生成静态文件 |
| 运行方式 | 静态文件由 Nginx 提供 | - |

#### 7.2.3 FastAPI 后端容器

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 基础镜像 | python:3.11-slim | Python 运行环境 |
| 端口映射 | 8000:8000 | FastAPI 服务端口 |
| 环境变量文件 | .env | AI 配置等环境变量 |
| 数据卷挂载 | ./uploads:/app/uploads | 文件上传目录 |
| 启动命令 | uvicorn main:app --host 0.0.0.0 | 启动 FastAPI 服务 |

#### 7.2.4 MySQL 容器

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 基础镜像 | mysql:8.0 | MySQL 数据库 |
| 端口映射 | 3306:3306 | 数据库端口 |
| 数据卷挂载 | ./mysql_data:/var/lib/mysql | 数据持久化 |
| 初始化脚本 | ./init.sql:/docker-entrypoint-initdb.d/init.sql | 数据库初始化 |
| 环境变量 | MYSQL_ROOT_PASSWORD, MYSQL_DATABASE | 数据库配置 |

#### 7.2.5 Redis 容器

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 基础镜像 | redis:alpine | Redis 缓存 |
| 端口映射 | 6379:6379 | Redis 端口 |
| 数据卷挂载 | ./redis_data:/data | 数据持久化 |
| 启动命令 | redis-server --appendonly yes | 开启 AOF 持久化 |

### 7.3 环境变量配置

.env 文件包含以下配置项：

| 配置项 | 说明 | 示例值 |
|--------|------|--------|
| DATABASE_URL | MySQL 连接字符串 | mysql://user:pass@mysql:3306/aidia |
| REDIS_URL | Redis 连接字符串 | redis://redis:6379/0 |
| JWT_SECRET_KEY | JWT 密钥 | your-secret-key |
| JWT_ALGORITHM | JWT 算法 | HS256 |
| JWT_EXPIRE_MINUTES | JWT 过期时间(分钟) | 1440 |
| AI_PROVIDER | AI 提供商 | gemini |
| GEMINI_API_KEY | Gemini API 密钥 | - |
| GEMINI_MODEL | Gemini 模型 | gemini-3-pro |
| AIHUBMIX_API_KEY | AIHubMix API 密钥 | - |
| AIHUBMIX_BASE_URL | AIHubMix API 地址 | https://api.aihubmix.com |
| AIHUBMIX_MODEL | AIHubMix 模型 | gpt-5.1 |
| UPLOAD_DIR | 文件上传目录 | /app/uploads |
| MAX_FILE_SIZE | 最大文件大小(MB) | 10 |

### 7.4 部署流程

```mermaid
flowchart TD
    A[准备服务器环境] --> B[安装Docker和Docker Compose]
    B --> C[克隆项目代码]
    C --> D[配置.env文件]
    D --> E[执行数据库初始化脚本]
    E --> F[构建Docker镜像]
    F --> G[启动容器服务]
    G --> H[配置Nginx反向代理]
    H --> I[配置SSL证书]
    I --> J[启动服务]
    J --> K[健康检查]
    K --> L{检查通过?}
    L -->|是| M[部署完成]
    L -->|否| N[查看日志排查问题]
    N --> F
```

## 8. 安全性设计

### 8.1 认证与授权

| 安全层面 | 设计方案 |
|---------|---------|
| 密码存储 | 使用 bcrypt 进行密码哈希，加盐处理 |
| 会话管理 | 使用 JWT 令牌，设置合理过期时间 |
| 令牌刷新 | 提供 refresh token 机制，避免频繁登录 |
| API 鉴权 | 所有需要认证的 API 验证 JWT 令牌有效性 |
| 权限控制 | 基于 RBAC 模型，验证用户对资源的访问权限 |

### 8.2 数据安全

| 安全层面 | 设计方案 |
|---------|---------|
| 传输加密 | 生产环境强制使用 HTTPS |
| 敏感信息 | AI API 密钥等敏感信息存储在环境变量中，不提交到代码库 |
| SQL 注入防护 | 使用 ORM(SQLAlchemy)参数化查询 |
| XSS 防护 | 前端对用户输入进行转义，后端验证输入 |
| CSRF 防护 | 使用 CSRF Token 验证状态变更请求 |

### 8.3 访问控制

| 资源类型 | 访问控制规则 |
|---------|-------------|
| 个人图形 | 仅创建者本人可访问和编辑 |
| 共享图形 | 根据 diagram_permissions 表授权的用户可访问 |
| 团队图形 | 团队成员根据角色权限访问(owner/admin/member) |
| 公开图形 | 设置 is_public=true 的图形所有人可查看，仅创建者和授权用户可编辑 |
| 评论权限 | 有查看权限的用户可查看评论，有编辑权限的用户可添加评论 |

### 8.4 API 限流

| 限流层级 | 限制规则 | 目的 |
|---------|---------|------|
| 全局限流 | 单 IP 每分钟最多 100 次请求 | 防止 DDoS 攻击 |
| AI 接口限流 | 每用户每分钟最多 10 次 AI 生成请求 | 控制 AI API 成本 |
| 注册接口限流 | 单 IP 每小时最多 5 次注册 | 防止批量注册 |
| 导出接口限流 | 每用户每分钟最多 5 次导出请求 | 防止资源滥用 |

## 9. 性能优化策略

### 9.1 前端性能优化

| 优化点 | 方案 |
|--------|------|
| 代码分割 | 使用 Vue Router 的懒加载，按路由拆分 bundle |
| 图片优化 | 缩略图使用 WebP 格式，懒加载图片资源 |
| 缓存策略 | 静态资源启用浏览器缓存，设置合理的 Cache-Control |
| 渲染优化 | Mermaid 和 Excalidraw 使用 Web Worker 渲染，避免阻塞主线程 |
| 请求优化 | 使用 debounce 减少实时协作中的频繁请求 |

### 9.2 后端性能优化

| 优化点 | 方案 |
|--------|------|
| 数据库查询优化 | 为常用查询字段添加索引(user_id, diagram_id, created_at等) |
| 缓存策略 | 使用 Redis 缓存热点数据(模板、用户信息、图形元数据) |
| 异步处理 | 图片生成、PDF 导出等耗时操作使用异步任务队列 |
| 连接池 | 配置数据库连接池，复用连接减少开销 |
| 分页查询 | 列表接口使用分页，避免一次性加载大量数据 |

### 9.3 缓存策略

| 缓存对象 | 缓存位置 | 缓存时长 | 更新策略 |
|---------|---------|---------|---------|
| 用户信息 | Redis | 1小时 | 用户信息更新时主动失效 |
| 模板列表 | Redis | 24小时 | 模板更新时主动失效 |
| 图形缩略图 | 文件存储 + CDN | 永久 | 图形更新时重新生成 |
| 渲染图片缓存 | 文件存储 | 永久 | 图形内容变更时重新生成 |
| API 响应 | Redis | 5分钟 | 读多写少的查询接口 |

### 9.4 WebSocket 性能优化

| 优化点 | 方案 |
|--------|------|
| 消息批处理 | 短时间内的多个操作合并为一条消息广播 |
| 压缩传输 | 启用 WebSocket 消息压缩 |
| 心跳机制 | 定期发送心跳包，及时清理断开的连接 |
| 连接池 | 限制单个图形的最大同时在线用户数，避免过载 |

## 10. 扩展性设计

### 10.1 AI 模型扩展

系统设计为插件化的 AI 提供商架构，方便后续接入新的 AI 模型：

```mermaid
classDiagram
    class AIProvider {
        <<interface>>
        +generate(prompt, diagram_type)
        +validate_config()
    }
    
    class GeminiProvider {
        +api_key
        +model
        +generate(prompt, diagram_type)
        +validate_config()
    }
    
    class AIHubMixProvider {
        +api_key
        +base_url
        +model
        +generate(prompt, diagram_type)
        +validate_config()
    }
    
    class FutureProvider {
        +generate(prompt, diagram_type)
        +validate_config()
    }
    
    AIProvider <|-- GeminiProvider
    AIProvider <|-- AIHubMixProvider
    AIProvider <|-- FutureProvider
    
    class AIService {
        -provider: AIProvider
        +set_provider(provider_name)
        +generate_diagram(prompt, diagram_type)
    }
    
    AIService --> AIProvider
```

新增 AI 提供商只需：
1. 实现 AIProvider 接口
2. 在配置文件中注册新提供商
3. 添加对应的环境变量配置

### 10.2 渲染引擎扩展

当前支持 Mermaid 和 Excalidraw，未来可扩展支持其他引擎(如 Draw.io、PlantUML 等)：

| 扩展步骤 | 说明 |
|---------|------|
| 定义渲染器接口 | 包含 render()、export() 等标准方法 |
| 实现新渲染器 | 按接口实现具体渲染逻辑 |
| 注册渲染器 | 在前端注册表中添加新渲染器 |
| 数据库支持 | 在 render_engine 枚举中添加新类型 |
| AI 提示词适配 | 为新引擎定制提示词模板 |

### 10.3 功能模块扩展

| 潜在扩展功能 | 扩展方式 |
|------------|---------|
| 版本对比 | 新增版本对比 API，前端展示差异 |
| AI 智能推荐 | 根据用户历史推荐相关模板和样式 |
| 批量操作 | 支持批量导出、批量授权等 |
| 移动端适配 | 开发响应式布局或独立移动端应用 |
| 插件市场 | 支持第三方插件扩展功能(如自定义图形库) |

## 11. 监控与运维

### 11.1 日志管理

| 日志类型 | 记录内容 | 日志级别 |
|---------|---------|---------|
| 应用日志 | API 请求、业务逻辑执行、错误信息 | INFO, WARNING, ERROR |
| 访问日志 | Nginx 访问日志，记录所有 HTTP 请求 | - |
| 数据库日志 | 慢查询日志，查询时间超过 1 秒的记录 | - |
| AI 调用日志 | AI API 调用记录、响应时间、错误信息 | INFO, ERROR |
| WebSocket 日志 | 连接建立、消息传输、连接断开 | INFO, ERROR |

### 11.2 监控指标

| 监控维度 | 关键指标 | 告警阈值 |
|---------|---------|---------|
| 系统资源 | CPU 使用率、内存使用率、磁盘空间 | CPU>80%, 内存>85%, 磁盘>90% |
| 应用性能 | API 响应时间、请求成功率 | 响应时间>2s, 成功率<95% |
| 数据库 | 连接数、查询时间、慢查询数量 | 连接数>80%, 慢查询>10/分钟 |
| Redis | 内存使用率、命中率 | 内存>80%, 命中率<80% |
| AI 服务 | 调用成功率、平均响应时间 | 成功率<90%, 响应时间>5s |
| WebSocket | 活跃连接数、消息延迟 | 连接数>1000, 延迟>500ms |

### 11.3 备份策略

| 备份对象 | 备份频率 | 保留周期 | 备份方式 |
|---------|---------|---------|---------|
| MySQL 数据库 | 每天凌晨 2 点 | 30 天 | mysqldump 全量备份 |
| 用户上传文件 | 每天凌晨 3 点 | 30 天 | 文件目录增量备份 |
| Redis 数据 | 每 6 小时 | 7 天 | RDB 快照 |
| 应用配置 | 代码变更时 | 永久 | Git 版本控制 |

### 11.4 容灾恢复

| 场景 | 恢复方案 | 恢复时间目标(RTO) |
|------|---------|------------------|
| 数据库故障 | 从最近备份恢复，通过 binlog 恢复增量数据 | < 1 小时 |
| 应用服务崩溃 | Docker 自动重启容器 | < 5 分钟 |
| 服务器宕机 | 从备份恢复数据到新服务器，重新部署 | < 4 小时 |
| 数据误删除 | 从备份恢复或从回收站恢复(软删除) | < 30 分钟 |

## 12. 开发规范与最佳实践

### 12.1 代码规范

| 层次 | 规范要求 |
|------|---------|
| 前端 Vue | 遵循 Vue 3 官方风格指南，使用 ESLint + Prettier 格式化 |
| 后端 Python | 遵循 PEP 8 规范，使用 Black 格式化工具 |
| API 设计 | 遵循 RESTful 规范，使用语义化的 URL 和 HTTP 方法 |
| 命名规范 | 变量使用驼峰命名(camelCase)，常量使用大写下划线(UPPER_SNAKE_CASE) |
| 注释规范 | 关键逻辑必须添加注释，公共函数必须有文档字符串 |

### 12.2 Git 工作流

| 分支类型 | 命名规范 | 用途 |
|---------|---------|------|
| main | main | 生产环境主分支，保持稳定 |
| develop | develop | 开发主分支，集成最新功能 |
| 功能分支 | feature/功能名称 | 开发新功能 |
| 修复分支 | bugfix/问题描述 | 修复 bug |
| 发布分支 | release/版本号 | 准备发布新版本 |
| 热修复分支 | hotfix/问题描述 | 紧急修复生产环境问题 |

### 12.3 测试策略

| 测试类型 | 覆盖范围 | 工具 |
|---------|---------|------|
| 单元测试 | 核心业务逻辑、工具函数 | pytest(后端), Jest(前端) |
| 接口测试 | 所有 API 端点 | pytest + httpx |
| 集成测试 | 关键业务流程 | pytest + Docker |
| E2E 测试 | 核心用户路径 | Playwright / Cypress |
| 性能测试 | 高并发场景 | Locust / JMeter |

### 12.4 发布流程

```mermaid
flowchart LR
    A[开发完成] --> B[代码审查]
    B --> C[合并到 develop]
    C --> D[自动化测试]
    D --> E{测试通过?}
    E -->|否| F[修复问题]
    F --> B
    E -->|是| G[创建 release 分支]
    G --> H[部署到预发布环境]
    H --> I[预发布测试]
    I --> J{测试通过?}
    J -->|否| F
    J -->|是| K[合并到 main]
    K --> L[打 tag 标记版本]
    L --> M[部署到生产环境]
    M --> N[发布完成]
```

## 13. 风险评估与应对

### 13.1 技术风险

| 风险项 | 风险等级 | 影响 | 应对措施 |
|--------|---------|------|---------|
| AI API 不稳定 | 中 | 生成功能不可用 | 支持多个 AI 提供商，提供降级方案(手动输入 Mermaid 代码) |
| 实时协作冲突 | 中 | 数据不一致 | 使用成熟的 OT 或 CRDT 算法，充分测试边界情况 |
| Excalidraw 集成复杂 | 中 | 开发周期延长 | 优先实现 Mermaid 功能，Excalidraw 作为二期功能 |
| WebSocket 性能瓶颈 | 低 | 并发用户受限 | 限制单图形最大同时在线用户数，优化消息传输 |
| 数据库性能瓶颈 | 低 | 响应变慢 | 添加索引、使用缓存、必要时进行读写分离 |

### 13.2 业务风险

| 风险项 | 风险等级 | 影响 | 应对措施 |
|--------|---------|------|---------|
| AI 生成质量不佳 | 中 | 用户体验差 | 优化提示词，提供示例和模板，允许用户手动调整 |
| 用户数据安全 | 高 | 数据泄露 | 严格权限控制、加密传输、定期安全审计 |
| AI API 成本过高 | 中 | 运营成本高 | 设置 API 调用限流、提供缓存机制、考虑本地部署开源模型 |
| 用户增长过快 | 低 | 服务器压力大 | 弹性扩容、优化性能、必要时升级到集群部署 |

### 13.3 依赖风险

| 依赖项 | 风险 | 应对措施 |
|--------|------|---------|
| Mermaid.js | 版本更新导致兼容性问题 | 锁定版本，升级前充分测试 |
| Excalidraw | 开源项目维护停止 | 关注社区动态，必要时 fork 维护 |
| Google Gemini | API 变更或停止服务 | 支持多个 AI 提供商，避免单点依赖 |
| AIHubMix | 第三方服务稳定性 | 实现重试机制、超时处理、降级方案 |

## 14. 未来演进方向

### 14.1 短期优化(3-6 个月)

| 优化项 | 价值 |
|--------|------|
| 性能优化 | 提升大规模图形的渲染和编辑性能 |
| 移动端适配 | 支持手机和平板设备访问 |
| AI 生成质量提升 | 通过用户反馈优化提示词和模型选择 |
| 模板库扩充 | 增加到 100+ 模板，覆盖更多场景 |
| 用户体验优化 | 简化操作流程，提供新手引导 |

### 14.2 中期规划(6-12 个月)

| 规划项 | 价值 |
|--------|------|
| AI 智能助手 | 提供对话式 AI 助手，辅助用户创建和优化图形 |
| 插件系统 | 支持第三方开发插件，扩展功能 |
| 多语言支持 | 国际化，支持英文、日文等多语言 |
| 企业版功能 | SSO 单点登录、高级权限管理、审计日志 |
| 数据分析 | 提供图形使用统计、团队协作报表 |

### 14.3 长期愿景(1-2 年)

| 愿景项 | 价值 |
|--------|------|
| 自托管方案 | 提供私有部署版本，满足企业内网需求 |
| AI 训练优化 | 基于用户数据微调专用模型，提升生成质量 |
| 跨平台客户端 | 开发桌面端和移动端原生应用 |
| 生态建设 | 建立模板市场、插件市场，形成开发者生态 |
| 智能协作 | AI 辅助团队协作，自动合并冲突、智能推荐 |
