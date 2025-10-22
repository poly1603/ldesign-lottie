/**
 * useLottie Hook
 * React Hook for Lottie animations
 * 增强版：支持性能优化、错误处理、内存管理
 */

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { lottieManager } from '../../../core/LottieManager'
import type { LottieConfig, ILottieInstance, AnimationState, PerformanceMetrics } from '../../../types'
import type { UseLottieReturn } from '../types'

/**
 * 使用 Lottie 动画
 */
export function useLottie(config: LottieConfig): UseLottieReturn {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<ILottieInstance | null>(null)
  const [instance, setInstance] = useState<ILottieInstance | null>(null)
  const [state, setState] = useState<AnimationState>('idle')
  const [error, setError] = useState<Error | null>(null)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  // 计算属性（使用 useMemo 优化）
  const isPlaying = useMemo(() => state === 'playing', [state])
  const isLoaded = useMemo(() => state !== 'idle' && state !== 'loading', [state])
  const hasError = useMemo(() => error !== null, [error])

  // 初始化
  useEffect(() => {
    if (!containerRef.current) return

    let mounted = true

    const init = async () => {
      try {
        setError(null)

        const inst = lottieManager.create({
          ...config,
          container: containerRef.current!
        })

        if (!mounted) {
          inst.destroy()
          return
        }

        instanceRef.current = inst

        // 监听状态变化
        inst.on('stateChange', (newState) => {
          if (mounted) {
            setState(newState)
          }
        })

        // 监听性能警告
        inst.on('performanceWarning', (m) => {
          if (mounted) {
            setMetrics(m)
          }
        })

        // 监听错误
        inst.on('data_failed', (err) => {
          if (mounted) {
            setError(err)
            setState('error')
          }
        })

        setInstance(inst)
        await inst.load()
      } catch (err) {
        console.error('[useLottie] Failed to initialize:', err)
        if (mounted) {
          setError(err as Error)
          setState('error')
        }
      }
    }

    init()

    return () => {
      mounted = false
      if (instanceRef.current) {
        instanceRef.current.destroy()
        instanceRef.current = null
      }
    }
  }, [config.path, config.animationData])

  // 控制方法（使用 useCallback 优化）
  const play = useCallback(() => instanceRef.current?.play(), [])
  const pause = useCallback(() => instanceRef.current?.pause(), [])
  const stop = useCallback(() => instanceRef.current?.stop(), [])
  const reset = useCallback(() => instanceRef.current?.reset(), [])
  const setSpeed = useCallback((speed: number) => instanceRef.current?.setSpeed(speed), [])
  const setDirection = useCallback((direction: 1 | -1) => instanceRef.current?.setDirection(direction), [])

  const goToFrame = useCallback((frame: number, shouldPlay = false) => {
    if (shouldPlay) {
      instanceRef.current?.goToAndPlay(frame, true)
    } else {
      instanceRef.current?.goToAndStop(frame, true)
    }
  }, [])

  const getMetrics = useCallback(() => instanceRef.current?.getMetrics() || null, [])

  return {
    containerRef,
    instance,
    state,
    error,
    metrics,
    isPlaying,
    isLoaded,
    hasError,
    play,
    pause,
    stop,
    reset,
    setSpeed,
    setDirection,
    goToFrame,
    getMetrics
  }
}


