import { ref, onMounted, onUnmounted, shallowRef, computed } from 'vue'
import { createLottie, type ILottieInstance } from '@ldesign/lottie-core'
import type { UseLottieOptions, UseLottieReturn } from '../types'

/**
 * Vue 3 Composition API for Lottie animations
 */
export function useLottie(options: UseLottieOptions): UseLottieReturn {
  const containerRef = ref<HTMLDivElement>()
  const instance = shallowRef<ILottieInstance | null>(null)
  const isReady = ref(false)
  const isPlaying = ref(false)
  const isPaused = ref(false)
  const isStopped = ref(true)
  const error = ref<Error | null>(null)

  // 控制方法
  const play = () => instance.value?.play()
  const pause = () => instance.value?.pause()
  const stop = () => instance.value?.stop()

  const goToAndPlay = (value: number, isFrame?: boolean) => {
    instance.value?.goToAndPlay(value, isFrame)
  }

  const goToAndStop = (value: number, isFrame?: boolean) => {
    instance.value?.goToAndStop(value, isFrame)
  }

  const setSpeed = (speed: number) => {
    instance.value?.setSpeed(speed)
  }

  const setDirection = (direction: 1 | -1) => {
    instance.value?.setDirection(direction)
  }

  const destroy = () => {
    instance.value?.destroy()
    instance.value = null
    isReady.value = false
    isPlaying.value = false
    isPaused.value = false
    isStopped.value = true
  }

  // 获取动画信息
  const duration = computed(() => instance.value?.animation?.getDuration())
  const currentFrame = computed(() => instance.value?.animation?.currentFrame || 0)
  const totalFrames = computed(() => instance.value?.animation?.totalFrames || 0)
  const frameRate = computed(() => instance.value?.animation?.frameRate || 0)

  // 初始化
  onMounted(() => {
    if (!containerRef.value) return

    try {
      const lottieInstance = createLottie({
        container: containerRef.value,
        ...options,
      })

      instance.value = lottieInstance

      // 状态监听
      lottieInstance.on('ready', () => {
        isReady.value = true
        error.value = null
        options.onReady?.(lottieInstance)
      })

      lottieInstance.on('play', () => {
        isPlaying.value = true
        isPaused.value = false
        isStopped.value = false
      })

      lottieInstance.on('pause', () => {
        isPlaying.value = false
        isPaused.value = true
        isStopped.value = false
      })

      lottieInstance.on('stop', () => {
        isPlaying.value = false
        isPaused.value = false
        isStopped.value = true
      })

      lottieInstance.on('error', (err: Error) => {
        error.value = err
        options.onError?.(err)
      })

      // 绑定其他事件
      if (options.onComplete) lottieInstance.on('complete', options.onComplete)
      if (options.onLoopComplete) lottieInstance.on('loopComplete', options.onLoopComplete)
      if (options.onEnterFrame) lottieInstance.on('enterFrame', options.onEnterFrame)
      if (options.onSegmentStart) lottieInstance.on('segmentStart', options.onSegmentStart)
      if (options.onDestroy) lottieInstance.on('destroy', options.onDestroy)

    } catch (err) {
      error.value = err as Error
      options.onError?.(err as Error)
    }
  })

  // 清理
  onUnmounted(() => {
    destroy()
  })

  return {
    containerRef,
    instance: computed(() => instance.value),
    isReady: computed(() => isReady.value),
    isPlaying: computed(() => isPlaying.value),
    isPaused: computed(() => isPaused.value),
    isStopped: computed(() => isStopped.value),
    error: computed(() => error.value),
    duration,
    currentFrame,
    totalFrames,
    frameRate,
    play,
    pause,
    stop,
    goToAndPlay,
    goToAndStop,
    setSpeed,
    setDirection,
    destroy,
  }
}


