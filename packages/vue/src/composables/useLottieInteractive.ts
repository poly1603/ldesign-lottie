import { ref, onMounted, onUnmounted } from 'vue'
import { useLottie } from './useLottie'
import type { UseLottieOptions } from '../types'

export interface UseLottieInteractiveOptions extends UseLottieOptions {
  playOnHover?: boolean
  playOnClick?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
}

/**
 * Vue 3 Composition API for interactive Lottie animations
 */
export function useLottieInteractive(options: UseLottieInteractiveOptions) {
  const lottie = useLottie(options)
  const isHovering = ref(false)
  
  const handleMouseEnter = () => {
    isHovering.value = true
    if (options.playOnHover) {
      lottie.play()
    }
    options.onMouseEnter?.()
  }
  
  const handleMouseLeave = () => {
    isHovering.value = false
    if (options.playOnHover) {
      lottie.pause()
    }
    options.onMouseLeave?.()
  }
  
  const handleClick = () => {
    if (options.playOnClick) {
      if (lottie.isPlaying.value) {
        lottie.pause()
      } else {
        lottie.play()
      }
    }
    options.onClick?.()
  }
  
  // 设置事件监听
  onMounted(() => {
    if (!lottie.containerRef.value) return
    
    const container = lottie.containerRef.value
    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('click', handleClick)
  })
  
  // 清理
  onUnmounted(() => {
    if (!lottie.containerRef.value) return
    
    const container = lottie.containerRef.value
    container.removeEventListener('mouseenter', handleMouseEnter)
    container.removeEventListener('mouseleave', handleMouseLeave)
    container.removeEventListener('click', handleClick)
  })
  
  return {
    ...lottie,
    isHovering
  }
}

