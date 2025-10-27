import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { createLottie, type ILottieInstance, type LottieConfig } from '@ldesign/lottie-core'
import type { LottieProps, LottieRef } from '../types'

/**
 * Lottie React Component
 */
export const Lottie = forwardRef<LottieRef, LottieProps>(({
  animationData,
  path,
  loop = true,
  autoplay = true,
  renderer = 'svg',
  quality = 'high',
  speed = 1,
  direction = 1,
  className,
  style,
  onComplete,
  onLoopComplete,
  onEnterFrame,
  onSegmentStart,
  onReady,
  onError,
  onDestroy,
  ...restConfig
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const instanceRef = useRef<ILottieInstance | null>(null)

  useImperativeHandle(ref, () => ({
    get instance() {
      return instanceRef.current
    },
    play: () => instanceRef.current?.play(),
    pause: () => instanceRef.current?.pause(),
    stop: () => instanceRef.current?.stop(),
    goToAndPlay: (value: number, isFrame?: boolean) => {
      instanceRef.current?.goToAndPlay(value, isFrame)
    },
    goToAndStop: (value: number, isFrame?: boolean) => {
      instanceRef.current?.goToAndStop(value, isFrame)
    },
    setSpeed: (speed: number) => instanceRef.current?.setSpeed(speed),
    setDirection: (direction: 1 | -1) => instanceRef.current?.setDirection(direction),
    destroy: () => instanceRef.current?.destroy(),
    getDuration: () => instanceRef.current?.animation?.getDuration(),
    getCurrentFrame: () => instanceRef.current?.animation?.currentFrame || 0,
    getTotalFrames: () => instanceRef.current?.animation?.totalFrames || 0,
  }), [])

  useEffect(() => {
    if (!containerRef.current) return

    const config: LottieConfig = {
      container: containerRef.current,
      animationData,
      path,
      loop,
      autoplay,
      renderer,
      quality,
      speed,
      direction,
      ...restConfig
    }

    // 创建实例
    const instance = createLottie(config)
    instanceRef.current = instance

    // 绑定事件
    if (onComplete) instance.on('complete', onComplete)
    if (onLoopComplete) instance.on('loopComplete', onLoopComplete)
    if (onEnterFrame) instance.on('enterFrame', onEnterFrame)
    if (onSegmentStart) instance.on('segmentStart', onSegmentStart)
    if (onDestroy) instance.on('destroy', onDestroy)

    // 加载完成事件
    instance.on('ready', () => {
      onReady?.(instance)
    })

    // 错误事件
    instance.on('error', (error: Error) => {
      onError?.(error)
    })

    // 清理函数
    return () => {
      if (onComplete) instance.off('complete', onComplete)
      if (onLoopComplete) instance.off('loopComplete', onLoopComplete)
      if (onEnterFrame) instance.off('enterFrame', onEnterFrame)
      if (onSegmentStart) instance.off('segmentStart', onSegmentStart)
      if (onDestroy) instance.off('destroy', onDestroy)

      instance.destroy()
      instanceRef.current = null
    }
  }, [path, animationData]) // 只在动画源改变时重新创建

  // 更新属性
  useEffect(() => {
    if (!instanceRef.current) return
    instanceRef.current.setLoop(loop)
  }, [loop])

  useEffect(() => {
    if (!instanceRef.current) return
    instanceRef.current.setSpeed(speed)
  }, [speed])

  useEffect(() => {
    if (!instanceRef.current) return
    instanceRef.current.setDirection(direction)
  }, [direction])

  useEffect(() => {
    if (!instanceRef.current) return
    if (autoplay) {
      instanceRef.current.play()
    } else {
      instanceRef.current.pause()
    }
  }, [autoplay])

  return (
    <div
      ref={containerRef}
      className={className}
      style={style}
    />
  )
})

Lottie.displayName = 'Lottie'

// 别名导出
export const LottiePlayer = Lottie


