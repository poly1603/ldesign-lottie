import { useEffect, useRef, useState, useCallback } from 'react'
import { createLottie, type ILottieInstance, type LottieConfig } from '@ldesign/lottie-core'
import type { UseLottieOptions, UseLottieReturn } from '../types'

/**
 * React Hook for Lottie animations
 */
export function useLottie(options: UseLottieOptions): UseLottieReturn {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<ILottieInstance | null>(null)
  const [isReady, setIsReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isStopped, setIsStopped] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // 控制方法
  const play = useCallback(() => {
    instanceRef.current?.play()
  }, [])

  const pause = useCallback(() => {
    instanceRef.current?.pause()
  }, [])

  const stop = useCallback(() => {
    instanceRef.current?.stop()
  }, [])

  const goToAndPlay = useCallback((value: number, isFrame?: boolean) => {
    instanceRef.current?.goToAndPlay(value, isFrame)
  }, [])

  const goToAndStop = useCallback((value: number, isFrame?: boolean) => {
    instanceRef.current?.goToAndStop(value, isFrame)
  }, [])

  const setSpeed = useCallback((speed: number) => {
    instanceRef.current?.setSpeed(speed)
  }, [])

  const setDirection = useCallback((direction: 1 | -1) => {
    instanceRef.current?.setDirection(direction)
  }, [])

  const destroy = useCallback(() => {
    instanceRef.current?.destroy()
    instanceRef.current = null
    setIsReady(false)
    setIsPlaying(false)
    setIsPaused(false)
    setIsStopped(true)
  }, [])

  // 初始化
  useEffect(() => {
    if (!containerRef.current) return

    const config: LottieConfig = {
      container: containerRef.current,
      ...options,
    }

    try {
      const instance = createLottie(config)
      instanceRef.current = instance

      // 状态监听
      instance.on('ready', () => {
        setIsReady(true)
        setError(null)
        options.onReady?.(instance)
      })

      instance.on('play', () => {
        setIsPlaying(true)
        setIsPaused(false)
        setIsStopped(false)
      })

      instance.on('pause', () => {
        setIsPlaying(false)
        setIsPaused(true)
        setIsStopped(false)
      })

      instance.on('stop', () => {
        setIsPlaying(false)
        setIsPaused(false)
        setIsStopped(true)
      })

      instance.on('error', (err: Error) => {
        setError(err)
        options.onError?.(err)
      })

      // 绑定其他事件
      if (options.onComplete) instance.on('complete', options.onComplete)
      if (options.onLoopComplete) instance.on('loopComplete', options.onLoopComplete)
      if (options.onEnterFrame) instance.on('enterFrame', options.onEnterFrame)
      if (options.onSegmentStart) instance.on('segmentStart', options.onSegmentStart)
      if (options.onDestroy) instance.on('destroy', options.onDestroy)

    } catch (err) {
      setError(err as Error)
      options.onError?.(err as Error)
    }

    // 清理
    return () => {
      destroy()
    }
  }, [options.path, options.animationData])

  return {
    containerRef,
    instance: instanceRef.current,
    isReady,
    isPlaying,
    isPaused,
    isStopped,
    error,
    play,
    pause,
    stop,
    goToAndPlay,
    goToAndStop,
    setSpeed,
    setDirection,
    destroy,
  }
}


