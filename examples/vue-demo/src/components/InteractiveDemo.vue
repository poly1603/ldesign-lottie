<template>
  <div class="demo-card">
    <h2>交互式动画</h2>
    <div 
      ref="containerRef" 
      class="lottie-container"
      :style="{ cursor: hoverEnabled ? 'pointer' : 'default' }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    />
    <div class="info">
      悬停播放: {{ hoverEnabled ? '开启' : '关闭' }}
    </div>
    <div class="controls">
      <button @click="hoverEnabled = !hoverEnabled">
        切换悬停播放
      </button>
      <button @click="jumpToFrame">跳转到帧</button>
      <button @click="playSegment">播放片段</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLottie } from '@ldesign/lottie-vue'
import animationData from '../animation.json'

const hoverEnabled = ref(false)

const {
  containerRef,
  instance,
  play,
  pause,
  goToAndStop,
  goToAndPlay
} = useLottie({
  animationData,
  loop: false,
  autoplay: false
})

const handleMouseEnter = () => {
  if (hoverEnabled.value) {
    play()
  }
}

const handleMouseLeave = () => {
  if (hoverEnabled.value) {
    pause()
  }
}

const jumpToFrame = () => {
  const frame = prompt('跳转到帧数:')
  if (frame) {
    goToAndStop(parseInt(frame), true)
  }
}

const playSegment = () => {
  if (instance.value?.animation) {
    const totalFrames = instance.value.animation.totalFrames
    const start = Math.floor(totalFrames * 0.25)
    const end = Math.floor(totalFrames * 0.75)
    instance.value.playSegments([start, end], true)
  }
}
</script>

