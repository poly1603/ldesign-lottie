import { createSignal, onCleanup, createEffect, Accessor } from 'solid-js'
import type { LottieConfig, ILottieInstance, AnimationState, PerformanceMetrics } from '@ldesign/lottie-core'
import { lottieManager } from '@ldesign/lottie-core'

export interface UseLottieOptions extends Partial<LottieConfig> {
  container?: HTMLElement | string | Accessor<HTMLElement | undefined>
}

export interface UseLottieReturn {
  instance: Accessor<ILottieInstance | null>
  state: Accessor<AnimationState>
  metrics: Accessor<PerformanceMetrics | null>
  play: () => void
  pause: () => void
  stop: () => void
  reset: () => void
  setSpeed: (speed: number) => void
  setDirection: (direction: 1 | -1) => void
  goToAndStop: (frame: number, isFrame?: boolean) => void
  goToAndPlay: (frame: number, isFrame?: boolean) => void
}

/**
 * Solid.js composable for programmatically controlling Lottie animations
 * 
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   let containerRef: HTMLDivElement | undefined
 *   const lottie = useLottie({
 *     container: () => containerRef,
 *     path: '/animation.json',
 *     autoplay: true
 *   })
 * 
 *   return (
 *     <div>
 *       <div ref={containerRef} />
 *       <button onClick={() => lottie.play()}>Play</button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useLottie(options: UseLottieOptions): UseLottieReturn {
  const [instance, setInstance] = createSignal<ILottieInstance | null>(null)
  const [state, setState] = createSignal<AnimationState>('idle')
  const [metrics, setMetrics] = createSignal<PerformanceMetrics | null>(null)

  createEffect(() => {
    const containerValue = typeof options.container === 'function'
      ? options.container()
      : options.container

    if (!containerValue)
      return

    const config: LottieConfig = {
      ...options,
      container: containerValue,
      events: {
        ...options.events,
        stateChange: (newState) => {
          setState(newState)
          options.events?.stateChange?.(newState)
        },
        performanceWarning: (newMetrics) => {
          setMetrics(newMetrics)
          options.events?.performanceWarning?.(newMetrics)
        },
      },
    }

    const newInstance = lottieManager.create(config)
    setInstance(newInstance)

    newInstance.load().catch((error) => {
      console.error('[useLottie] Failed to load animation:', error)
    })
  })

  onCleanup(() => {
    const currentInstance = instance()
    if (currentInstance) {
      try {
        currentInstance.destroy()
      }
      catch (error) {
        console.error('[useLottie] Error destroying instance:', error)
      }
    }
  })

  return {
    instance,
    state,
    metrics,
    play: () => instance()?.play(),
    pause: () => instance()?.pause(),
    stop: () => instance()?.stop(),
    reset: () => instance()?.reset(),
    setSpeed: (speed: number) => instance()?.setSpeed(speed),
    setDirection: (direction: 1 | -1) => instance()?.setDirection(direction),
    goToAndStop: (frame: number, isFrame?: boolean) => instance()?.goToAndStop(frame, isFrame),
    goToAndPlay: (frame: number, isFrame?: boolean) => instance()?.goToAndPlay(frame, isFrame),
  }
}
