<script setup lang="ts">
import { computed } from 'vue'
import { DiagramType, TEMPLATES } from '../types'
import type { HistoryItem } from '../types'
import { History, LayoutTemplate, Clock, ChevronRight, PanelLeftClose, PanelLeftOpen, LogOut } from 'lucide-vue-next'

interface Props {
  history: HistoryItem[]
  activeTab: DiagramType
  collapsed: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectHistory: [item: HistoryItem]
  tabChange: [tab: DiagramType]
  toggleCollapse: []
  logout: []
}>()

const filteredTemplates = computed(() => {
  return TEMPLATES.filter(t => t.type === props.activeTab)
})
</script>

<template>
  <div 
    :class="[
      'h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 relative z-20',
      collapsed ? 'w-16' : 'w-64'
    ]"
  >
    <!-- 应用 Logo/标题 -->
    <div class="h-14 flex items-center justify-center border-b border-slate-200 dark:border-slate-800 relative transition-colors">
      <div class="flex items-center gap-2 overflow-hidden">
        <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
          <LayoutTemplate :size="20" class="text-white" />
        </div>
        <h1 v-if="!collapsed" class="font-bold text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">DiagramAI</h1>
      </div>
    </div>

    <!-- 模式切换器 -->
    <div class="p-3">
      <div :class="['flex flex-col gap-2', collapsed && 'items-center']">
        <label v-if="!collapsed" class="text-xs font-semibold text-slate-500 dark:text-slate-500 uppercase tracking-wider ml-1">模式</label>
        
        <div :class="['bg-slate-100 dark:bg-slate-900 rounded-lg p-1 gap-1 transition-colors', collapsed ? 'flex flex-col' : 'grid grid-cols-2']">
          <button
            @click="emit('tabChange', DiagramType.MERMAID)"
            title="Mermaid 图形"
            :class="[
              'flex items-center justify-center rounded-md transition-all',
              collapsed ? 'w-10 h-10' : 'px-3 py-2 text-sm font-medium',
              activeTab === DiagramType.MERMAID 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
            ]"
          >
            {{ collapsed ? 'M' : 'Mermaid' }}
          </button>
          <button
            @click="emit('tabChange', DiagramType.EXCALIDRAW)"
            title="Excalidraw 白板"
            :class="[
              'flex items-center justify-center rounded-md transition-all',
              collapsed ? 'w-10 h-10' : 'px-3 py-2 text-sm font-medium',
              activeTab === DiagramType.EXCALIDRAW
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-800'
            ]"
          >
            {{ collapsed ? 'E' : 'Excalidraw' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 模板和历史 -->
    <div class="flex-1 overflow-y-auto px-3 py-2 space-y-6 scrollbar-none">
      <!-- 模板区 -->
      <div :class="['flex flex-col', collapsed && 'items-center']">
        <div v-if="!collapsed" class="flex items-center gap-2 mb-3 px-1 text-slate-400">
          <LayoutTemplate :size="14" />
          <span class="text-xs font-semibold uppercase tracking-wider">模板</span>
        </div>
        <div v-else class="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 my-2"></div>
        
        <div class="space-y-1 w-full">
          <button
            v-for="(t, idx) in filteredTemplates"
            :key="idx"
            :title="t.name"
            :class="[
              'w-full rounded-lg transition-colors flex items-center group',
              collapsed 
                ? 'justify-center w-10 h-10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white' 
                : 'text-left px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 justify-between'
            ]"
          >
            <span v-if="collapsed" class="text-xs font-bold">{{ t.name[0] }}</span>
            <template v-else>
              <span>{{ t.name }}</span>
              <ChevronRight :size="12" class="opacity-0 group-hover:opacity-100 transition-opacity" />
            </template>
          </button>
        </div>
      </div>

      <!-- 历史区 -->
      <div :class="['flex flex-col', collapsed && 'items-center']">
        <div v-if="!collapsed" class="flex items-center gap-2 mb-3 px-1 text-slate-400">
          <History :size="14" />
          <span class="text-xs font-semibold uppercase tracking-wider">最近</span>
        </div>
        <div v-else class="w-8 h-[1px] bg-slate-200 dark:bg-slate-800 my-2"></div>
        
        <div class="space-y-2 w-full">
          <div 
            v-for="item in history.slice(0, 5)"
            :key="item.id"
            :title="item.preview"
            @click="emit('selectHistory', item)"
            :class="[
              'group cursor-pointer rounded-lg transition-all border border-transparent',
              collapsed 
                ? 'w-10 h-10 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                : 'p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
            ]"
          >
            <Clock v-if="collapsed" :size="16" />
            <template v-else>
              <p class="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{{ item.preview || '未命名' }}</p>
              <div class="flex items-center justify-between mt-2">
                <span :class="['text-[10px] px-1.5 py-0.5 rounded', item.type === DiagramType.MERMAID ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300']">
                  {{ item.type === DiagramType.MERMAID ? 'Mermaid' : 'Whiteboard' }}
                </span>
                <span class="text-[10px] text-slate-400 dark:text-slate-500">{{ new Date(item.timestamp).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric'}) }}</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 底部用户区 -->
    <div class="p-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div :class="['flex items-center', collapsed ? 'flex-col gap-2' : 'justify-between']">
        <div v-if="!collapsed" class="flex items-center gap-3 overflow-hidden flex-1">
          <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 ring-2 ring-white dark:ring-slate-800 shrink-0"></div>
          <div class="flex flex-col truncate">
            <span class="text-sm font-medium text-slate-900 dark:text-white truncate">演示用户</span>
          </div>
        </div>
        <div :class="['flex items-center', collapsed ? 'flex-col gap-2' : 'gap-1']">
          <button 
            @click="emit('logout')"
            :title="'退出登录'"
            class="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut :size="20" />
          </button>
          <button 
            @click="emit('toggleCollapse')"
            :title="collapsed ? '展开侧边栏' : '收起侧边栏'"
            class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <PanelLeftOpen v-if="collapsed" :size="20" />
            <PanelLeftClose v-else :size="20" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
