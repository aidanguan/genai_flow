# 前端 React 技术栈迁移设计

## 1. 迁移背景与目标

### 1.1 当前实现方式

前端采用 Vue 3 + veaury 桥接层集成 React 版 Excalidraw 组件，存在以下技术特征：

- 主框架：Vue 3 + TypeScript + Vite
- 跨框架桥接：veaury 库实现 React 组件在 Vue 中的使用
- 核心依赖：
  - `@excalidraw/excalidraw`：原生 React 组件
  - `@excalidraw/mermaid-to-excalidraw`：Mermaid 转换工具
  - `veaury`：Vue-React 互操作桥接层

### 1.2 核心问题表现

通过代码审查发现 ExcalidrawWrapper.vue 存在大量异步时序补偿逻辑：

| 问题表现 | 代码位置 | 技术原因 |
|---------|---------|---------|
| 元素更新延迟 | `setTimeout(..., 100)` | Vue 响应式与 React 状态更新不同步 |
| 多次 RAF 调用 | `requestAnimationFrame` 嵌套3层 | 需等待 React 渲染周期完成 |
| 重置后更新 | `resetScene()` + `updateScene()` | 清除 React 内部状态冲突 |
| 空数组防护 | `handleChange` 过滤逻辑 | 桥接层导致事件触发时序错乱 |

这些补偿措施表明：跨框架通信存在根本性的状态同步障碍，并非单纯的实现问题。

### 1.3 问题根源分析

**架构层面矛盾**

| 维度 | Vue 响应式系统 | React 状态管理 | 桥接问题 |
|-----|--------------|---------------|---------|
| 状态更新 | 基于 Proxy 拦截 | setState 批量更新 | 更新时机无法精确同步 |
| 生命周期 | setup + watch | useEffect + hooks | 钩子触发顺序不可控 |
| 重渲染控制 | 细粒度依赖追踪 | Virtual DOM diff | 双重 diff 性能损耗 |
| 数据流向 | 双向绑定 | 单向数据流 | 需要手动同步双向 |

**具体技术障碍**

1. **状态传递延迟**：Vue props 变化 → veaury 桥接 → React props 更新，至少跨越 2 个事件循环
2. **事件回调错位**：React onChange → veaury 转发 → Vue emit，可能触发循环更新
3. **内存管理复杂**：需同时维护 Vue 组件树和 React Fiber 树
4. **调试困难**：错误堆栈穿越两个框架，难以定位问题源头

## 2. 迁移方案设计

### 2.1 技术栈选型

**核心决策**
- 前端完全迁移至 React 18 + TypeScript
- 使用 Vite + React 官方插件
- 直接使用 Excalidraw React 组件，无需桥接层
- 保持 Tailwind CSS 样式方案不变

**技术选型**

| 技术层 | Vue 当前方案 | React 迁移方案 | 迁移理由 |
|-------|------------|--------------|---------|
| 核心框架 | Vue 3.5.24 | React 18.3.1 | Excalidraw 原生支持 |
| 构建工具 | Vite + @vitejs/plugin-vue | Vite + @vitejs/plugin-react | 配置相似，迁移成本低 |
| 状态管理 | Composition API + ref | useState + useReducer | 语义相似，学习成本低 |
| 样式方案 | Tailwind CSS | Tailwind CSS | 完全保持不变 |
| 路由管理 | 无路由 | 无路由 | 单页应用无需路由 |
| 图标库 | lucide-vue-next | lucide-react | API 一致，仅导入路径变更 |

**组件迁移映射**

| Vue 组件 | React 组件 | 迁移复杂度 | 关键变化点 |
|---------|-----------|----------|----------|
| ExcalidrawWrapper.vue | ExcalidrawWrapper.tsx | 低 | 直接使用官方组件，删除所有桥接代码 |
| MermaidEditor.vue | MermaidEditor.tsx | 中 | ref → useRef，watch → useEffect |
| PromptInput.vue | PromptInput.tsx | 低 | v-model → useState + onChange |
| Sidebar.vue | Sidebar.tsx | 低 | 模板语法差异 |
| Header.vue | Header.tsx | 低 | 事件处理差异 |
| App.vue | App.tsx | 中 | 组合式 API → Hooks，ref → useState |

**预期收益**

