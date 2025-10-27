<template>
  <div ref="containerRef" :class="className" :style="style"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { createLottie, type ILottieInstance } from '@ldesign/lottie-core'
import type { LottieProps } from '../types'

const props = withDefaults(defineProps<LottieProps>(), {
  loop: true,
  autoplay: true,
  renderer: 'svg',
  quality: 'high',
  speed: 1,
  direction: 1
})

const emit = defineEmits<{
  ready: [instance: ILottieInstance]
  error: [error: Error]
  complete: []
  loopComplete: []
  enterFrame: [event: any]
  segmentStart: [event: any]
  destroy: []
}>()

const containerRef = ref<HTMLDivElement>()
const instance = ref<ILottieInstance | null>(null)

// 暴露实例和方法
defineExpose({
  instance: computed(() => instance.value),
  play: () => instance.value?.play(),
  pause: () => instance.value?.pause(),
  stop: () => instance.value?.stop(),
  goToAndPlay: (value: number, isFrame?: boolean) => {
    instance.value?.goToAndPlay(value, isFrame)
  },
  goToAndStop: (value: number, isFrame?: boolean) => {
    instance.value?.goToAndStop(value, isFrame)
  },
  setSpeed: (speed: number) => instance.value?.setSpeed(speed),
  setDirection: (direction: 1 | -1) => instance.value?.setDirection(direction),
  destroy: () => instance.value?.destroy(),
  getDuration: () => instance.value?.animation?.getDuration(),
  getCurrentFrame: () => instance.value?.animation?.currentFrame || 0,
  getTotalFrames: () => instance.value?.animation?.totalFrames || 0,
})

// 初始化
onMounted(() => {
  if (!containerRef.value) return

  const lottieInstance = createLottie({
    container: containerRef.value,
    animationData: props.animationData,
    path: props.path,
    loop: props.loop,
    autoplay: props.autoplay,
    renderer: props.renderer,
    quality: props.quality,
    speed: props.speed,
    direction: props.direction,
    ...props.config
  })

  instance.value = lottieInstance

  // 绑定事件
  lottieInstance.on('ready', () => emit('ready', lottieInstance))
  lottieInstance.on('error', (err: Error) => emit('error', err))
  lottieInstance.on('complete', () => emit('complete'))
  lottieInstance.on('loopComplete', () => emit('loopComplete'))
  lottieInstance.on('enterFrame', (e: any) => emit('enterFrame', e))
  lottieInstance.on('segmentStart', (e: any) => emit('segmentStart', e))
  lottieInstance.on('destroy', () => emit('destroy'))
})

// 监听属性变化
watch(() => props.loop, (loop) => {
  instance.value?.setLoop(loop)
})

watch(() => props.speed, (speed) => {
  instance.value?.setSpeed(speed)
})

watch(() => props.direction, (direction) => {
  instance.value?.setDirection(direction)
})

watch(() => props.autoplay, (autoplay) => {
  if (autoplay) {
    instance.value?.play()
  } else {
    instance.value?.pause()
  }
})

// 清理
onUnmounted(() => {
  instance.value?.destroy()
  instance.value = null
})
</script>

<script lang="ts">
export const Lottie = {
  name: 'Lottie'
}

export const LottiePlayer = Lottie
</script>


