import { Component, createEffect, createSignal, onCleanup, onMount, mergeProps } from 'solid-js'
import type { JSX } from 'solid-js'
import type {
  LottieConfig,
  ILottieInstance,
  AnimationState,
  PerformanceMetrics,
  LottieRendererType,
} from '@ldesign/lottie-core'
import { lottieManager } from '@ldesign/lottie-core'

export interface LottieProps {
  path?: string
  animationData?: any
  renderer?: LottieRendererType
  loop?: boolean | number
  autoplay?: boolean
  speed?: number
  name?: string
  config?: Partial<LottieConfig>
  class?: string
  style?: JSX.CSSProperties
  onAnimationCreated?: (instance: ILottieInstance) => void
  onStateChange?: (state: AnimationState) => void
  onComplete?: () => void
  onLoopComplete?: () => void
  onDataReady?: () => void
  onDataFailed?: (error: Error) => void
  onPerformanceWarning?: (metrics: PerformanceMetrics) => void
}

/**
 * Solid.js component for Lottie animations
 * 
 * @example
 * ```tsx
 * <Lottie
 *   path="/animations/loading.json"
 *   autoplay
 *   loop
 *   onAnimationCreated={(instance) => console.log('Created:', instance)}
 * />
 * ```
 */
export const Lottie: Component<LottieProps> = (props) => {
  const merged = mergeProps({
    renderer: 'svg' as LottieRendererType,
    loop: true,
    autoplay: true,
    speed: 1,
  }, props)

  let containerRef: HTMLDivElement | undefined
  const [instance, setInstance] = createSignal<ILottieInstance | null>(null)
  const [state, setState] = createSignal<AnimationState>('idle')

  const initializeAnimation = () => {
    if (!containerRef)
      return

    try {
      const config: LottieConfig = {
        container: containerRef,
        renderer: merged.renderer,
        loop: merged.loop,
        autoplay: merged.autoplay,
        speed: merged.speed,
        name: merged.name,
        path: merged.path,
        animationData: merged.animationData,
        ...merged.config,
        events: {
          ...merged.config?.events,
          stateChange: (newState) => {
            setState(newState)
            merged.onStateChange?.(newState)
            merged.config?.events?.stateChange?.(newState)
          },
          complete: () => {
            merged.onComplete?.()
            merged.config?.events?.complete?.()
          },
          loopComplete: () => {
            merged.onLoopComplete?.()
            merged.config?.events?.loopComplete?.()
          },
          data_ready: () => {
            merged.onDataReady?.()
            merged.config?.events?.data_ready?.()
          },
          data_failed: (error) => {
            merged.onDataFailed?.(error)
            merged.config?.events?.data_failed?.(error)
          },
          performanceWarning: (metrics) => {
            merged.onPerformanceWarning?.(metrics)
            merged.config?.events?.performanceWarning?.(metrics)
          },
        },
      }

      const newInstance = lottieManager.create(config)
      setInstance(newInstance)

      newInstance.load().then(() => {
        merged.onAnimationCreated?.(newInstance)
      }).catch((error) => {
        console.error('[Lottie Solid] Failed to load animation:', error)
        merged.onDataFailed?.(error)
      })
    }
    catch (error) {
      console.error('[Lottie Solid] Failed to create animation:', error)
      merged.onDataFailed?.(error as Error)
    }
  }

  onMount(() => {
    initializeAnimation()
  })

  onCleanup(() => {
    const currentInstance = instance()
    if (currentInstance) {
      try {
        currentInstance.destroy()
      }
      catch (error) {
        console.error('[Lottie Solid] Error destroying instance:', error)
      }
    }
  })

  // Reactive updates for key props
  createEffect(() => {
    const currentInstance = instance()
    if (currentInstance && merged.speed) {
      currentInstance.setSpeed(merged.speed)
    }
  })

  return (
    <div
      ref={containerRef}
      class={merged.class}
      style={{
        width: '100%',
        height: '100%',
        ...merged.style,
      }}
    />
  )
}

export default Lottie
