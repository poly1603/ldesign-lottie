/**
 * 导出管理器
 * 将 Lottie 动画导出为视频、GIF、序列帧等格式
 */

import type { ILottieInstance } from '../types'
import { createGIFEncoder, type GIFEncoder } from '../utils/gif-encoder'

export type ExportFormat = 'webm' | 'mp4' | 'gif' | 'png-sequence' | 'json' | 'svg-sequence'

export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat
  /** 输出质量 (0-1) */
  quality?: number
  /** 帧率 */
  fps?: number
  /** 宽度 */
  width?: number
  /** 高度 */
  height?: number
  /** 背景色 */
  backgroundColor?: string
  /** 是否透明背景 */
  transparent?: boolean
  /** 开始时间（秒） */
  startTime?: number
  /** 结束时间（秒） */
  endTime?: number
  /** 进度回调 */
  onProgress?: (progress: number) => void
  /** 导出预设 */
  preset?: ExportPreset
  /** GIF 相关选项 */
  gifOptions?: {
    /** 颜色数量 */
    colors?: number
    /** 抖动算法 */
    dither?: boolean
    /** 透明度阈值 */
    threshold?: number
  }
  /** 批量导出选项 */
  batch?: {
    /** 是否拆分成多个文件 */
    split?: boolean
    /** 每个文件的最大帧数 */
    maxFramesPerFile?: number
  }
}

export interface ExportResult {
  /** 导出的数据 */
  data: Blob | Blob[] | string
  /** 文件大小（bytes） */
  size: number
  /** 导出耗时（ms） */
  duration: number
  /** 帧数 */
  frameCount: number
  /** 导出格式 */
  format: ExportFormat
}

/** 导出预设 */
export type ExportPreset =
  | 'social-media'     // 社交媒体（1080x1080, 30fps）
  | 'web-optimized'    // Web优化（720p, 24fps）
  | 'high-quality'     // 高质量（1080p, 60fps）
  | 'low-bandwidth'    // 低带宽（480p, 15fps）
  | 'gif-optimized'    // GIF优化（480p, 15fps, 128色）

/** 导出任务 */
export interface ExportTask {
  id: string
  instance: ILottieInstance
  options: ExportOptions
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  result?: ExportResult
  error?: Error
}

/** 导出预设配置 */
const EXPORT_PRESETS: Record<ExportPreset, Partial<ExportOptions>> = {
  'social-media': {
    width: 1080,
    height: 1080,
    fps: 30,
    quality: 0.85
  },
  'web-optimized': {
    width: 1280,
    height: 720,
    fps: 24,
    quality: 0.8
  },
  'high-quality': {
    width: 1920,
    height: 1080,
    fps: 60,
    quality: 0.95
  },
  'low-bandwidth': {
    width: 854,
    height: 480,
    fps: 15,
    quality: 0.6
  },
  'gif-optimized': {
    width: 480,
    height: 480,
    fps: 15,
    gifOptions: {
      colors: 128,
      dither: true
    }
  }
}

/**
 * 导出管理器类
 */
export class ExportManager {
  private static globalInstance: ExportManager | null = null
  private instance: ILottieInstance | null
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private exportQueue: ExportTask[] = []
  private isProcessing = false
  private currentTask: ExportTask | null = null
  private gifWorker: Worker | null = null
  private canvas: HTMLCanvasElement | null = null
  private offscreenCanvas: OffscreenCanvas | null = null
  private useOffscreen = false

  constructor(instance?: ILottieInstance) {
    this.instance = instance || null
    this.initializeCanvas()
    this.checkOffscreenSupport()
  }

  /**
   * 获取全局实例（用于批量导出）
   */
  static getGlobalInstance(): ExportManager {
    if (!ExportManager.globalInstance) {
      ExportManager.globalInstance = new ExportManager()
    }
    return ExportManager.globalInstance
  }