| 收益维度 | 具体表现 | 量化指标 |
|---------|---------|---------|
| 稳定性提升 | 删除所有 setTimeout/RAF 补偿代码 | 代码减少约 40% |
| 性能优化 | 消除双框架运行时开销 | 首屏加载减少约 15% |
| 开发体验 | 使用 Excalidraw 官方文档和示例 | 调试效率提升 50% |
| 生态兼容性 | 与 mermaid-to-excalidraw 无缝集成 | 零兼容性问题 |
| 长期维护 | 跟随 React 和 Excalidraw 官方更新 | 技术债务清零 |

### 2.2 迁移收益量化

| 收益维度 | 具体表现 | 预期指标 |
|---------|---------|---------|
| 代码简化 | 删除所有 setTimeout/RAF 补偿代码 | ExcalidrawWrapper 代码减少 54% |
| 性能提升 | 消除双框架运行时开销 | 首屏加载减少 10-15% |
| 开发效率 | 使用 Excalidraw 官方文档和示例 | 调试效率提升 50% |
| 维护成本 | 跟随 React 和 Excalidraw 官方更新 | 技术债务清零 |

## 3. 迁移实施方案

### 3.1 迁移总体策略

采用**渐进式迁移**方式，降低风险：

**阶段一：环境搭建**（1天）
1. 创建 React 分支
2. 安装 React 依赖，保留现有 Vue 依赖
3. 配置 Vite 同时支持 React 和 Vue
4. 验证构建流程

**阶段二：核心组件迁移**（2-3天）
1. ExcalidrawWrapper：直接使用官方组件
2. MermaidEditor：复制 Mermaid Live Editor 参考实现
3. PromptInput：简单表单组件
4. Sidebar、Header：静态展示组件

**阶段三：状态管理整合**（1-2天）
1. App 组件状态管理重构
2. 主题切换逻辑迁移
3. 历史记录持久化逻辑迁移

**阶段四：测试与优化**（1-2天）
1. 功能回归测试
2. 性能对比测试
3. 用户界面一致性验证

**阶段五：清理与上线**（0.5天）
1. 删除 Vue 相关依赖和配置
2. 更新文档
3. 部署至生产环境

### 3.2 组件迁移详细设计

#### 3.2.1 ExcalidrawWrapper 组件迁移

**Vue 版本问题清单**（需删除的代码逻辑）

| 问题类型 | 代码位置 | 行数 |
|---------|---------|-----|
| veaury 桥接初始化 | applyReactInVue, markRaw | 4 行 |
| 延迟更新补偿 | setTimeout(..., 100/150) | 3 处 |
| 帧同步补偿 | requestAnimationFrame 嵌套 | 6 处 |
| 状态重置逻辑 | resetScene() 调用 | 2 处 |
| 深度监听 | watch(..., { deep: true }) | 15 行 |
| 空数组防护 | handleChange 过滤 | 8 行 |

**React 版本实现要点**

| 功能 | 实现方式 | 代码示例 |
|-----|---------|---------|
| API 存储 | useRef Hook | `const apiRef = useRef<ExcalidrawImperativeAPI>(null)` |
| 元素更新 | useEffect 监听 | `useEffect(() => { api.updateScene({ elements }) }, [elements])` |
| 事件处理 | 直接回调 | `onChange={(elements, state, files) => onElementsChange(elements)}` |
| 主题同步 | theme prop | `<Excalidraw theme={isDarkMode ? 'dark' : 'light'} />` |
| 中文界面 | langCode prop | `<Excalidraw langCode="zh-CN" />` |

**代码量对比**

| 指标 | Vue 版本 | React 版本 | 减少比例 |
|-----|---------|-----------|---------|
| 总行数 | 262 行 | 约 120 行 | 54% |
| 异步逻辑 | 9 处 | 0 处 | 100% |
| 状态同步代码 | 80 行 | 10 行 | 87% |

#### 3.2.2 App 主组件状态管理迁移

**Vue Composition API → React Hooks 映射**

| Vue 3 API | React 18 Hooks | 迁移示例 |
|-----------|---------------|---------|
| `ref<T>()` | `useState<T>()` | `const [value, setValue] = useState<T>()` |
| `computed()` | `useMemo()` | `const result = useMemo(() => compute(), [deps])` |
| `watch()` | `useEffect()` | `useEffect(() => { ... }, [deps])` |
| `onMounted()` | `useEffect(() => {}, [])` | 空依赖数组 |
| `onBeforeUnmount()` | `useEffect(() => () => cleanup, [])` | 返回清理函数 |

**状态设计方案**

当前应用状态简单，无需引入 Redux/Zustand 等状态库，使用以下方案：

