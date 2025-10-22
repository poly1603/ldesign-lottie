/**
 * 录制控制器
 * 录制 Lottie 动画播放过程
 */

import type { ILottieInstance } from '../types'

export interface RecordingConfig {
  /** 帧率 */
  fps?: number
  /** 视频质量 (0-1) */
  quality?: number
  /** 是否包含音频 */
  includeAudio?: boolean
  /** 最大录制时长（ms） */
  maxDuration?: number
}

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  frameCount: number
  size: number
}

/**
 * 录制控制器类
 */
export class RecordingController {
  private instance: ILottieInstance
  private config: Required<RecordingConfig>
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private stream: MediaStream | null = null
  private canvas: HTMLCanvasElement | null = null
  private ctx: CanvasRenderingContext2D | null = null

  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    frameCount: 0,
    size: 0
  }

  private startTime: number = 0
  private pauseTime: number = 0
  private callbacks = new Map<string, Set<Function>>()

  constructor(instance: ILottieInstance, config?: RecordingConfig) {
    this.instance = instance

    this.config = {
      fps: config?.fps ?? 30,
      quality: config?.quality ?? 0.9,
      includeAudio: config?.includeAudio ?? false,
      maxDuration: config?.maxDuration ?? 60000
    }
  }

  /**
   * 开始录制
   */
  async start(): Promise<void> {
    if (this.state.isRecording) {
      throw new Error('Already recording')
    }

    if (!this.instance.container) {
      throw new Error('Container not found')
    }

    // 初始化 canvas
    this.initCanvas()

    if (!this.canvas) {
      throw new Error('Failed to initialize canvas')
    }

    // 获取 canvas stream
    this.stream = this.canvas.captureStream(this.config.fps)

    // 检查 MediaRecorder 支持
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder not supported')
    }

    // 选择 MIME 类型
    const mimeTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm'
    ]

    const supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type))
    if (!supportedMimeType) {
      throw new Error('No supported video MIME type found')
    }

    // 创建 MediaRecorder
    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: supportedMimeType,
      videoBitsPerSecond: 2500000 * this.config.quality
    })

    this.recordedChunks = []

    // 监听数据
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data)
        this.state.size += e.data.size
      }
    }

    // 监听停止
    this.mediaRecorder.onstop = () => {
      this.emit('recordingStop', this.getState())
    }

    // 开始录制
    this.mediaRecorder.start(100) // 每100ms收集一次数据
    this.state.isRecording = true
    this.startTime = performance.now()

    // 开始渲染循环
    this.startRenderLoop()

    // 自动停止（如果设置了最大时长）
    if (this.config.maxDuration > 0) {
      setTimeout(() => {
        if (this.state.isRecording) {
          this.stop()
        }
      }, this.config.maxDuration)
    }

    this.emit('recordingStart')
  }

  /**
   * 暂停录制
   */
  pause(): void {
    if (!this.state.isRecording || this.state.isPaused) return

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause()
      this.state.isPaused = true
      this.pauseTime = performance.now()
      this.emit('recordingPause')
    }
  }

  /**
   * 恢复录制
   */
  resume(): void {
    if (!this.state.isRecording || !this.state.isPaused) return

    if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume()
      this.state.isPaused = false
      this.emit('recordingResume')
    }
  }

  /**
   * 停止录制
   */
  async stop(): Promise<Blob> {
    if (!this.state.isRecording) {
      throw new Error('Not recording')
    }

    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('MediaRecorder not initialized'))
        return
      }

      const handleStop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType || 'video/webm'
        })

        this.state.isRecording = false
        this.state.isPaused = false
        this.state.duration = performance.now() - this.startTime

        // 清理
        this.cleanup()

        this.emit('recordingComplete', blob)
        resolve(blob)
      }

      if (this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.onstop = handleStop
        this.mediaRecorder.stop()
      } else {
        handleStop()
      }
    })
  }

  /**
   * 初始化 canvas
   */
  private initCanvas(): void {
    if (!this.instance.container) return

    this.canvas = document.createElement('canvas')
    this.ctx = this.canvas.getContext('2d', {
      alpha: true
    })

    const rect = this.instance.container.getBoundingClientRect()
    this.canvas.width = rect.width
    this.canvas.height = rect.height

    // 设置样式（隐藏）
    this.canvas.style.display = 'none'
    document.body.appendChild(this.canvas)
  }

  /**
   * 开始渲染循环
   */
  private startRenderLoop(): void {
    const render = () => {
      if (!this.state.isRecording || !this.ctx || !this.canvas) return

      // 清空 canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

      // 绘制当前动画帧
      // 这里需要将 DOM 内容绘制到 canvas
      // 实际实现需要使用 html2canvas 或 drawImage

      this.state.frameCount++

      if (this.state.isRecording && !this.state.isPaused) {
        requestAnimationFrame(render)
      }
    }

    render()
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.canvas) {
      this.canvas.remove()
      this.canvas = null
      this.ctx = null
    }

    this.mediaRecorder = null
  }

  /**
   * 获取状态
   */
  getState(): RecordingState {
    return { ...this.state }
  }

  /**
   * 获取录制数据
   */
  getRecordedData(): Blob | null {
    if (this.recordedChunks.length === 0) return null

    return new Blob(this.recordedChunks, {
      type: this.mediaRecorder?.mimeType || 'video/webm'
    })
  }

  /**
   * 下载录制结果
   */
  async download(filename: string = 'recording.webm'): Promise<void> {
    const blob = await this.stop()

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
        console.error('[RecordingController] Error in callback:', error)
      }
    })
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.state.isRecording) {
      this.stop().catch(console.error)
    }
    this.cleanup()
    this.callbacks.clear()
  }
}

