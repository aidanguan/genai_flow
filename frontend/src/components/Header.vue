<script setup lang="ts">
import { Share2, Users, Sun, Moon } from 'lucide-vue-next'

interface Props {
  title: string
  isDarkMode: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  toggleTheme: []
}>()
</script>

<template>
  <div class="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 transition-colors duration-300">
    <div class="flex items-center gap-4">
      <h2 class="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[200px] sm:max-w-md">
        {{ title }}
      </h2>
      <span class="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
        自动保存
      </span>
    </div>

    <div class="flex items-center gap-3">
      <!-- 主题切换 -->
      <button 
        @click="emit('toggleTheme')"
        class="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        :title="isDarkMode ? '切换到明亮模式' : '切换到暗黑模式'"
      >
        <Sun v-if="isDarkMode" :size="18" />
        <Moon v-else :size="18" />
      </button>

      <div class="w-[1px] h-5 bg-slate-200 dark:bg-slate-700 mx-1"></div>

      <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
        <Users :size="16" />
        <span class="hidden sm:inline">协作</span>
      </button>
      <button class="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition-all">
        <Share2 :size="16" />
        <span class="hidden sm:inline">分享</span>
      </button>
    </div>
  </div>
</template>
