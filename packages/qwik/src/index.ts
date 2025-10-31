/**
 * @ldesign/lottie-qwik
 * 
 * Qwik components for Lottie animations with resumability
 */

// Component and hook
export { Lottie, useLottie, type LottieProps, type UseLottieOptions } from './lottie'

// Re-export core types for convenience
export type {
  LottieConfig,
  ILottieInstance,
  AnimationState,
  PerformanceMetrics,
  LottieRendererType,
  AnimationQuality,
  LoadStrategy,
  PlayMode,
} from '@ldesign/lottie-core'