  /**
   * 初始化画布
   */
  private initializeCanvas(): void {
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'fixed'
    this.canvas.style.left = '-9999px'
    this.canvas.style.top = '-9999px'
    document.body.appendChild(this.canvas)
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
   * 导出动画
   */
  async export(options: ExportOptions, instance?: ILottieInstance): Promise<ExportResult> {
    const targetInstance = instance || this.instance
    if (!targetInstance) {
      throw new Error('No instance provided for export')
    }

    // 应用预设
    if (options.preset) {
      options = { ...EXPORT_PRESETS[options.preset], ...options }
    }

    const startTime = performance.now()

    switch (options.format) {
      case 'webm':
      case 'mp4':
        return await this.exportVideo(options, targetInstance)

      case 'gif':
        return await this.exportGIF(options, targetInstance)

      case 'png-sequence':
        return await this.exportPNGSequence(options, targetInstance)

      case 'svg-sequence':
        return await this.exportSVGSequence(options, targetInstance)

      case 'json':
        return this.exportJSON(options, targetInstance)

      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * 批量导出
   */
  async batchExport(
    instances: ILottieInstance[],
    options: ExportOptions
  ): Promise<ExportResult[]> {
    const tasks: ExportTask[] = instances.map((instance, index) => ({
      id: `export-${Date.now()}-${index}`,
      instance,
      options,
      status: 'pending',
      progress: 0
    }))

    // 添加到队列
    this.exportQueue.push(...tasks)

    // 开始处理队列
    if (!this.isProcessing) {
      this.processQueue()
    }

    // 等待所有任务完成
    return new Promise((resolve, reject) => {
      const checkCompletion = setInterval(() => {
        const allCompleted = tasks.every(t =>
          t.status === 'completed' || t.status === 'failed'
        )

        if (allCompleted) {
          clearInterval(checkCompletion)
          const results = tasks
            .filter(t => t.status === 'completed')
            .map(t => t.result!)

          const failed = tasks.filter(t => t.status === 'failed')
          if (failed.length > 0) {
            console.warn(`${failed.length} exports failed`)
          }

          resolve(results)
        }
      }, 100)
    })
  }

  /**
   * 处理导出队列
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.exportQueue.length === 0) return

    this.isProcessing = true

    while (this.exportQueue.length > 0) {
      const task = this.exportQueue.shift()!
      this.currentTask = task

      try {
        task.status = 'processing'

        // 包装进度回调
        const originalOnProgress = task.options.onProgress
        task.options.onProgress = (progress) => {
          task.progress = progress
          originalOnProgress?.(progress)
        }

        task.result = await this.export(task.options, task.instance)
        task.status = 'completed'
      } catch (error) {
        task.status = 'failed'
        task.error = error as Error
        console.error('Export failed:', error)
      }
    }

    this.isProcessing = false
    this.currentTask = null
  }

  /**
   * 导出视频
   */
  private async exportVideo(options: ExportOptions, instance: ILottieInstance): Promise<ExportResult> {
    if (!instance.animation) {
      throw new Error('Animation not loaded')
    }

    const startTime = performance.now()
    const fps = options.fps || 30
    const quality = options.quality || 0.9

    // 确定画布尺寸
    const width = options.width || instance.animation.animationData.w || 1920
    const height = options.height || instance.animation.animationData.h || 1080

    // 使用 OffscreenCanvas 如果支持
    const canvas = this.useOffscreen && this.offscreenCanvas
      ? this.offscreenCanvas
      : this.canvas!

    canvas.width = width
    canvas.height = height

    const ctx = this.useOffscreen
      ? (canvas as OffscreenCanvas).getContext('2d')!
      : (canvas as HTMLCanvasElement).getContext('2d')!

    // 检查 MediaRecorder 支持
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder not supported in this browser')
    }

    // 获取 canvas stream
    const stream = canvas.captureStream(fps)
    const mimeType = options.format === 'mp4'
      ? 'video/mp4;codecs=h264'
      : 'video/webm;codecs=vp9'

    // 检查支持的 MIME 类型
    const supportedMimeType = MediaRecorder.isTypeSupported(mimeType)
      ? mimeType
      : 'video/webm'

    this.mediaRecorder = new MediaRecorder(stream, {
      mimeType: supportedMimeType,
      videoBitsPerSecond: 2500000 * quality
    })

    this.recordedChunks = []

    // 收集数据
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data)
      }
    }

