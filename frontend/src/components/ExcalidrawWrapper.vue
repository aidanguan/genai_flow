<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Excalidraw } from '@excalidraw/excalidraw'

interface Props {
  elements: any[]
  isDarkMode?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isDarkMode: false
})

const emit = defineEmits<{
  'update:elements': [elements: any[]]
}>()

const excalidrawAPI = ref<any>(null)

// 同步主题
watch(() => props.isDarkMode, (newVal) => {
  if (!excalidrawAPI.value) return
  
  const bgColor = newVal ? '#1e293b' : '#f1f5f9'
  
  excalidrawAPI.value.updateScene({
    appState: {
      viewBackgroundColor: bgColor,
      theme: newVal ? 'dark' : 'light',
    }
  })
})

// 同步元素
watch(() => props.elements, (newElements) => {
  if (!excalidrawAPI.value || !newElements || newElements.length === 0) return
  
  excalidrawAPI.value.updateScene({ elements: newElements })
  
  setTimeout(() => {
    excalidrawAPI.value.scrollToContent(newElements, { 
      fitToViewport: true, 
      viewportZoomFactor: 0.8 
    })
  }, 50)
}, { deep: true })
</script>

<template>
  <div class="absolute inset-0 w-full h-full overflow-hidden bg-slate-100 dark:bg-[#1e293b]">
    <Excalidraw
      :excalidrawAPI="(api: any) => excalidrawAPI = api"
      :theme="isDarkMode ? 'dark' : 'light'"
      :initialData="{
        appState: {
          viewBackgroundColor: isDarkMode ? '#1e293b' : '#f1f5f9',
          currentItemFontFamily: 1,
          gridSize: 20,
        },
        scrollToContent: true
      }"
      @change="(els: any) => emit('update:elements', els)"
    />
  </div>
</template>
