/**
 * 导出管理器
 * 将 Lottie 动画导出为视频、GIF、序列帧等格式
 */

import type { ILottieInstance } from '../types'

export type ExportFormat = 'webm' | 'mp4' | 'gif' | 'png-sequence' | 'json'

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
}

/**
 * 导出管理器类
 */
export class ExportManager {
  private instance: ILottieInstance
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []

  constructor(instance: ILottieInstance) {
    this.instance = instance
  }

  /**
   * 导出动画
   */
  async export(options: ExportOptions): Promise<ExportResult> {
    const startTime = performance.now()

    switch (options.format) {
      case 'webm':
      case 'mp4':
        return await this.exportVideo(options)

      case 'gif':
        return await this.exportGIF(options)

      case 'png-sequence':
        return await this.exportPNGSequence(options)

      case 'json':
        return this.exportJSON(options)

      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  /**
   * 导出视频
   */
  private async exportVideo(options: ExportOptions): Promise<ExportResult> {
    if (!this.instance.container) {
      throw new Error('Container is required for video export')
    }

    const startTime = performance.now()
    const fps = options.fps || 30
    const quality = options.quality || 0.9

    // 创建临时 canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const rect = this.instance.container.getBoundingClientRect()
    canvas.width = options.width || rect.width
    canvas.height = options.height || rect.height

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

      // 将动画容器内容绘制到 canvas
      // 注意：这里需要使用 html2canvas 或类似库
      // 简化实现，实际需要更复杂的逻辑

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
  private async exportGIF(options: ExportOptions): Promise<ExportResult> {
    // GIF 导出需要额外的库支持，如 gif.js
    // 这里提供基础框架

    throw new Error('GIF export requires additional library. Please use gif.js or similar.')
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
   * 捕获当前帧
   */
  private async captureFrame(options: ExportOptions): Promise<Blob> {
    if (!this.instance.container) {
      throw new Error('Container not found')
    }

    // 创建临时 canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!

    const rect = this.instance.container.getBoundingClientRect()
    canvas.width = options.width || rect.width
    canvas.height = options.height || rect.height

    // 设置背景
    if (options.backgroundColor && !options.transparent) {
      ctx.fillStyle = options.backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 这里需要将 DOM 内容绘制到 canvas
    // 实际实现需要使用 html2canvas 或类似库

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        'image/png',
        options.quality || 1
      )
    })
  }

  /**
   * 导出 JSON
   */
  private exportJSON(options: ExportOptions): ExportResult {
    if (!this.instance.animation) {
      throw new Error('Animation not loaded')
    }

    const data = (this.instance.animation as any).animationData
    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })

    return {
      data: blob,
      size: blob.size,
      duration: 0,
      frameCount: 0
    }
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
  }
}