| 状态类型 | Vue 实现 | React 实现 | 说明 |
|---------|---------|-----------|------|
| 组件状态 | `ref<T>()` | `useState<T>()` | 局部状态管理 |
| 计算属性 | `computed()` | `useMemo()` | 派生状态 |
| 副作用 | `watch()` | `useEffect()` | 监听状态变化 |
| 持久化 | localStorage 直接操作 | 自定义 `useLocalStorage` Hook | 封装本地存储逻辑 |
| 跨组件通信 | emit/props | 回调函数/props | 父子组件通信 |

**核心状态迁移清单**

| 状态名称 | 类型 | 用途 | 迁移方式 |
|---------|-----|------|----------|
| `isLoggedIn` | boolean | 登录状态 | `useState<boolean>(false)` |
| `activeTab` | DiagramType | 当前标签 | `useState<DiagramType>(DiagramType.MERMAID)` |
| `isLoading` | boolean | 加载状态 | `useState<boolean>(false)` |
| `diagramState` | DiagramState | 图表数据 | `useState<DiagramState>({...})` |
| `history` | HistoryItem[] | 历史记录 | `useState<HistoryItem[]>([])` |
| `isDarkMode` | boolean | 主题模式 | `useState<boolean>(false)` |
| `isSidebarCollapsed` | boolean | 侧边栏折叠 | `useState<boolean>(false)` |
| `showCodeEditor` | boolean | 编辑器显示 | `useState<boolean>(true)` |

#### 3.2.3 MermaidEditor 组件迁移

**核心功能**
- Mermaid 代码实时渲染预览
- 提供"转换为 Excalidraw"功能按钮
- 支持深色/浅色主题切换

**迁移要点**

| Vue 实现 | React 实现 | 说明 |
|---------|-----------|------|
| `ref<HTMLElement>()` | `useRef<HTMLDivElement>(null)` | DOM 引用 |
| `watch(() => props.code)` | `useEffect(() => {...}, [code])` | 监听代码变化重新渲染 |
| `onMounted()` | `useEffect(() => {...}, [])` | 初始化 Mermaid 配置 |
| `v-html="svg"` | `dangerouslySetInnerHTML={{ __html: svg }}` | 渲染 SVG |

**Mermaid 初始化配置保持不变**

```
mermaid.initialize({
  startOnLoad: false,
  theme: isDarkMode ? 'dark' : 'default',
  securityLevel: 'loose',
  fontFamily: 'sans-serif'
})
```

#### 3.2.4 PromptInput 组件迁移

**核心功能**
- AI 提示词输入
- 模型选择下拉菜单
- 图表类型选择
- 生成按钮触发

**迁移要点**

| Vue 实现 | React 实现 | 说明 |
|---------|-----------|------|
| `v-model="prompt"` | `value={prompt} onChange={e => setPrompt(e.target.value)}` | 双向绑定转单向数据流 |
| `@click="handleGenerate"` | `onClick={handleGenerate}` | 事件绑定语法差异 |
| `:disabled="props.disabled"` | `disabled={disabled}` | 属性绑定 |

#### 3.2.5 Sidebar 和 Header 组件迁移

**迁移复杂度**：低

这两个组件主要为静态展示和简单交互，迁移要点：

| 组件 | 主要功能 | 迁移关键点 |
|-----|---------|----------|
| Sidebar | 历史记录列表、标签切换、折叠控制 | `v-for` → `map()`，事件处理 |
| Header | 标题显示、主题切换按钮 | 图标库更换为 lucide-react |

#### 3.2.6 样式迁移策略

**完全保持不变**
- Tailwind CSS 配置无需修改
- 所有 class 名称保持一致
- dark: 前缀继续有效

**模板语法差异**

| 特性 | Vue 模板 | React JSX |
|-----|---------|----------|
| 条件渲染 | `v-if="condition"` | `{condition && <div />}` |
| 列表渲染 | `v-for="item in items"` | `{items.map(item => <div key={...} />)}` |
| 事件绑定 | `@click="handler"` | `onClick={handler}` |
| 双向绑定 | `v-model="value"` | `value={value} onChange={e => setValue(e.target.value)}` |
| 动态 class | `:class="[...]"` | `className={clsx(...)}` |

### 3.3 自定义 Hooks 封装

为提升代码复用性和可维护性，封装以下自定义 Hooks：

#### 3.3.1 useLocalStorage Hook

**功能**：封装 localStorage 读写逻辑，提供响应式状态

