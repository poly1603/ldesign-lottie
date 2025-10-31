import {
  component$,
  useSignal,
  useVisibleTask$,
  type QRL,
  type Signal,
  useStyles$,
  $,
} from '@builder.io/qwik'
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
  style?: Record<string, string>
  onAnimationCreated$?: QRL<(instance: ILottieInstance) => void>
  onStateChange$?: QRL<(state: AnimationState) => void>
  onComplete$?: QRL<() => void>
  onLoopComplete$?: QRL<() => void>
  onDataReady$?: QRL<() => void>
  onDataFailed$?: QRL<(error: Error) => void>
  onPerformanceWarning$?: QRL<(metrics: PerformanceMetrics) => void>
}

/**
 * Qwik component for Lottie animations with resumability
 * 
 * @example
 * ```tsx
 * <Lottie
 *   path="/animations/loading.json"
 *   autoplay
 *   loop
 *   onAnimationCreated$={(instance) => console.log('Created:', instance)}
 * />
 * ```
 */
export const Lottie = component$<LottieProps>((props) => {
  const containerRef = useSignal<HTMLDivElement>()
  const instanceRef = useSignal<ILottieInstance | null>(null)
  const stateRef = useSignal<AnimationState>('idle')

  useStyles$(`
    .lottie-container {
      width: 100%;
      height: 100%;
    }
  `)

  // Initialize animation when component is visible
  useVisibleTask$(({ track, cleanup }) => {
    track(() => containerRef.value)

    const container = containerRef.value
    if (!container) return

    const config: LottieConfig = {
      container,
      renderer: props.renderer ?? 'svg',
      loop: props.loop ?? true,
      autoplay: props.autoplay ?? true,
      speed: props.speed ?? 1,
      name: props.name,
      path: props.path,
      animationData: props.animationData,
      ...props.config,
      events: {
        ...props.config?.events,
        stateChange: (state) => {
          stateRef.value = state
          props.onStateChange$?.(state)
          props.config?.events?.stateChange?.(state)
        },
        complete: () => {
          props.onComplete$?.()
          props.config?.events?.complete?.()
        },
        loopComplete: () => {
          props.onLoopComplete$?.()
          props.config?.events?.loopComplete?.()
        },
        data_ready: () => {
          props.onDataReady$?.()
          props.config?.events?.data_ready?.()
        },
        data_failed: (error) => {
          props.onDataFailed$?.(error)
          props.config?.events?.data_failed?.(error)
        },
        performanceWarning: (metrics) => {
          props.onPerformanceWarning$?.(metrics)
          props.config?.events?.performanceWarning?.(metrics)
        },
      },
    }

    try {
      const instance = lottieManager.create(config)
      instanceRef.value = instance

      instance.load().then(() => {
        props.onAnimationCreated$?.(instance)
      }).catch((error) => {
        console.error('[Lottie Qwik] Failed to load animation:', error)
        props.onDataFailed$?.(error)
      })

      cleanup(() => {
        if (instanceRef.value) {
          try {
            instanceRef.value.destroy()
          }
          catch (error) {
            console.error('[Lottie Qwik] Error destroying instance:', error)
          }
        }
      })
    }
    catch (error) {
      console.error('[Lottie Qwik] Failed to create animation:', error)
      props.onDataFailed$?.(error as Error)
    }
  })

  return (
    <div
      ref={containerRef}
      class={`lottie-container ${props.class ?? ''}`}
      style={props.style}
    />
  )
})

/**
 * Hook for programmatically controlling Lottie animations in Qwik
 */
export interface UseLottieOptions extends Partial<LottieConfig> {
  container: Signal<HTMLElement | undefined>
}

export const useLottie = (options: UseLottieOptions) => {
  const instance = useSignal<ILottieInstance | null>(null)
  const state = useSignal<AnimationState>('idle')

  const play = $(() => {
    instance.value?.play()
  })

  const pause = $(() => {
    instance.value?.pause()
  })

  const stop = $(() => {
    instance.value?.stop()
  })

  const reset = $(() => {
    instance.value?.reset()
  })

  return {
    instance,
    state,
    play,
    pause,
    stop,
    reset,
  }
}
