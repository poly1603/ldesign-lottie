<template>
  <div class="demo-card">
    <h2>useLottie Hook 示例</h2>
    <div ref="containerRef" class="lottie-container" />
    <div class="info">
      状态: {{ isReady ? (isPlaying ? '播放中' : '已暂停') : '加载中' }}
    </div>
    <div class="controls">
      <button @click="play">播放</button>
      <button @click="pause">暂停</button>
      <button @click="stop">停止</button>
      <button @click="toggleDirection">
        方向: {{ currentDirection > 0 ? '正向' : '反向' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLottie } from '@ldesign/lottie-vue'
import animationData from '../animation.json'

const currentDirection = ref<1 | -1>(1)

const {
  containerRef,
  isReady,
  isPlaying,
  play,
  pause,
  stop,
  setDirection
} = useLottie({
  animationData,
  loop: true,
  autoplay: false,
  renderer: 'canvas'
})

const toggleDirection = () => {
  currentDirection.value = currentDirection.value === 1 ? -1 : 1
  setDirection(currentDirection.value)
}
</script>

