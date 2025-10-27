import { useEffect, useState, useCallback } from 'react'
import { useLottie } from './useLottie'
import type { UseLottieOptions } from '../types'

export interface UseLottieInteractiveOptions extends UseLottieOptions {
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  playOnHover?: boolean
  playOnClick?: boolean
}

/**
 * Interactive Lottie Hook with built-in event handlers
 */
export function useLottieInteractive(options: UseLottieInteractiveOptions) {
  const lottie = useLottie(options)
  const [isHovering, setIsHovering] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
    if (options.playOnHover) {
      lottie.play()
    }
    options.onMouseEnter?.()
  }, [options.playOnHover, options.onMouseEnter, lottie])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
    if (options.playOnHover) {
      lottie.pause()
    }
    options.onMouseLeave?.()
  }, [options.playOnHover, options.onMouseLeave, lottie])

  const handleClick = useCallback(() => {
    if (options.playOnClick) {
      if (lottie.isPlaying) {
        lottie.pause()
      } else {
        lottie.play()
      }
    }
    options.onClick?.()
  }, [options.playOnClick, options.onClick, lottie])

  useEffect(() => {
    const container = lottie.containerRef.current
    if (!container) return

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)
    container.addEventListener('click', handleClick)

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
      container.removeEventListener('click', handleClick)
    }
  }, [handleMouseEnter, handleMouseLeave, handleClick, lottie.containerRef])

  return {
    ...lottie,
    isHovering
  }
}


