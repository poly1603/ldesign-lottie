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
  /** 视频格式 */
  mimeType?: string
  /** 宽度 */
  width?: number
  /** 高度 */
  height?: number
  /** 背景色 */
  backgroundColor?: string
  /** 是否实时预览 */
  showPreview?: boolean
  /** 音频源 */
  audioSource?: MediaStream | HTMLAudioElement
}

export interface RecordingState {
  isRecording: boolean
  isPaused: boolean
  duration: number
  frameCount: number
  size: number
  currentTime: number
  estimatedSize: number
  fps: number
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
  private animationFrameId: number | null = null
  private previewCanvas: HTMLCanvasElement | null = null
  private audioStream: MediaStream | null = null
  private offscreenCanvas: OffscreenCanvas | null = null
  private useOffscreen = false

  private state: RecordingState = {
    isRecording: false,
    isPaused: false,
    duration: 0,
    frameCount: 0,
    size: 0,
    currentTime: 0,
    estimatedSize: 0,
    fps: 0
  }

  private startTime: number = 0
  private pauseTime: number = 0
  private pausedDuration: number = 0
  private lastFrameTime: number = 0
  private callbacks = new Map<string, Set<Function>>()

  private originalRenderer: string | undefined
  private originalContainer: HTMLElement | string | undefined
  private canvasAnimation: any

  constructor(instance: ILottieInstance, config?: RecordingConfig) {
    this.instance = instance

    this.config = {
      fps: config?.fps ?? 30,
      quality: config?.quality ?? 0.9,
      includeAudio: config?.includeAudio ?? false,
      maxDuration: config?.maxDuration ?? 60000,
      mimeType: config?.mimeType ?? 'video/webm',
      width: config?.width ?? 0,
      height: config?.height ?? 0,
      backgroundColor: config?.backgroundColor ?? 'transparent',
      showPreview: config?.showPreview ?? false,
      audioSource: config?.audioSource ?? null
    }

    this.checkOffscreenSupport()
  }

  /**
   * 检查 OffscreenCanvas 支持
   */
  private checkOffscreenSupport(): void {
    if (typeof OffscreenCanvas !== 'undefined') {
      try {
        this.offscreenCanvas = new OffscreenCanvas(1, 1)
        this.useOffscreen = true
      } catch (e) {
        console.warn('OffscreenCanvas not supported:', e)
      }
    }
  }

  /**
   * 开始录制
   */
  async start(): Promise<void> {
    if (this.state.isRecording) {
      throw new Error('Already recording')
    }

    if (!this.instance.animation) {
      throw new Error('Animation not loaded')
    }

    // 初始化 canvas
    await this.initCanvas()

    if (!this.canvas) {
      throw new Error('Failed to initialize canvas')
    }

    // 获取 canvas stream
    this.stream = this.canvas.captureStream(this.config.fps)

    // 处理音频
    if (this.config.includeAudio) {
      await this.setupAudio()
    }

    // 检查 MediaRecorder 支持
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder not supported')
    }

    // 选择 MIME 类型
    let supportedMimeType = this.config.mimeType

    if (!MediaRecorder.isTypeSupported(supportedMimeType)) {
      const mimeTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=vp8',
        'video/webm',
        'video/mp4'
      ]

      supportedMimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm'
    }

    // 合并音视频流
    const recordStream = this.audioStream ? this.combineStreams(this.stream, this.audioStream) : this.stream

    // 创建 MediaRecorder
    this.mediaRecorder = new MediaRecorder(recordStream, {
      mimeType: supportedMimeType,
      videoBitsPerSecond: 2500000 * this.config.quality,
      audioBitsPerSecond: 128000
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
    this.lastFrameTime = this.startTime

    // 开始渲染循环
    this.startRenderLoop()

    // 显示预览
    if (this.config.showPreview) {
      this.showPreview()
    }

    // 自动停止（如果设置了最大时长）
    if (this.config.maxDuration > 0) {
      setTimeout(() => {
        if (this.state.isRecording) {
          this.stop()
        }
      }, this.config.maxDuration)
    }

    this.emit('recordingStart', this.getState())
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
      this.emit('recordingPause', this.getState())
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
      this.pausedDuration += performance.now() - this.pauseTime
      this.emit('recordingResume', this.getState())
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
        this.state.duration = performance.now() - this.startTime - this.pausedDuration

        // 清理
        this.cleanup()

        this.emit('recordingComplete', { blob, state: this.getState() })
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
  private async initCanvas(): Promise<void> {
    // 确定画布尺寸
    let width = this.config.width
    let height = this.config.height

    if (!width || !height) {
      if (this.instance.animation) {
        width = width || this.instance.animation.animationData.w || 1920
        height = height || this.instance.animation.animationData.h || 1080
      } else if (this.instance.container) {
        const rect = this.instance.container.getBoundingClientRect()
        width = width || rect.width
        height = height || rect.height
      }
    }

    // 创建主画布
    if (this.useOffscreen && this.offscreenCanvas) {
      this.offscreenCanvas.width = width
      this.offscreenCanvas.height = height
      this.ctx = this.offscreenCanvas.getContext('2d') as any

      // 创建一个普通 canvas 用于捕获流
      this.canvas = document.createElement('canvas')
      this.canvas.width = width
      this.canvas.height = height
      this.canvas.style.display = 'none'
      document.body.appendChild(this.canvas)
    } else {
      this.canvas = document.createElement('canvas')
      this.canvas.width = width
      this.canvas.height = height
      this.ctx = this.canvas.getContext('2d', {
        alpha: true,
        desynchronized: true
      })
      this.canvas.style.display = 'none'
      document.body.appendChild(this.canvas)
    }

    // 创建临时 Lottie 实例用于 Canvas 渲染
    if (this.instance.animation && this.ctx) {
      await this.createCanvasRenderer()
    }
  }

  /**
   * 创建 Canvas 渲染器
   */
  private async createCanvasRenderer(): Promise<void> {
    if (!this.instance.animation || !this.ctx) return

    // 保存原始状态
    this.originalRenderer = this.instance.config.renderer
    this.originalContainer = this.instance.container

    // 创建 Canvas 渲染器
    this.canvasAnimation = (window as any).lottie.loadAnimation({
      container: this.canvas,
      renderer: 'canvas',
      loop: this.instance.config.loop,
      autoplay: false,
      animationData: this.instance.animation.animationData,
      rendererSettings: {
        context: this.ctx,
        clearCanvas: true,
        progressiveLoad: false,
        preserveAspectRatio: 'xMidYMid meet'
      }
    })

    // 同步动画状态
    this.canvasAnimation.goToAndStop(this.instance.animation.currentFrame, true)
  }

  /**
   * 开始渲染循环
   */
  private startRenderLoop(): void {
    const render = () => {
      if (!this.state.isRecording || !this.ctx || !this.canvas) return

      const now = performance.now()
      const deltaTime = now - this.lastFrameTime

      // 计算实时 FPS
      this.state.fps = Math.round(1000 / deltaTime)
      this.lastFrameTime = now

      // 更新当前时间
      if (!this.state.isPaused) {
        this.state.currentTime = now - this.startTime - this.pausedDuration
      }

      // 设置背景
      if (this.config.backgroundColor !== 'transparent') {
        this.ctx.fillStyle = this.config.backgroundColor
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      }

      // 渲染 Lottie 动画
      if (this.canvasAnimation && !this.state.isPaused) {
        // 同步动画进度
        if (this.instance.animation) {
          const currentFrame = this.instance.animation.currentFrame
          this.canvasAnimation.goToAndStop(currentFrame, true)
        }
      }

      // 如果使用 OffscreenCanvas，需要复制到主 canvas
      if (this.useOffscreen && this.offscreenCanvas && this.canvas) {
        const mainCtx = this.canvas.getContext('2d')
        if (mainCtx) {
          mainCtx.drawImage(this.offscreenCanvas as any, 0, 0)
        }
      }

      this.state.frameCount++
      this.state.estimatedSize = this.state.size + (this.state.frameCount * 50000) // 估算大小

      // 触发进度事件
      this.emit('recordingProgress', this.getState())

      if (this.state.isRecording) {
        this.animationFrameId = requestAnimationFrame(render)
      }
    }

    render()
  }

  /**
   * 设置音频
   */
  private async setupAudio(): Promise<void> {
    if (this.config.audioSource instanceof MediaStream) {
      this.audioStream = this.config.audioSource
    } else if (this.config.audioSource instanceof HTMLAudioElement) {
      // 从音频元素创建流
      const audioContext = new AudioContext()
      const source = audioContext.createMediaElementSource(this.config.audioSource)
      const destination = audioContext.createMediaStreamDestination()
      source.connect(destination)
      source.connect(audioContext.destination) // 保持音频播放
      this.audioStream = destination.stream
    } else {
      // 尝试获取系统音频
      try {
        this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      } catch (error) {
        console.warn('Failed to get audio stream:', error)
      }
    }
  }

  /**
   * 合并音视频流
   */
  private combineStreams(videoStream: MediaStream, audioStream: MediaStream): MediaStream {
    const combined = new MediaStream()

    // 添加视频轨道
    videoStream.getVideoTracks().forEach(track => combined.addTrack(track))

    // 添加音频轨道
    audioStream.getAudioTracks().forEach(track => combined.addTrack(track))

    return combined
  }

  /**
   * 显示预览
   */
  private showPreview(): void {
    if (!this.canvas) return

    this.previewCanvas = document.createElement('canvas')
    this.previewCanvas.width = this.canvas.width / 4 // 缩小预览
    this.previewCanvas.height = this.canvas.height / 4

    // 设置预览样式
    Object.assign(this.previewCanvas.style, {
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      border: '2px solid red',
      borderRadius: '8px',
      zIndex: '9999',
      boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
    })

    document.body.appendChild(this.previewCanvas)

    // 更新预览
    const updatePreview = () => {
      if (!this.state.isRecording || !this.previewCanvas || !this.canvas) return

      const ctx = this.previewCanvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(
          this.canvas,
          0, 0, this.canvas.width, this.canvas.height,
          0, 0, this.previewCanvas.width, this.previewCanvas.height
        )
      }

      if (this.state.isRecording) {
        requestAnimationFrame(updatePreview)
      }
    }

    updatePreview()
  }

  /**
   * 清理资源
   */
  private cleanup(): void {
    // 停止动画帧
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    // 清理流
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop())
      this.stream = null
    }

    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop())
      this.audioStream = null
    }

    // 清理画布
    if (this.canvas) {
      this.canvas.remove()
      this.canvas = null
      this.ctx = null
    }

    if (this.previewCanvas) {
      this.previewCanvas.remove()
      this.previewCanvas = null
    }

    // 清理 Canvas 动画
    if (this.canvasAnimation) {
      this.canvasAnimation.destroy()
      this.canvasAnimation = null
    }

    this.mediaRecorder = null
    this.recordedChunks = []
    this.pausedDuration = 0
  }

  /**
   * 获取状态
   */
  getState(): RecordingState {
    return { ...this.state }
  }

  /**
   * 获取支持的格式
   */
  static getSupportedFormats(): string[] {
    if (typeof MediaRecorder === 'undefined') {
      return []
    }

    const formats = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4;codecs=h264,aac',
      'video/mp4'
    ]

    return formats.filter(format => MediaRecorder.isTypeSupported(format))
  }

  /**
   * 截图
   */
  async takeScreenshot(format: 'png' | 'jpeg' = 'png', quality: number = 0.9): Promise<Blob> {
    if (!this.canvas) {
      throw new Error('Canvas not initialized')
    }

    return new Promise((resolve, reject) => {
      this.canvas!.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create screenshot'))
          }
        },
        `image/${format}`,
        quality
      )
    })
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
    let blob: Blob

    if (this.state.isRecording) {
      blob = await this.stop()
    } else if (this.recordedChunks.length > 0) {
      blob = this.getRecordedData()!
    } else {
      throw new Error('No recording data available')
    }

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
   * 转换为其他格式（需要额外库支持）
   */
  async convertTo(format: 'mp4' | 'gif', options?: any): Promise<Blob> {
    if (!this.recordedChunks.length) {
      throw new Error('No recording data available')
    }

    const blob = this.getRecordedData()!

    // 这里需要集成 FFmpeg.js 或其他转换库
    // 简化实现：直接返回原始数据
    console.warn(`Format conversion to ${format} requires additional libraries`)
    return blob
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