**接口设计**

| 参数 | 类型 | 说明 |
|-----|------|------|
| key | string | localStorage 键名 |
| initialValue | T | 默认值 |
| 返回值 | [T, (value: T) => void] | 状态值和设置函数 |

**使用场景**
- 主题偏好存储
- 历史记录持久化
- 用户配置保存

#### 3.3.2 useDebounce Hook

**功能**：防抖处理，减少高频操作触发次数

**接口设计**

| 参数 | 类型 | 说明 |
|-----|------|------|
| value | T | 需要防抖的值 |
| delay | number | 延迟时间（毫秒） |
| 返回值 | T | 防抖后的值 |

**使用场景**
- Mermaid 代码编辑实时预览（延迟 300ms）
- 搜索输入框

#### 3.3.3 useExcalidrawAPI Hook

**功能**：封装 Excalidraw API 调用逻辑

**接口设计**

| 参数 | 类型 | 说明 |
|-----|------|------|
| elements | ExcalidrawElement[] | 元素数组 |
| files | BinaryFiles | 文件对象 |
| 返回值 | ExcalidrawImperativeAPI | API 引用 |

**功能封装**
- updateScene 调用
- scrollToContent 自动居中
- getSceneElements 获取元素

### 3.4 依赖变更清单

**需要移除的依赖**
```
- vue: ^3.5.24
- @vitejs/plugin-vue: ^6.0.1
- @vitejs/plugin-vue-jsx: ^5.1.2
- vue-tsc: ^3.1.4
- veaury: ^2.3.3
- lucide-vue-next: ^0.555.0
```

**需要保留的依赖**
```
- react: ^18.3.1（已安装）
- react-dom: ^18.3.1（已安装）
- @vitejs/plugin-react: ^4.3.4（已安装）
- @excalidraw/excalidraw: ^0.18.0
- @excalidraw/mermaid-to-excalidraw: ^2.0.0
- mermaid: ^11.12.1
- tailwindcss: ^4.1.17
- clsx: ^2.1.1
- file-saver: ^2.0.5
- html2canvas: ^1.4.1
- jspdf: ^2.5.2
```

**需要新增的依赖**
```
- lucide-react: ^0.555.0（替换 lucide-vue-next）
```

### 3.5 构建配置调整

**vite.config.ts 更新要点**

| 配置项 | Vue 版本 | React 版本 | 变更说明 |
|-------|---------|-----------|---------|
| plugins | `vue()` + `vueJsx()` | `react()` | 替换插件 |
| resolve.alias | 保持 | 保持 | @ 别名无需修改 |
| server | 保持 | 保持 | 代理配置不变 |
| build | 保持 | 保持 | 输出配置不变 |

**tsconfig.json 更新要点**

| 配置项 | Vue 版本 | React 版本 |
|-------|---------|-----------|
| jsx | `"preserve"` | `"react-jsx"` |
| jsxImportSource | 无 | `"react"` |
| types | `"vite/client"` | `"vite/client"` |
| include | `src/**/*.vue` | `src/**/*.tsx` |

### 3.6 用户界面一致性保障

**必须保持的界面特性**（基于用户记忆）

| 特性 | 实现方式 | 验证标准 |
|-----|---------|---------|
| 中文界面 | Excalidraw langCode="zh-CN" | 所有菜单、提示为中文 |
| 深色模式 | theme prop 同步切换 | 切换无延迟，背景色正确 |
| 无垂直滚动条 | 容器 h-screen overflow-hidden | 1920x1080 和 4K 下均无滚动条 |
| 工作区居中 | Flexbox 居中布局 | 4K 下左右边距相等 |
| 双击编辑文字 | Excalidraw 内置功能 | 点击形状可直接编辑文本 |
| 无选中弹窗 | UIOptions 配置 | 选中元素无额外提示框 |

## 4. 迁移实施步骤

### 4.1 第一阶段：环境准备（Day 1 上午）

**任务清单**

| 序号 | 任务 | 预期产出 | 验证标准 |
|-----|------|---------|----------|
| 1 | 创建 React 迁移分支 | `git checkout -b react-migration` | 分支创建成功 |
| 2 | 更新 package.json 依赖 | 新增 lucide-react，保留 React 依赖 | `npm install` 无报错 |
| 3 | 配置 vite.config.ts | 使用 @vitejs/plugin-react | `npm run dev` 启动成功 |
| 4 | 更新 tsconfig.json | jsx: "react-jsx" | TypeScript 编译通过 |
| 5 | 创建 React 版本入口文件 | src/main.tsx | 空白页面渲染成功 |

