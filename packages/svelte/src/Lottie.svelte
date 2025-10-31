<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type {
    LottieConfig,
    ILottieInstance,
    AnimationState,
    PerformanceMetrics,
    LottieRendererType,
  } from '@ldesign/lottie-core'
  import { lottieManager } from '@ldesign/lottie-core'

  interface Props {
    path?: string
    animationData?: any
    renderer?: LottieRendererType
    loop?: boolean | number
    autoplay?: boolean
    speed?: number
    name?: string
    config?: Partial<LottieConfig>
    class?: string
    style?: string
    onAnimationCreated?: (instance: ILottieInstance) => void
    onStateChange?: (state: AnimationState) => void
    onComplete?: () => void
    onLoopComplete?: () => void
    onDataReady?: () => void
    onDataFailed?: (error: Error) => void
    onPerformanceWarning?: (metrics: PerformanceMetrics) => void
  }

  let {
    path,
    animationData,
    renderer = 'svg',
    loop = true,
    autoplay = true,
    speed = 1,
    name,
    config,
    class: className,
    style,
    onAnimationCreated,
    onStateChange,
    onComplete,
    onLoopComplete,
    onDataReady,
    onDataFailed,
    onPerformanceWarning,
  }: Props = $props()

  let container: HTMLDivElement
  let instance: ILottieInstance | null = $state(null)
  let animationState: AnimationState = $state('idle')

  function initializeAnimation() {
    if (!container) return

    try {
      const lottieConfig: LottieConfig = {
        container,
        renderer,
        loop,
        autoplay,
        speed,
        name,
        path,
        animationData,
        ...config,
        events: {
          ...config?.events,
          stateChange: (state) => {
            animationState = state
            onStateChange?.(state)
            config?.events?.stateChange?.(state)
          },
          complete: () => {
            onComplete?.()
            config?.events?.complete?.()
          },
          loopComplete: () => {
            onLoopComplete?.()
            config?.events?.loopComplete?.()
          },
          data_ready: () => {
            onDataReady?.()
            config?.events?.data_ready?.()
          },
          data_failed: (error) => {
            onDataFailed?.(error)
            config?.events?.data_failed?.(error)
          },
          performanceWarning: (metrics) => {
            onPerformanceWarning?.(metrics)
            config?.events?.performanceWarning?.(metrics)
          },
        },
      }

      instance = lottieManager.create(lottieConfig)

      instance.load().then(() => {
        onAnimationCreated?.(instance!)
      }).catch((error) => {
        console.error('[Lottie Svelte] Failed to load animation:', error)
        onDataFailed?.(error)
      })
    } catch (error) {
      console.error('[Lottie Svelte] Failed to create animation:', error)
      onDataFailed?.(error as Error)
    }
  }

  onMount(() => {
    initializeAnimation()
  })

  onDestroy(() => {
    if (instance) {
      try {
        instance.destroy()
      } catch (error) {
        console.error('[Lottie Svelte] Error destroying instance:', error)
      }
    }
  })

  // Reactive speed updates
  $effect(() => {
    if (instance && speed) {
      instance.setSpeed(speed)
    }
  })

  // Public API
  export function play() {
    instance?.play()
  }

  export function pause() {
    instance?.pause()
  }

  export function stop() {
    instance?.stop()
  }

  export function reset() {
    instance?.reset()
  }

  export function getInstance() {
    return instance
  }
</script>

<div bind:this={container} class={className} {style}></div>

<style>
  div {
    width: 100%;
    height: 100%;
  }
</style>
