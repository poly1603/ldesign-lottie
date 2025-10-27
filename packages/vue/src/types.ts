import type { ComputedRef, Ref, CSSProperties } from 'vue'
import type { ILottieInstance, LottieConfig } from '@ldesign/lottie-core'

export interface LottieProps extends Omit<LottieConfig, 'container'> {
  className?: string
  style?: CSSProperties
  config?: Partial<LottieConfig>
}

export interface UseLottieOptions extends Omit<LottieConfig, 'container'> {
  onReady?: (instance: ILottieInstance) => void
  onError?: (error: Error) => void
  onComplete?: () => void
  onLoopComplete?: () => void
  onEnterFrame?: (event: any) => void
  onSegmentStart?: (event: any) => void
  onDestroy?: () => void
}

export interface UseLottieReturn {
  containerRef: Ref<HTMLDivElement | undefined>
  instance: ComputedRef<ILottieInstance | null>
  isReady: ComputedRef<boolean>
  isPlaying: ComputedRef<boolean>
  isPaused: ComputedRef<boolean>
  isStopped: ComputedRef<boolean>
  error: ComputedRef<Error | null>
  duration: ComputedRef<number | undefined>
  currentFrame: ComputedRef<number>
  totalFrames: ComputedRef<number>
  frameRate: ComputedRef<number>
  play: () => void
  pause: () => void
  stop: () => void
  goToAndPlay: (value: number, isFrame?: boolean) => void
  goToAndStop: (value: number, isFrame?: boolean) => void
  setSpeed: (speed: number) => void
  setDirection: (direction: 1 | -1) => void
  destroy: () => void
}