**关键配置文件变更**

vite.config.ts 核心变更：
- 移除：`vue()`, `vueJsx()` 插件
- 添加：`react()` 插件
- 保持：代理配置、别名配置

tsconfig.json 核心变更：
- jsx: "react-jsx"
- jsxImportSource: "react"
- include: ["src/**/*.tsx", "src/**/*.ts"]

### 4.2 第二阶段：核心组件迁移（Day 1 下午 - Day 2）

**优先级排序**

| 优先级 | 组件 | 理由 | 预估时间 |
|-------|------|------|----------|
| P0 | ExcalidrawWrapper | 最复杂，验证可行性 | 3 小时 |
| P0 | App | 主组件，状态管理中心 | 4 小时 |
| P1 | MermaidEditor | 核心功能组件 | 2 小时 |
| P1 | PromptInput | 用户输入入口 | 1.5 小时 |
| P2 | Sidebar | 导航组件 | 1.5 小时 |
| P2 | Header | 头部组件 | 1 小时 |
| P3 | Auth | 登录组件 | 1.5 小时 |

**ExcalidrawWrapper 迁移检查清单**

- [ ] 删除 veaury 导入和包装逻辑
- [ ] 使用 useRef 存储 API 引用
- [ ] 删除所有 setTimeout 延迟逻辑
- [ ] 删除所有 requestAnimationFrame 调用
- [ ] 删除 resetScene 调用
- [ ] 使用 useEffect 替代 watch
- [ ] 验证元素更新立即生效
- [ ] 验证主题切换无延迟
- [ ] 验证 Mermaid 转换结果正确渲染

**App 组件迁移检查清单**

- [ ] 所有 ref 转换为 useState
- [ ] onMounted 逻辑迁移至 useEffect
- [ ] watch 逻辑迁移至 useEffect
- [ ] emit 改为回调函数
- [ ] v-if/v-for 改为 JSX 条件/循环
- [ ] 事件处理器语法更新
- [ ] 类型定义保持一致

### 4.3 第三阶段：功能测试（Day 3）

**测试用例清单**

| 测试场景 | 操作步骤 | 预期结果 | 优先级 |
|---------|---------|---------|--------|
| Mermaid 编辑 | 修改代码 | 实时预览更新 | P0 |
| Mermaid 转 Excalidraw | 点击转换按钮 | 元素正确显示，可编辑 | P0 |
| Excalidraw 绘图 | 添加矩形、文字 | 操作流畅，无卡顿 | P0 |
| 主题切换 | 切换深色模式 | 所有组件同步切换 | P0 |
| 历史记录 | 保存后刷新页面 | 数据正确加载 | P1 |
| AI 生成 | 输入提示词 | 调用成功，结果展示 | P1 |
| 响应式布局 | 切换分辨率 | 1920x1080 和 4K 均无滚动条 | P1 |
| 文字编辑 | 双击 Excalidraw 形状 | 可直接编辑文本 | P2 |
| 侧边栏折叠 | 点击折叠按钮 | 宽度变化流畅 | P2 |

**性能测试对比**

| 指标 | Vue 版本 | React 版本 | 测试方法 |
|-----|---------|-----------|----------|
| 首屏加载（FCP） | 待测 | 目标：减少 10% | Lighthouse |
| 元素更新延迟 | 100-300ms | 目标：< 50ms | Performance.now() |
| 打包体积 | 待测 | 目标：减少 5% | vite build 输出 |
| 内存占用 | 待测 | 目标：减少 5% | Chrome DevTools Memory |

### 4.4 第四阶段：优化与清理（Day 4）

**优化任务清单**

| 任务 | 目标 | 验证方法 |
|-----|------|----------|
| 使用 React.memo 优化渲染 | 减少不必要重渲染 | React DevTools Profiler |
| 懒加载 Excalidraw 模块 | 减小首屏体积 | 网络面板查看分块加载 |
| 移除 Vue 相关依赖 | 减小 node_modules 体积 | package.json 检查 |
| 删除 Vue 组件文件 | 清理冗余代码 | 代码审查 |
| 更新 ESLint 配置 | 启用 React 规则 | ESLint 检查通过 |
| 更新文档 | README、注释更新 | 文档审查 |

**代码清理检查清单**

