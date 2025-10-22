/**
 * useLottie Composable
 * Vue 3 Composition API for Lottie animations
 * 增强版：支持响应式配置、性能优化、错误处理
 */

import { ref, computed, onMounted, onBeforeUnmount, watch, readonly, shallowRef } from 'vue'
import type { Ref, DeepReadonly } from 'vue'
import { lottieManager } from '../../../core/LottieManager'
import type { LottieConfig, ILottieInstance, PerformanceMetrics } from '../../../types'
import type { UseLottieReturn } from '../types'

/**
 * 使用 Lottie 动画
 */
export function useLottie(config: LottieConfig | Ref<LottieConfig>): UseLottieReturn {
  const containerRef = ref<HTMLElement | null>(null)
  const instance = shallowRef<ILottieInstance | null>(null)
  const state = ref<ILottieInstance['state']>('idle')
  const error = ref<Error | null>(null)
  const metrics = ref<PerformanceMetrics | null>(null)

  // 计算属性
  const isPlaying = computed(() => state.value === 'playing')
  const isLoaded = computed(() => state.value !== 'idle' && state.value !== 'loading')
  const hasError = computed(() => error.value !== null)

  // 获取配置（支持 ref 和普通对象）
  const getConfig = (): LottieConfig => {
    return 'value' in config ? config.value : config
  }

  // 初始化动画
  const init = async () => {
    if (!containerRef.value) {
      console.warn('[useLottie] Container ref not ready')
      return
    }

    // 重置错误状态
    error.value = null

    // 销毁旧实例
    if (instance.value) {
      instance.value.destroy()
      instance.value = null
    }

    try {
      // 创建新实例
      const currentConfig = getConfig()
      instance.value = lottieManager.create({
        ...currentConfig,
        container: containerRef.value
      })

      // 监听状态变化
      instance.value.on('stateChange', (newState) => {
        state.value = newState
      })

      // 监听性能警告
      instance.value.on('performanceWarning', (m) => {
        metrics.value = m
      })

      // 监听错误
      instance.value.on('data_failed', (err) => {
        error.value = err
        state.value = 'error'
      })

      // 加载动画
      await instance.value.load()
    } catch (err) {
      console.error('[useLottie] Failed to initialize:', err)
      error.value = err as Error
      state.value = 'error'
    }
  }

  // 控制方法
  const play = () => instance.value?.play()
  const pause = () => instance.value?.pause()
  const stop = () => instance.value?.stop()
  const reset = () => instance.value?.reset()
  const setSpeed = (speed: number) => instance.value?.setSpeed(speed)
  const setDirection = (direction: 1 | -1) => instance.value?.setDirection(direction)

  const goToFrame = (frame: number, play = false) => {
    if (play) {
      instance.value?.goToAndPlay(frame, true)
    } else {
      instance.value?.goToAndStop(frame, true)
    }
  }

  const destroy = () => {
    if (instance.value) {
      instance.value.destroy()
      instance.value = null
      state.value = 'idle'
    }
  }

  // 生命周期
  onMounted(() => {
    init()
  })

  onBeforeUnmount(() => {
    destroy()
  })

  // 监听配置变化（如果是 ref）
  if ('value' in config) {
    watch(config, () => {
      init()
    }, { deep: true })
  }

  // 获取性能指标
  const getMetrics = () => instance.value?.getMetrics() || null

  return {
    containerRef,
    instance: readonly(instance) as DeepReadonly<Ref<ILottieInstance | null>>,
    state: readonly(state),
    error: readonly(error),
    metrics: readonly(metrics),
    isPlaying,
    isLoaded,
    hasError,
    play,
    pause,
    stop,
    reset,
    setSpeed,
    setDirection,
    goToFrame,
    getMetrics,
    destroy
  }
}


