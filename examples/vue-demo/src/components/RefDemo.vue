<template>
  <div class="demo-card">
    <h2>Ref 控制示例</h2>
    <Lottie
      ref="lottieRef"
      :animation-data="animationData"
      :loop="true"
      :autoplay="true"
      class="lottie-container"
      @enter-frame="updateInfo"
    />
    <div class="info">{{ info }}</div>
    <div class="controls">
      <button @click="setSpeed05">0.5x 速度</button>
      <button @click="setSpeed1">1x 速度</button>
      <button @click="setSpeed2">2x 速度</button>
      <button @click="destroyAnimation">销毁</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Lottie } from '@ldesign/lottie-vue'
import animationData from '../animation.json'

const lottieRef = ref()
const info = ref('准备就绪')

const updateInfo = () => {
  if (lottieRef.value?.instance) {
    const current = lottieRef.value.getCurrentFrame()
    const total = lottieRef.value.getTotalFrames()
    const duration = lottieRef.value.getDuration()
    info.value = `帧: ${current}/${total} | 时长: ${duration?.toFixed(2)}s`
  }
}

const setSpeed05 = () => lottieRef.value?.setSpeed(0.5)
const setSpeed1 = () => lottieRef.value?.setSpeed(1)
const setSpeed2 = () => lottieRef.value?.setSpeed(2)

const destroyAnimation = () => {
  lottieRef.value?.destroy()
  info.value = '动画已销毁'
}
</script>

