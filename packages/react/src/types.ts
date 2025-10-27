import type { CSSProperties, ReactNode } from 'react'
import type { ILottieInstance, LottieConfig } from '@ldesign/lottie-core'

export interface LottieProps extends Omit<LottieConfig, 'container'> {
  className?: string
  style?: CSSProperties
  onReady?: (instance: ILottieInstance) => void
  onError?: (error: Error) => void
  onComplete?: () => void
  onLoopComplete?: () => void
  onEnterFrame?: (event: any) => void
  onSegmentStart?: (event: any) => void
  onDestroy?: () => void
}

export interface LottieRef {
  instance: ILottieInstance | null
  play: () => void
  pause: () => void
  stop: () => void
  goToAndPlay: (value: number, isFrame?: boolean) => void
  goToAndStop: (value: number, isFrame?: boolean) => void
  setSpeed: (speed: number) => void
  setDirection: (direction: 1 | -1) => void
  destroy: () => void
  getDuration: () => number | undefined
  getCurrentFrame: () => number
  getTotalFrames: () => number
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
  containerRef: React.RefObject<HTMLDivElement>
  instance: ILottieInstance | null
  isReady: boolean
  isPlaying: boolean
  isPaused: boolean
  isStopped: boolean
  error: Error | null
  play: () => void
  pause: () => void
  stop: () => void
  goToAndPlay: (value: number, isFrame?: boolean) => void
  goToAndStop: (value: number, isFrame?: boolean) => void
  setSpeed: (speed: number) => void
  setDirection: (direction: 1 | -1) => void
  destroy: () => void
}

export interface LottieContextValue {
  instances: Map<string, ILottieInstance>
  register: (id: string, instance: ILottieInstance) => void
  unregister: (id: string) => void
  get: (id: string) => ILottieInstance | undefined
  playAll: () => void
  pauseAll: () => void
  stopAll: () => void
}