    // 开始录制
    return new Promise((resolve, reject) => {
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.recordedChunks, { type: supportedMimeType })
        const duration = performance.now() - startTime

        resolve({
          data: blob,
          size: blob.size,
          duration,
          frameCount: Math.ceil((options.endTime || 0 - (options.startTime || 0)) * fps)
        })
      }

      this.mediaRecorder!.onerror = (error) => {
        reject(error)
      }

      this.mediaRecorder!.start()

      // 渲染动画帧到 canvas
      this.renderFramesToCanvas(canvas, ctx, options).then(() => {
        this.mediaRecorder?.stop()
      }).catch(reject)
    })
  }

  /**
   * 渲染帧到 canvas
   */
  private async renderFramesToCanvas(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    options: ExportOptions
  ): Promise<void> {
    if (!this.instance.animation) return

    const animation = this.instance.animation
    const fps = options.fps || 30
    const frameDuration = 1000 / fps

    const startFrame = options.startTime
      ? options.startTime * animation.frameRate
      : 0
    const endFrame = options.endTime
      ? options.endTime * animation.frameRate
      : animation.totalFrames

    const totalFrames = endFrame - startFrame
    let currentFrame = startFrame

    while (currentFrame < endFrame) {
      // 跳转到当前帧
      animation.goToAndStop(currentFrame, true)

      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 16))

      // 绘制到 canvas
      if (options.backgroundColor) {
        ctx.fillStyle = options.backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (!options.transparent) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }

      // 使用 Lottie 的 Canvas 渲染器直接绘制
      await this.renderLottieFrame(instance, ctx, currentFrame, options)

      // 更新进度
      const progress = (currentFrame - startFrame) / totalFrames
      options.onProgress?.(progress)

      currentFrame++
      await new Promise(resolve => setTimeout(resolve, frameDuration))
    }
  }

  /**
   * 导出 GIF
   */
  private async exportGIF(options: ExportOptions, instance: ILottieInstance): Promise<ExportResult> {
    if (!instance.animation) {
      throw new Error('Animation not loaded')
    }

    const startTime = performance.now()
    const animation = instance.animation
    const fps = options.fps || 15
    const width = options.width || animation.animationData.w || 500
    const height = options.height || animation.animationData.h || 500

    // 初始化 GIF Worker
    await this.initGIFWorker()

    // 创建 GIF 编码器
    const gif = await this.createGIFEncoder({
      width,
      height,
      quality: Math.round((options.quality || 0.8) * 10),
      workers: 2,
      workerScript: '/gif.worker.js',
      ...options.gifOptions
    })

    const startFrame = options.startTime
      ? options.startTime * animation.frameRate
      : 0
    const endFrame = options.endTime
      ? options.endTime * animation.frameRate
      : animation.totalFrames

    const totalFrames = endFrame - startFrame
    const frameDelay = 1000 / fps

    // 渲染帧
    for (let frame = startFrame; frame < endFrame; frame++) {
      // 创建帧画布
      const frameCanvas = document.createElement('canvas')
      frameCanvas.width = width
      frameCanvas.height = height
      const ctx = frameCanvas.getContext('2d')!

      // 渲染当前帧
      await this.renderLottieFrame(instance, ctx, frame, options)

      // 添加帧到 GIF
      gif.addFrame(frameCanvas, { delay: frameDelay })

      // 更新进度
      const progress = (frame - startFrame) / totalFrames
      options.onProgress?.(progress * 0.5) // 渲染占 50%
    }

    // 渲染 GIF
    return new Promise((resolve, reject) => {
      gif.on('progress', (p: number) => {
        options.onProgress?.(0.5 + p * 0.5) // 编码占 50%
      })

      gif.on('finished', (blob: Blob) => {
        const duration = performance.now() - startTime
        resolve({
          data: blob,
          size: blob.size,
          duration,
          frameCount: totalFrames,
          format: 'gif'
        })
      })

      gif.on('error', reject)
      gif.render()
    })
  }

  /**
   * 初始化 GIF Worker
   */
  private async initGIFWorker(): Promise<void> {
    if (!this.gifWorker) {
      // 创建内联 Worker 如果外部脚本不可用
      const workerScript = `
        // 简化的 GIF 编码 Worker
        self.onmessage = function(e) {
          // 处理 GIF 编码任务
          self.postMessage({ type: 'progress', data: 0.5 })
          // ...
          self.postMessage({ type: 'finished', data: new Blob() })
        }
      `
      const blob = new Blob([workerScript], { type: 'application/javascript' })
      const url = URL.createObjectURL(blob)
      this.gifWorker = new Worker(url)
    }
  }

  /**
   * 创建 GIF 编码器
   */
  private async createGIFEncoder(options: any): Promise<GIFEncoder> {
    return createGIFEncoder({
      width: options.width,
      height: options.height,
      quality: options.quality,
      colors: options.colors,
      dither: options.dither
    })
  }

  /**
   * 导出 PNG 序列帧
   */
  private async exportPNGSequence(options: ExportOptions): Promise<ExportResult> {
    if (!this.instance.animation) {
      throw new Error('Animation not loaded')
    }

    const startTime = performance.now()
    const animation = this.instance.animation
    const blobs: Blob[] = []

    const startFrame = options.startTime
      ? options.startTime * animation.frameRate
      : 0
    const endFrame = options.endTime
      ? options.endTime * animation.frameRate
      : animation.totalFrames

    const totalFrames = endFrame - startFrame

    for (let frame = startFrame; frame < endFrame; frame++) {
      animation.goToAndStop(frame, true)
      await new Promise(resolve => setTimeout(resolve, 16))

      // 捕获当前帧
      const blob = await this.captureFrame(options)
      blobs.push(blob)

      // 更新进度
      const progress = (frame - startFrame) / totalFrames
      options.onProgress?.(progress)
    }

    const totalSize = blobs.reduce((sum, blob) => sum + blob.size, 0)
    const duration = performance.now() - startTime

    return {
      data: blobs,
      size: totalSize,
      duration,
      frameCount: blobs.length
    }
  }

  /**
   * 渲染 Lottie 帧到 Canvas
   */
  private async renderLottieFrame(
    instance: ILottieInstance,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    frame: number,
    options: ExportOptions
  ): Promise<void> {
    if (!instance.animation) return

    // 设置背景
    if (options.backgroundColor && !options.transparent) {
      ctx.fillStyle = options.backgroundColor
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    } else {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    }

    // 保存当前渲染器状态
    const originalRenderer = instance.config.renderer
    const originalContainer = instance.container

    try {
      // 创建临时 Canvas 渲染器
      const tempAnimation = (window as any).lottie.loadAnimation({
        container: ctx.canvas,
        renderer: 'canvas',
        loop: false,
        autoplay: false,
        animationData: instance.animation.animationData,
        rendererSettings: {
          context: ctx,
          clearCanvas: false,
          progressiveLoad: false,
          preserveAspectRatio: 'xMidYMid meet'
        }
      })

      // 跳转到指定帧
      tempAnimation.goToAndStop(frame, true)

      // 等待渲染完成
      await new Promise(resolve => setTimeout(resolve, 16))

      // 清理临时动画
      tempAnimation.destroy()
    } catch (error) {
      console.error('Failed to render frame:', error)
      // 降级方案：尝试使用 DOM 截图
      if (originalContainer && originalRenderer !== 'canvas') {
        await this.captureDOM(instance, ctx, frame, options)
      }
    }
  }

  /**
   * 捕获 DOM 内容（降级方案）
   */
  private async captureDOM(
    instance: ILottieInstance,
    ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    frame: number,
    options: ExportOptions
  ): Promise<void> {
    if (!instance.container || !instance.animation) return

    // 跳转到指定帧
    instance.animation.goToAndStop(frame, true)
    await new Promise(resolve => setTimeout(resolve, 50))

    // 使用 SVG foreignObject 捕获 DOM
    const { width, height } = ctx.canvas
    const data = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${instance.container.innerHTML}
          </div>
        </foreignObject>
      </svg>
    `

    const img = new Image()
    img.width = width
    img.height = height

    return new Promise((resolve, reject) => {
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height)
        resolve()
      }
      img.onerror = reject
      img.src = 'data:image/svg+xml;base64,' + btoa(data)
    })
  }

  /**
   * 导出 SVG 序列
   */
  private async exportSVGSequence(options: ExportOptions, instance: ILottieInstance): Promise<ExportResult> {
    if (!instance.animation || instance.config.renderer !== 'svg') {
      throw new Error('SVG sequence export requires SVG renderer')
    }

    const startTime = performance.now()
    const animation = instance.animation
    const svgs: Blob[] = []

    const startFrame = options.startTime
      ? options.startTime * animation.frameRate
      : 0
    const endFrame = options.endTime
      ? options.endTime * animation.frameRate
      : animation.totalFrames

    const totalFrames = endFrame - startFrame

    for (let frame = startFrame; frame < endFrame; frame++) {
      animation.goToAndStop(frame, true)
      await new Promise(resolve => setTimeout(resolve, 16))

      // 获取 SVG 内容
      const svgElement = instance.container?.querySelector('svg')
      if (svgElement) {
        const svgString = new XMLSerializer().serializeToString(svgElement)
        const blob = new Blob([svgString], { type: 'image/svg+xml' })
        svgs.push(blob)
      }

      // 更新进度
      const progress = (frame - startFrame) / totalFrames
      options.onProgress?.(progress)
    }

    const totalSize = svgs.reduce((sum, blob) => sum + blob.size, 0)
    const duration = performance.now() - startTime

    return {
      data: svgs,
      size: totalSize,
      duration,
      frameCount: svgs.length,
      format: 'svg-sequence'
    }
  }

  /**
   * 导出 JSON
   */
  private exportJSON(options: ExportOptions, instance: ILottieInstance): ExportResult {
    if (!instance.animation) {
      throw new Error('Animation not loaded')
    }

    const data = (instance.animation as any).animationData

    // 可选：压缩 JSON
    const jsonString = options.quality && options.quality < 1
      ? JSON.stringify(data) // 压缩
      : JSON.stringify(data, null, 2) // 格式化

    const blob = new Blob([jsonString], { type: 'application/json' })

    return {
      data: blob,
      size: blob.size,
      duration: 0,
      frameCount: instance.animation.totalFrames,
      format: 'json'
    }
  }

  /**
   * 获取导出队列状态
   */
  getQueueStatus(): {
    total: number
    pending: number
    processing: number
    completed: number
    failed: number
    currentTask: ExportTask | null
  } {
    const status = {
      total: this.exportQueue.length,
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      currentTask: this.currentTask
    }

    this.exportQueue.forEach(task => {
      status[task.status]++
    })

    return status
  }

  /**
   * 停止录制
   */
  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
    }
  }

  /**
   * 下载导出结果
   */
  download(result: ExportResult, filename: string): void {
    if (Array.isArray(result.data)) {
      // 下载序列帧（打包成 zip 需要额外库）
      result.data.forEach((blob, index) => {
        this.downloadBlob(blob, `${filename}_${String(index).padStart(4, '0')}.png`)
      })
    } else if (result.data instanceof Blob) {
      this.downloadBlob(result.data, filename)
    } else if (typeof result.data === 'string') {
      const blob = new Blob([result.data], { type: 'application/json' })
      this.downloadBlob(blob, filename)
    }
  }

  /**
   * 下载 Blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
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
   * 销毁
   */
  destroy(): void {
    this.stopRecording()
    this.recordedChunks = []
    this.exportQueue = []
    this.isProcessing = false
    this.currentTask = null

    if (this.gifWorker) {
      this.gifWorker.terminate()
      this.gifWorker = null
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
      this.canvas = null
    }

    if (this.offscreenCanvas) {
      this.offscreenCanvas = null
    }
  }
}

