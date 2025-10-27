export { LottieElement } from './lottie-element'
export { LottiePlayer } from './lottie-player'
export type { LottieElementProps, LottiePlayerProps } from './types'

// 注册自定义元素
import { LottieElement } from './lottie-element'
import { LottiePlayer } from './lottie-player'

if (!customElements.get('lottie-element')) {
  customElements.define('lottie-element', LottieElement)
}

if (!customElements.get('lottie-player')) {
  customElements.define('lottie-player', LottiePlayer)
}