- [ ] 删除 `vue`, `@vitejs/plugin-vue` 等依赖
- [ ] 删除所有 `.vue` 文件
- [ ] 删除 `veaury` 依赖
- [ ] 更新 `lucide-vue-next` 为 `lucide-react`
- [ ] 删除 `vue-tsc` 依赖
- [ ] 更新 `.eslintrc` 配置
- [ ] 检查无遗留的 Vue 语法
- [ ] 验证 TypeScript 类型无报错

### 4.5 第五阶段：部署验证（Day 5）

**部署前检查**

| 检查项 | 验证方法 | 通过标准 |
|-------|---------|----------|
| 生产构建 | `npm run build` | 构建成功，无报错 |
| 构建产物验证 | 检查 dist 目录 | 包含 index.html 和 assets |
| 本地预览 | `npm run preview` | 功能正常运行 |
| Docker 镜像构建 | `docker build -t frontend:react .` | 镜像构建成功 |
| 容器运行 | `docker run -p 3000:80 frontend:react` | 容器内应用正常 |
| 集成测试 | 连接后端 API | 所有接口调用正常 |

**回滚预案**

如果迁移过程中发现无法解决的问题：

1. 保留 Vue 版本分支：`git checkout main`
2. 暂停 React 分支合并
3. 分析问题根源，制定解决方案
4. 必要时回退至 Vue 版本

## 5. 风险管理与缓解措施

### 5.1 技术风险

| 风险项 | 发生概率 | 影响程度 | 缓解措施 |
|-------|---------|---------|---------|
| Excalidraw API 变更 | 低 | 中 | 参考官方示例，使用稳定 API |
| React Hooks 使用错误 | 中 | 低 | 遵循 ESLint 规则，代码审查 |
| Mermaid 转换异常 | 低 | 中 | 保留原有转换逻辑，充分测试 |
| 性能不达预期 | 低 | 低 | 迁移即优化，理论上不会劣化 |

### 5.2 业务风险

| 风险项 | 发生概率 | 影响程度 | 缓解措施 |
|-------|---------|---------|---------|
| 功能遗漏 | 中 | 高 | 制作功能检查清单，逐项验证 |
| 用户数据丢失 | 低 | 高 | localStorage 格式保持兼容 |
| 视觉不一致 | 中 | 中 | UI 逐像素对比，CSS 完全复用 |
| 回归测试不充分 | 中 | 中 | 编写测试用例，自动化测试 |

### 5.3 进度风险

| 风险项 | 发生概率 | 影响程度 | 缓解措施 |
|-------|---------|---------|---------|
| 迁移时间超出预期 | 中 | 低 | 分阶段迁移，关键路径先行 |
| 意外技术障碍 | 低 | 中 | 预留 1 天缓冲时间 |
| 测试发现重大问题 | 低 | 高 | 保留 Vue 分支，可快速回滚 |

## 6. 质量保障策略

### 6.1 代码质量标准

**ESLint 规则配置**

| 规则类别 | 规则名称 | 说明 |
|---------|---------|------|
| React Hooks | react-hooks/rules-of-hooks | 强制 Hooks 调用顺序 |
| React Hooks | react-hooks/exhaustive-deps | 检查依赖数组完整性 |
| TypeScript | @typescript-eslint/no-explicit-any | 禁止使用 any 类型 |
| TypeScript | @typescript-eslint/explicit-function-return-type | 函数返回类型明确 |

**代码审查检查点**

| 检查项 | 标准 |
|-------|------|
| 组件命名 | PascalCase，语义清晰 |
| 函数命名 | camelCase，动词开头 |
| 类型定义 | 避免 any，使用严格类型 |
| Hooks 依赖 | 依赖数组完整，无遗漏 |
| 性能优化 | 合理使用 useMemo/useCallback |
| 注释完整性 | 复杂逻辑必须注释 |

### 6.2 功能验证清单

| 功能模块 | 测试场景 | 通过标准 |
|---------|---------|---------|
| Mermaid 编辑 | 输入代码，实时预览 | 代码修改后立即渲染 |
| Mermaid 转 Excalidraw | 点击转换按钮 | 元素正确显示，可编辑 |
| Excalidraw 绘图 | 添加形状、连线、文字 | 操作流畅，无卡顿 |
| 主题切换 | 切换深色/浅色模式 | 所有组件主题同步 |
| 历史记录 | 保存、加载历史 | 数据持久化正确 |
| AI 生成 | 输入提示词生成图表 | 后端调用正常，结果展示 |

### 6.3 性能验证指标

