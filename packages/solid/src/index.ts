/**
 * @ldesign/lottie-solid
 * 
 * Solid.js components and composables for Lottie animations
 */

// Component
export { Lottie, type LottieProps } from './Lottie'
export { default } from './Lottie'

// Composable
export { useLottie, type UseLottieOptions, type UseLottieReturn } from './useLottie'

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
