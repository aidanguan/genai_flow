# Mermaid 编辑器新功能更新

## 本次更新内容

根据用户需求,在原有功能基础上新增了两大核心功能:

### 1. 丰富配色方案 🎨

#### 功能特性
- **视觉化颜色预览**: 每个主题选项旁边显示对应的颜色圆点
- **增强的主题变量**: 为每个主题配置了丰富的颜色变量
- **主题专属配色**:
  - **森林主题**: 绿色系 (#10b981, #059669, #84cc16)
  - **深色主题**: 紫色系 (#6366f1, #8b5cf6, #ec4899)
  - **默认主题**: 蓝色系 (#4f46e5, #06b6d4, #f59e0b)

#### 技术实现
```typescript
const themes = [
  { value: 'default', label: '默认', color: '#1f77b4' },
  { value: 'dark', label: '深色', color: '#2b2b2b' },
  { value: 'forest', label: '森林', color: '#228b22' },
  { value: 'neutral', label: '中性', color: '#64748b' },
  { value: 'base', label: '基础', color: '#6366f1' }
]
```

#### UI 改进
- 主题菜单中每项显示颜色圆点指示器
- 更宽的菜单宽度 (140px) 以容纳颜色预览
- flex 布局实现文字和颜色圆点的对齐

### 2. 双击节点编辑文字 ✏️

#### 核心功能
- **双击触发**: 双击任意节点进入编辑模式
- **实时预览**: 输入框悬浮在节点正上方
- **即时同步**: 修改自动更新代码和画布
- **保留形状**: 编辑文字时保留原节点形状符号

#### 操作流程
1. **双击节点** → 出现编辑输入框
2. **修改文字** → 输入新内容
3. **按 Enter** → 保存并同步到代码
4. **按 Esc** → 取消编辑

#### 智能识别
自动识别并保留节点形状:
- `[文本]` - 矩形
- `(文本)` - 圆角矩形  
- `((文本))` - 圆形
- `{文本}` - 菱形
- `{{文本}}` - 六边形

#### 技术亮点

**1. 节点检测**
```typescript
const handleDoubleClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  
  // 查找最近的节点元素
  let nodeElement: HTMLElement | null = target
  while (nodeElement && !nodeElement.classList.contains('node')) {
    nodeElement = nodeElement.parentElement
  }
  
  // 获取节点文本
  const textElement = nodeElement.querySelector('.nodeLabel') || 
                      nodeElement.querySelector('text')
  const currentText = textElement.textContent?.trim() || ''
}
```

**2. 代码同步**
```typescript
const saveTextEdit = () => {
  const nodePattern = new RegExp(
    `(${editingNodeId.value})[\\[(\\{]+([^\\])\\}]+)[\\])\\}]+`,
    'g'
  )
  
  let updatedCode = props.code.replace(nodePattern, (match, id, oldText) => {
    // 保留原有形状符号
    const openChar = match.match(/[\[(\{]+/)?.[0] || '['
    const closeChar = openChar === '[[' ? ']]' : 
                      openChar === '((' ? '))' : 
                      openChar === '{{' ? '}}' :
                      openChar === '{' ? '}' :
                      openChar === '(' ? ')' : ']'
    return `${id}${openChar}${newText}${closeChar}`
  })
  
  emit('update:code', updatedCode)
}
```

**3. 键盘快捷键**
```typescript
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    saveTextEdit()      // 保存
  } else if (e.key === 'Escape') {
    cancelTextEdit()    // 取消
  }
}
```

#### UI 设计
```vue
<div 
  v-if="isEditingText" 
  class="absolute z-50"
  :style="{
    left: `${editPosition.x}px`,
    top: `${editPosition.y}px`,
    transform: 'translate(-50%, -50%)'
  }"
>
  <input 
    v-model="editingText"
    @keydown="handleKeyDown"
    @blur="saveTextEdit"
    class="text-edit-input px-3 py-1.5 bg-white dark:bg-slate-800 
           border-2 border-blue-500 rounded-lg shadow-xl 
           text-sm focus:outline-none min-w-[120px] text-center"
  />
  <div class="text-xs text-center mt-1 text-slate-500">
    Enter 保存 | Esc 取消
  </div>
</div>
```

## 测试验证

### 配色方案测试
- ✅ 主题菜单显示颜色圆点
- ✅ 5个主题均有独特颜色标识
- ✅ 切换主题后颜色变量正确应用
- ✅ 深色/浅色模式下颜色适配良好

### 双击编辑测试
- ✅ 双击节点成功触发编辑模式
- ✅ 输入框正确定位在节点中心
- ✅ 修改文字后按 Enter 成功保存
- ✅ 代码自动同步更新: `A[Start]` → `A[开始]`
- ✅ 画布实时更新显示新文字
- ✅ 保留节点形状符号 `[]`
- ✅ Esc 键取消编辑功能正常

## 截图展示

### 1. 配色方案预览
![主题颜色](screenshot_theme_colors.png)
- 每个主题旁显示颜色圆点
- 当前选中主题高亮显示

### 2. 文字编辑完成
![文字编辑](screenshot_text_edit_complete.png)
- Start → 开始
- 代码和画布已同步

### 3. 最终效果
![最终效果](screenshot_final_features.png)

## 技术栈

- **Vue 3 Composition API**: 响应式状态管理
- **TypeScript**: 类型安全
- **Mermaid.js**: 图表渲染引擎
- **Tailwind CSS**: 样式框架
- **DOM API**: 事件监听和元素操作

## 用户体验提升

1. **更直观的主题选择**: 颜色圆点让用户一眼看出主题风格
2. **所见即所得编辑**: 双击直接编辑,无需手动修改代码
3. **零学习成本**: Enter 保存, Esc 取消,符合用户习惯
4. **实时同步**: 编辑立即反映在代码和画布上
5. **保留语义**: 智能识别并保持节点形状不变

## 未来规划

- [ ] 支持更多节点属性编辑 (颜色、样式)
- [ ] 支持连线文本编辑
- [ ] 添加撤销/重做功能
- [ ] 节点拖拽调整位置
- [ ] 更多预设主题和配色方案

---

**更新日期**: 2025-12-01  
**版本**: v1.1.0