| 指标 | Vue 基线 | React 目标 | 测试方法 |
|-----|---------|-----------|---------|
| 首屏加载时间 | 待测量 | 减少 10%+ | Lighthouse |
| 元素更新延迟 | 100-300ms | < 50ms | Performance API |
| 内存占用 | 待测量 | 减少 5%+ | Chrome DevTools |
| 打包体积 | 待测量 | 减少 8%+ | vite build 输出 |

### 6.4 兼容性验证

| 维度 | 验证项 | 通过标准 |
|-----|-------|---------|
| 浏览器 | Chrome, Edge, Firefox | 核心功能正常 |
| 分辨率 | 1920x1080, 2560x1440, 3840x2160 | 布局适配正确 |
| 主题 | 浅色模式，深色模式 | 颜色对比度符合规范 |
| 数据迁移 | 加载 Vue 版本保存的数据 | 无报错，正常渲染 |

## 7. 时间与资源规划

### 7.1 详细工时分解

| 阶段 | 主要任务 | 预估工作量 | 依赖条件 |
|-----|---------|----------|---------|
| 环境搭建 | 依赖安装、配置调整 | 0.5 天 | 无 |
| ExcalidrawWrapper | 删除桥接代码，使用官方组件 | 0.5 天 | 环境就绪 |
| 其他组件迁移 | Sidebar, Header, PromptInput 等 | 1 天 | 环境就绪 |
| App 主组件 | 状态管理、路由逻辑 | 1 天 | 子组件完成 |
| MermaidEditor | 编辑器集成、转换逻辑 | 0.5 天 | App 完成 |
| 功能测试 | 回归测试、bug 修复 | 1 天 | 所有组件完成 |
| 性能优化 | 性能测试、优化调整 | 0.5 天 | 功能测试通过 |
| 文档更新 | 代码注释、README | 0.5 天 | 并行进行 |
| **总计** | | **5.5 天** | |

### 7.2 里程碑计划

| 里程碑 | 完成标志 | 目标日期 |
|-------|---------|----------|
| M1: 环境就绪 | React 开发环境可用 | Day 1 上午 |
| M2: 核心组件完成 | ExcalidrawWrapper 和 App 迁移完成 | Day 2 |
| M3: 所有组件完成 | 全部组件迁移并编译通过 | Day 3 上午 |
| M4: 功能测试通过 | 所有 P0/P1 用例通过 | Day 3 下午 |
| M5: 性能达标 | 性能指标达到预期 | Day 4 |
| M6: 生产发布 | 部署至生产环境 | Day 5 |

**关键路径**：环境搭建 → ExcalidrawWrapper → App 主组件 → 功能测试 → 部署

**缓冲时间**：预留 1 天应对意外情况，总工期 **5-6 天**

### 7.3 资源需求

| 资源类型 | 需求 | 说明 |
|---------|------|------|
| 开发人员 | 1 人 | 熟悉 React 和 TypeScript |
| 测试人员 | 0.5 人 | 功能回归测试 |
| 开发环境 | Node.js 18+ | 本地开发环境 |
| 测试环境 | 1 套 | 用于集成测试 |
| 备份环境 | 1 套 | Vue 版本回滚预案 |

## 8. 成功验收标准

### 8.1 技术指标

- 删除所有 veaury 桥接代码
- ExcalidrawWrapper 组件代码量减少 50%+
- 无 setTimeout/requestAnimationFrame 时序补偿逻辑
- 打包体积减少 5%+
- 首屏加载时间减少 10%+

### 8.2 功能指标

- 所有现有功能正常运行
- Excalidraw 元素更新响应时间 < 50ms
- 主题切换无闪烁
- 支持加载 Vue 版本保存的历史数据

### 8.3 用户体验指标

- 界面显示与当前版本一致
- 1920x1080 和 4K 分辨率下无垂直滚动条
- 深色模式颜色正确
- 文字可双击编辑

## 9. 后续优化方向

迁移完成后可进一步提升的方向：

### 9.1 组件化增强

| 优化项 | 预期收益 | 实施优先级 |
|-------|---------|----------|
| 自定义 Excalidraw 工具栏 | 提升用户操作效率 | 中 |
| 封装 Mermaid 语法高亮编辑器 | 改善代码编辑体验 | 高 |
| 抽取通用 Modal 组件 | 减少重复代码 | 低 |

### 9.2 性能优化

