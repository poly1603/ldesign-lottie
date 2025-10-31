/**
 * @ldesign/lottie-angular
 * 
 * Angular components, directives, and services for Lottie animations
 */

// Component
export { LottieComponent } from './lottie.component'

// Directive
export { LottieDirective } from './lottie.directive'

// Service
export { LottieService } from './lottie.service'

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
