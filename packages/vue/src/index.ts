import type { App } from 'vue'
import Lottie from './components/Lottie.vue'

export { default as Lottie } from './components/Lottie.vue'
export { useLottie } from './composables/useLottie'
export { useLottieInteractive } from './composables/useLottieInteractive'
export type { LottieProps, UseLottieOptions, UseLottieReturn } from './types'

// 别名
export const LottiePlayer = Lottie

// Vue 插件
export default {
  install(app: App) {
    app.component('Lottie', Lottie)
    app.component('LottiePlayer', Lottie)
  }
}


