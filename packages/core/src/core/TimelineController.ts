/**
 * 时间线控制器
 * 提供高级时间线编辑和动画合成功能
 */

import type { ILottieInstance } from '../types'

export interface Keyframe {
  id: string
  time: number // 时间（秒）
  value: any
  easing?: EasingFunction
  label?: string
}

export interface Track {
  id: string
  name: string
  keyframes: Keyframe[]
  enabled: boolean
  locked: boolean
}

export interface TimelineConfig {
  /** 时间线时长（秒） */
  duration: number
  /** 帧率 */
  fps: number
  /** 是否循环 */
  loop?: boolean
  /** 自动播放 */
  autoplay?: boolean
}

export type EasingFunction =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | ((t: number) => number)

/**
 * 时间线控制器类
 */
export class TimelineController {
  private instance: ILottieInstance
  private config: Required<TimelineConfig>
  private tracks: Map<string, Track> = new Map()
  private currentTime: number = 0
  private isPlaying: boolean = false
  private animationFrameId: number | null = null
  private lastFrameTime: number = 0
  private callbacks = new Map<string, Set<Function>>()
  private markers = new Map<string, number>()

  // 缓动函数库
  private easingFunctions = new Map<string, (t: number) => number>([
    ['linear', (t) => t],
    ['easeIn', (t) => t * t],
    ['easeOut', (t) => t * (2 - t)],
    ['easeInOut', (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t],
    ['easeInCubic', (t) => t * t * t],
    ['easeOutCubic', (t) => (--t) * t * t + 1],
    ['easeInOutCubic', (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1],
    ['easeInQuart', (t) => t * t * t * t],
    ['easeOutQuart', (t) => 1 - (--t) * t * t * t],
    ['easeInOutQuart', (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t],
  ])

  constructor(instance: ILottieInstance, config: TimelineConfig) {
    this.instance = instance
    this.config = {
      duration: config.duration,
      fps: config.fps,
      loop: config.loop ?? false,
      autoplay: config.autoplay ?? false
    }

    if (this.config.autoplay) {
      this.play()
    }
  }

  /**
   * 添加轨道
   */
  addTrack(name: string, track?: Partial<Track>): string {
    const id = track?.id || `track-${this.tracks.size + 1}-${Date.now()}`

    this.tracks.set(id, {
      id,
      name,
      keyframes: track?.keyframes || [],
      enabled: track?.enabled ?? true,
      locked: track?.locked ?? false
    })

    this.emit('trackAdded', { id, name })
    return id
  }

  /**
   * 移除轨道
   */
  removeTrack(trackId: string): boolean {
    const result = this.tracks.delete(trackId)
    if (result) {
      this.emit('trackRemoved', { id: trackId })
    }
    return result
  }

  /**
   * 获取轨道
   */
  getTrack(trackId: string): Track | undefined {
    return this.tracks.get(trackId)
  }

  /**
   * 获取所有轨道
   */
  getAllTracks(): Track[] {
    return Array.from(this.tracks.values())
  }

  /**
   * 添加关键帧
   */
  addKeyframe(trackId: string, keyframe: Omit<Keyframe, 'id'>): string {
    const track = this.tracks.get(trackId)
    if (!track) {
      throw new Error(`Track not found: ${trackId}`)
    }

    if (track.locked) {
      throw new Error(`Track is locked: ${trackId}`)
    }

    const id = `keyframe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newKeyframe: Keyframe = { id, ...keyframe }

    track.keyframes.push(newKeyframe)
    track.keyframes.sort((a, b) => a.time - b.time)

    this.emit('keyframeAdded', { trackId, keyframe: newKeyframe })
    return id
  }

  /**
   * 移除关键帧
   */
  removeKeyframe(trackId: string, keyframeId: string): boolean {
    const track = this.tracks.get(trackId)
    if (!track || track.locked) return false

    const index = track.keyframes.findIndex(kf => kf.id === keyframeId)
    if (index === -1) return false

    track.keyframes.splice(index, 1)
    this.emit('keyframeRemoved', { trackId, keyframeId })
    return true
  }

  /**
   * 更新关键帧
   */
  updateKeyframe(trackId: string, keyframeId: string, updates: Partial<Keyframe>): boolean {
    const track = this.tracks.get(trackId)
    if (!track || track.locked) return false

    const keyframe = track.keyframes.find(kf => kf.id === keyframeId)
    if (!keyframe) return false

    Object.assign(keyframe, updates)

    // 如果时间改变了，重新排序
    if (updates.time !== undefined) {
      track.keyframes.sort((a, b) => a.time - b.time)
    }

    this.emit('keyframeUpdated', { trackId, keyframeId, updates })
    return true
  }

  /**
   * 插值计算
   */
  private interpolate(startValue: any, endValue: any, progress: number, easing?: EasingFunction): any {
    // 应用缓动函数
    let t = progress
    if (easing) {
      if (typeof easing === 'function') {
        t = easing(progress)
      } else {
        const easingFn = this.easingFunctions.get(easing)
        if (easingFn) {
          t = easingFn(progress)
        }
      }
    }

    // 数字插值
    if (typeof startValue === 'number' && typeof endValue === 'number') {
      return startValue + (endValue - startValue) * t
    }

    // 数组插值（如颜色）
    if (Array.isArray(startValue) && Array.isArray(endValue)) {
      return startValue.map((start, i) => {
        const end = endValue[i]
        if (typeof start === 'number' && typeof end === 'number') {
          return start + (end - start) * t
        }
        return end
      })
    }

    // 对象插值
    if (typeof startValue === 'object' && typeof endValue === 'object') {
      const result: any = {}
      for (const key in endValue) {
        if (key in startValue) {
          result[key] = this.interpolate(startValue[key], endValue[key], t, easing)
        } else {
          result[key] = endValue[key]
        }
      }
      return result
    }

    // 默认返回结束值
    return t < 1 ? startValue : endValue
  }

  /**
   * 计算指定时间的值
   */
  getValueAtTime(trackId: string, time: number): any {
    const track = this.tracks.get(trackId)
    if (!track || !track.enabled || track.keyframes.length === 0) {
      return null
    }

    const keyframes = track.keyframes

    // 如果时间在第一个关键帧之前
    if (time <= keyframes[0].time) {
      return keyframes[0].value
    }

    // 如果时间在最后一个关键帧之后
    if (time >= keyframes[keyframes.length - 1].time) {
      return keyframes[keyframes.length - 1].value
    }

    // 找到时间所在的关键帧区间
    for (let i = 0; i < keyframes.length - 1; i++) {
      const current = keyframes[i]
      const next = keyframes[i + 1]

      if (time >= current.time && time <= next.time) {
        const duration = next.time - current.time
        const progress = duration > 0 ? (time - current.time) / duration : 0
        return this.interpolate(current.value, next.value, progress, current.easing)
      }
    }

    return null
  }

  /**
   * 播放
   */
  play(): void {
    if (this.isPlaying) return

    this.isPlaying = true
    this.lastFrameTime = performance.now()
    this.animate()
    this.emit('play')
  }

  /**
   * 暂停
   */
  pause(): void {
    if (!this.isPlaying) return

    this.isPlaying = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.emit('pause')
  }

  /**
   * 停止
   */
  stop(): void {
    this.pause()
    this.currentTime = 0
    this.emit('stop')
  }

  /**
   * 动画循环
   */
  private animate = (): void => {
    if (!this.isPlaying) return

    const now = performance.now()
    const deltaTime = (now - this.lastFrameTime) / 1000 // 转换为秒
    this.lastFrameTime = now

    // 更新当前时间
    this.currentTime += deltaTime

    // 处理循环
    if (this.currentTime >= this.config.duration) {
      if (this.config.loop) {
        this.currentTime = this.currentTime % this.config.duration
        this.emit('loop')
      } else {
        this.currentTime = this.config.duration
        this.pause()
        this.emit('complete')
        return
      }
    }

    // 更新所有轨道的值
    this.updateTracks(this.currentTime)

    // 触发时间更新事件
    this.emit('timeUpdate', { time: this.currentTime })

    // 继续动画
    this.animationFrameId = requestAnimationFrame(this.animate)
  }

  /**
   * 更新所有轨道
   */
  private updateTracks(time: number): void {
    for (const track of this.tracks.values()) {
      if (!track.enabled) continue

      const value = this.getValueAtTime(track.id, time)
      if (value !== null) {
        this.emit('trackUpdate', { trackId: track.id, value, time })
      }
    }
  }

  /**
   * 跳转到指定时间
   */
  seekTo(time: number): void {
    this.currentTime = Math.max(0, Math.min(time, this.config.duration))
    this.updateTracks(this.currentTime)
    this.emit('seek', { time: this.currentTime })
  }

  /**
   * 添加标记点
   */
  addMarker(label: string, time: number): void {
    this.markers.set(label, time)
    this.emit('markerAdded', { label, time })
  }

  /**
   * 跳转到标记点
   */
  seekToMarker(label: string): boolean {
    const time = this.markers.get(label)
    if (time === undefined) return false

    this.seekTo(time)
    return true
  }

  /**
   * 获取当前时间
   */
  getCurrentTime(): number {
    return this.currentTime
  }

  /**
   * 设置时长
   */
  setDuration(duration: number): void {
    this.config.duration = duration
    if (this.currentTime > duration) {
      this.currentTime = duration
    }
    this.emit('durationChanged', { duration })
  }

  /**
   * 导出时间线数据
   */
  export(): {
    config: TimelineConfig
    tracks: Track[]
    markers: Record<string, number>
  } {
    return {
      config: { ...this.config },
      tracks: Array.from(this.tracks.values()),
      markers: Object.fromEntries(this.markers)
    }
  }

  /**
   * 导入时间线数据
   */
  import(data: ReturnType<typeof this.export>): void {
    this.config = { ...data.config }
    this.tracks.clear()
    this.markers.clear()

    data.tracks.forEach(track => {
      this.tracks.set(track.id, { ...track })
    })

    Object.entries(data.markers).forEach(([label, time]) => {
      this.markers.set(label, time)
    })

    this.emit('imported')
  }

  /**
   * 事件监听
   */
  on(event: string, callback: Function): void {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, new Set())
    }
    this.callbacks.get(event)!.add(callback)
  }

  /**
   * 移除事件监听
   */
  off(event: string, callback?: Function): void {
    if (!callback) {
      this.callbacks.delete(event)
      return
    }
    this.callbacks.get(event)?.delete(callback)
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    this.callbacks.get(event)?.forEach(callback => {
      try {
        callback(data)
      } catch (error) {
        console.error('[TimelineController] Error in callback:', error)
      }
    })
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.pause()
    this.tracks.clear()
    this.markers.clear()
    this.callbacks.clear()
  }
}

