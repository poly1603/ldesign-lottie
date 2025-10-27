import type { LottieConfig } from '@ldesign/lottie-core'

export interface LottieElementProps extends Omit<LottieConfig, 'container'> {
  background?: string
  config?: Partial<LottieConfig>
}

export interface LottiePlayerProps extends LottieElementProps {
  showControls?: boolean
  showProgress?: boolean
  showInfo?: boolean
}