| 优化项 | 预期收益 | 实施优先级 |
|-------|---------|----------|
| 使用 React.memo 优化渲染 | 减少不必要重渲染 | 中 |
| 懒加载 Excalidraw 模块 | 加快首屏加载 | 高 |
| Web Worker 处理 Mermaid 转换 | 避免主线程阻塞 | 低 |

### 9.3 开发体验

| 优化项 | 预期收益 | 实施优先级 |
|-------|---------|----------|
| 引入 React DevTools | 提升调试效率 | 高 |
| 配置 ESLint React 规则 | 代码质量保障 | 高 |
| 添加 Storybook | 组件开发隔离环境 | 低 |

## 10. 迁移准备工作

### 10.1 知识储备

**团队成员需掌握的知识点**

| 知识点 | 重要程度 | 学习资源 | 预估时间 |
|-------|---------|---------|----------|
| React Hooks 基础 | 高 | React 官方文档 | 2 小时 |
| useEffect 依赖管理 | 高 | React Hooks FAQ | 1 小时 |
| TypeScript 与 React | 中 | TypeScript Handbook | 1 小时 |
| Excalidraw API | 高 | Excalidraw 官方示例 | 2 小时 |
| JSX 语法 | 中 | React 官方教程 | 1 小时 |

**参考资料清单**

1. React 官方文档：https://react.dev/
2. Excalidraw GitHub：https://github.com/excalidraw/excalidraw
3. mermaid-to-excalidraw 示例：ref_docs/mermaid-to-excalidraw/playground
4. Excalidraw 示例：ref_docs/excalidraw/examples/with-nextjs

### 10.2 环境准备

**开发工具配置**

| 工具 | 版本要求 | 配置项 |
|-----|---------|--------|
| Node.js | 18.0+ | 已满足 |
| VS Code | 最新版 | 安装 ES7+ React/Redux 插件 |
| Chrome | 最新版 | 安装 React DevTools 扩展 |
| ESLint | 8.0+ | 配置 React 规则 |

**依赖项预安装**

```
npm install --save-dev \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-plugin-react \
  eslint-plugin-react-hooks
```

### 10.3 代码备份

**备份策略**

1. 创建 Vue 版本标签：`git tag vue-stable-v1.0`
2. 推送至远程仓库：`git push origin vue-stable-v1.0`
3. 创建迁移分支：`git checkout -b react-migration`
4. 确保 main 分支可随时回滚

## 11. 迁移执行建议

### 11.1 迁移原则

1. **渐进式迁移**：一次迁移一个组件，确保每个组件可独立运行
2. **保持功能等价**：UI 和交互行为与 Vue 版本完全一致
3. **优先核心组件**：先迁移 ExcalidrawWrapper 验证可行性
4. **充分测试**：每个组件迁移后立即测试
5. **保留回滚路径**：Vue 分支随时可恢复

### 11.2 迁移注意事项

**常见陷阱**

| 陷阱 | 表现 | 解决方案 |
|-----|------|----------|
| useEffect 无限循环 | 组件持续重渲染 | 检查依赖数组，避免对象/数组字面量 |
| 闭包陷阱 | 事件处理器使用旧状态 | 使用函数式更新：`setState(prev => prev + 1)` |
| ref 未就绪 | 访问 ref.current 为 null | 在 useEffect 中访问，或使用可选链 |
| 受控组件警告 | value 在 undefined 和值之间切换 | 提供默认值：`value={text || ''}` |

**最佳实践**

1. **Hooks 调用顺序**：始终在组件顶层调用，不在条件/循环中使用
2. **依赖数组完整性**：ESLint 提示的依赖都应添加
3. **性能优化时机**：先确保功能正确，再考虑 useMemo/useCallback
4. **类型安全**：充分利用 TypeScript，避免 any 类型

### 11.3 验收流程

**迁移完成后的验收步骤**

1. **代码审查**：检查所有组件符合 React 最佳实践
2. **功能测试**：执行完整的测试用例清单
3. **性能测试**：对比 Vue 版本的性能指标
4. **UI 对比**：逐页面对比视觉一致性
5. **集成测试**：验证与后端 API 交互正常
6. **压力测试**：模拟高频操作，检查稳定性
7. **文档更新**：更新 README 和技术文档
8. **团队演示**：向团队展示迁移成果

**验收通过标准**

- 所有 P0 测试用例 100% 通过
- 所有 P1 测试用例 95%+ 通过
- 性能指标达到或超过预期
- 无严重 bug 和安全问题
- 代码审查通过，符合规范
- 文档完整，可供后续维护
