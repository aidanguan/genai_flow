import React, { useMemo, useState, useRef, useEffect } from 'react'
import { DiagramType } from '../types'
import type { HistoryItem } from '../types'
import {
  History,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

interface SidebarProps {
  history: HistoryItem[]
  activeTab: DiagramType
  collapsed: boolean
  username?: string
  onSelectHistory: (item: HistoryItem) => void
  onTabChange: (tab: DiagramType) => void
  onToggleCollapse: () => void
  onLogout: () => void
}

export default function Sidebar({
  history,
  activeTab,
  collapsed,
  username,
  onSelectHistory,
  onTabChange,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])

  return (
    <div
      className={`h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative z-20 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* 应用 Logo/标题 */}
      <div className="h-14 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 relative transition-colors">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          {!collapsed && (
            <h1 className="font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
              DiagramAI
            </h1>
          )}
        </div>
      </div>

      {/* 模式切换器 */}
      <div className="p-3">
        <div className={`flex flex-col gap-2 ${collapsed ? 'items-center' : ''}`}>
          {!collapsed && (
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider ml-1">
              模式
            </label>
          )}

          <div
            className={`bg-slate-100 dark:bg-slate-900 rounded-lg p-1 gap-1 transition-colors ${
              collapsed ? 'flex flex-col' : 'grid grid-cols-2'
            }`}
          >
            <button
              onClick={() => onTabChange(DiagramType.MERMAID)}
              title="Mermaid 图形"
              className={`flex items-center justify-center rounded-md transition-all ${
                collapsed ? 'w-10 h-10' : 'px-3 py-2 text-sm font-medium'
              } ${
                activeTab === DiagramType.MERMAID
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {collapsed ? 'M' : 'Mermaid'}
            </button>
            <button
              onClick={() => onTabChange(DiagramType.EXCALIDRAW)}
              title="Excalidraw 白板"
              className={`flex items-center justify-center rounded-md transition-all ${
                collapsed ? 'w-10 h-10' : 'px-3 py-2 text-sm font-medium'
              } ${
                activeTab === DiagramType.EXCALIDRAW
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {collapsed ? 'E' : 'Excalidraw'}
            </button>
          </div>
        </div>
      </div>

      {/* 历史记录 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 scrollbar-none">
        {/* 历史区 */}
        <div className={`flex flex-col ${collapsed ? 'items-center' : ''}`}>
          {!collapsed ? (
            <div className="flex items-center gap-2 mb-3 px-1 text-slate-400">
              <History size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">最近</span>
            </div>
          ) : (
            <div className="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 my-2"></div>
          )}

          <div className="space-y-2 w-full">
            {history.slice(0, 5).map((item) => (
              <div
                key={item.id}
                title={item.preview}
                onClick={() => onSelectHistory(item)}
                className={`group cursor-pointer rounded-lg transition-all border border-transparent ${
                  collapsed
                    ? 'w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    : 'p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                {collapsed ? (
                  <Clock size={16} />
                ) : (
                  <>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {item.preview || '未命名'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          item.type === DiagramType.MERMAID
                            ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                            : 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                        }`}
                      >
                        {item.type === DiagramType.MERMAID ? 'Mermaid' : 'Whiteboard'}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">
                        {new Date(item.timestamp).toLocaleDateString(undefined, {
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部用户区 */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between'}`}>
          {!collapsed && (
            <div className="relative flex-1" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 overflow-hidden w-full hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg p-2 -ml-2 transition-colors group"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 ring-2 ring-white dark:ring-slate-800 shrink-0"></div>
                <div className="flex flex-col truncate flex-1">
                  <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {username || '用户'}
                  </span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-slate-400 transition-transform shrink-0 ${showUserMenu ? 'rotate-180' : ''}`}
                />
              </button>

              {/* 用户下拉菜单 */}
              {showUserMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      onLogout()
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>退出登录</span>
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            title={collapsed ? '展开侧边栏' : '收起侧边栏'}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>
      </div>
    </div>
  )
}
