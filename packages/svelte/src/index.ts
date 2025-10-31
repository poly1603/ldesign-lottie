/**
 * @ldesign/lottie-svelte
 * 
 * Svelte components for Lottie animations
 */

// Component
export { default as Lottie } from './Lottie.svelte'

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
