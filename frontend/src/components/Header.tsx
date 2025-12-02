import React from 'react'
import { Sun, Moon } from 'lucide-react'

interface HeaderProps {
  title: string
  isDarkMode: boolean
  onToggleTheme: () => void
}

export default function Header({ title, isDarkMode, onToggleTheme }: HeaderProps) {
  return (
    <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 transition-colors duration-300">
      <div className="flex items-center gap-4">
        <h2 className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-md">
          {title}
        </h2>
        <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
          自动保存
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* 主题切换 */}
        <button
          onClick={onToggleTheme}
          className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDarkMode ? '切换到明亮模式' : '切换到暗黑模式'}
        >
          {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </div>
  )
}
