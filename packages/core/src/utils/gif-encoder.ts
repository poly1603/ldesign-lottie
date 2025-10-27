/**
 * 简化的 GIF 编码器
 * 生产环境建议使用 gif.js 或其他成熟的 GIF 编码库
 */

export interface GIFEncoderOptions {
  width: number
  height: number
  quality?: number // 1-10
  repeat?: number // 0 = 永久循环, -1 = 不循环
  transparent?: number | null
  delay?: number // 默认延迟时间（毫秒）
  colors?: number // 颜色数量（2-256）
  dither?: boolean // 是否抖动
}

export interface GIFFrame {
  data: ImageData | HTMLCanvasElement
  delay?: number // 此帧的延迟时间（毫秒）
  transparent?: boolean
}

/**
 * GIF 编码器类
 */
export class GIFEncoder {
  private options: Required<GIFEncoderOptions>
  private frames: GIFFrame[] = []
  private onProgressCallbacks: ((progress: number) => void)[] = []
  private onFinishedCallbacks: ((blob: Blob) => void)[] = []
  private onErrorCallbacks: ((error: Error) => void)[] = []

  constructor(options: GIFEncoderOptions) {
    this.options = {
      width: options.width,
      height: options.height,
      quality: options.quality ?? 10,
      repeat: options.repeat ?? 0,
      transparent: options.transparent ?? null,
      delay: options.delay ?? 100,
      colors: Math.min(256, Math.max(2, options.colors ?? 256)),
      dither: options.dither ?? true
    }
  }

  /**
   * 添加帧
   */
  addFrame(data: HTMLCanvasElement | ImageData, options?: { delay?: number; transparent?: boolean }): void {
    this.frames.push({
      data,
      delay: options?.delay ?? this.options.delay,
      transparent: options?.transparent ?? false
    })
  }

  /**
   * 事件监听
   */
  on(event: 'progress', callback: (progress: number) => void): void
  on(event: 'finished', callback: (blob: Blob) => void): void
  on(event: 'error', callback: (error: Error) => void): void
  on(event: string, callback: Function): void {
    switch (event) {
      case 'progress':
        this.onProgressCallbacks.push(callback as (progress: number) => void)
        break
      case 'finished':
        this.onFinishedCallbacks.push(callback as (blob: Blob) => void)
        break
      case 'error':
        this.onErrorCallbacks.push(callback as (error: Error) => void)
        break
    }
  }

  /**
   * 开始渲染
   */
  async render(): Promise<void> {
    try {
      // 模拟渲染过程
      const totalFrames = this.frames.length
      const chunks: Uint8Array[] = []

      // GIF 文件头
      chunks.push(this.createHeader())

      // 逻辑屏幕描述符
      chunks.push(this.createLogicalScreenDescriptor())

      // 全局颜色表
      chunks.push(this.createGlobalColorTable())

      // 应用程序扩展（循环控制）
      if (this.options.repeat >= 0) {
        chunks.push(this.createApplicationExtension())
      }

      // 处理每一帧
      for (let i = 0; i < totalFrames; i++) {
        const frame = this.frames[i]

        // 图形控制扩展
        chunks.push(this.createGraphicsControlExtension(frame))

        // 图像描述符和数据
        const imageData = await this.getImageData(frame.data)
        chunks.push(await this.createImageDescriptor(imageData))

        // 进度更新
        const progress = (i + 1) / totalFrames
        this.emitProgress(progress)
      }

      // 文件结束标志
      chunks.push(new Uint8Array([0x3B])) // ';'

      // 合并所有数据
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const gifData = new Uint8Array(totalLength)
      let offset = 0

      for (const chunk of chunks) {
        gifData.set(chunk, offset)
        offset += chunk.length
      }

      // 创建 Blob
      const blob = new Blob([gifData], { type: 'image/gif' })
      this.emitFinished(blob)

    } catch (error) {
      this.emitError(error as Error)
    }
  }

  /**
   * 创建 GIF 文件头
   */
  private createHeader(): Uint8Array {
    // GIF89a
    return new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  }

  /**
   * 创建逻辑屏幕描述符
   */
  private createLogicalScreenDescriptor(): Uint8Array {
    const { width, height, colors } = this.options

    // 计算颜色位深度
    let colorBits = 1
    let tempColors = 2
    while (tempColors < colors && colorBits < 8) {
      colorBits++
      tempColors *= 2
    }

    const packed = 0x80 | // 全局颜色表标志
      ((colorBits - 1) << 4) | // 颜色分辨率
      (colorBits - 1) // 全局颜色表大小

    const descriptor = new Uint8Array(7)
    // 宽度（小端序）
    descriptor[0] = width & 0xFF
    descriptor[1] = (width >> 8) & 0xFF
    // 高度（小端序）
    descriptor[2] = height & 0xFF
    descriptor[3] = (height >> 8) & 0xFF
    // 打包字段
    descriptor[4] = packed
    // 背景颜色索引
    descriptor[5] = 0
    // 像素宽高比
    descriptor[6] = 0

    return descriptor
  }

  /**
   * 创建全局颜色表（简化版）
   */
  private createGlobalColorTable(): Uint8Array {
    const colorCount = Math.pow(2, Math.ceil(Math.log2(this.options.colors)))
    const table = new Uint8Array(colorCount * 3)

    // 创建基本调色板
    for (let i = 0; i < colorCount; i++) {
      const value = (i * 255) / (colorCount - 1)
      table[i * 3] = value     // R
      table[i * 3 + 1] = value // G
      table[i * 3 + 2] = value // B
    }

    return table
  }

  /**
   * 创建应用程序扩展（用于循环）
   */
  private createApplicationExtension(): Uint8Array {
    const ext = new Uint8Array(19)
    let i = 0

    ext[i++] = 0x21 // 扩展标识
    ext[i++] = 0xFF // 应用程序扩展标签
    ext[i++] = 0x0B // 块大小

    // NETSCAPE2.0
    const netscape = 'NETSCAPE2.0'
    for (let j = 0; j < netscape.length; j++) {
      ext[i++] = netscape.charCodeAt(j)
    }

    ext[i++] = 0x03 // 子块大小
    ext[i++] = 0x01 // 循环标识

    // 循环次数（小端序）
    ext[i++] = this.options.repeat & 0xFF
    ext[i++] = (this.options.repeat >> 8) & 0xFF

    ext[i++] = 0x00 // 块终止

    return ext
  }

  /**
   * 创建图形控制扩展
   */
  private createGraphicsControlExtension(frame: GIFFrame): Uint8Array {
    const ext = new Uint8Array(8)

    ext[0] = 0x21 // 扩展标识
    ext[1] = 0xF9 // 图形控制标签
    ext[2] = 0x04 // 块大小

    // 打包字段
    let packed = 0
    if (frame.transparent) {
      packed |= 0x01 // 透明颜色标志
    }
    packed |= 0x08 // 处置方法（恢复到背景）

    ext[3] = packed

    // 延迟时间（1/100 秒为单位）
    const delay = Math.round(frame.delay / 10)
    ext[4] = delay & 0xFF
    ext[5] = (delay >> 8) & 0xFF

    // 透明颜色索引
    ext[6] = 0

    // 块终止
    ext[7] = 0x00

    return ext
  }

  /**
   * 创建图像描述符（简化版）
   */
  private async createImageDescriptor(imageData: ImageData): Promise<Uint8Array> {
    const { width, height } = this.options

    // 这里应该实现 LZW 压缩
    // 简化实现：只返回占位数据
    const descriptor = new Uint8Array(10)

    descriptor[0] = 0x2C // 图像分隔符

    // 图像位置（都是0）
    descriptor[1] = 0
    descriptor[2] = 0
    descriptor[3] = 0
    descriptor[4] = 0

    // 图像大小
    descriptor[5] = width & 0xFF
    descriptor[6] = (width >> 8) & 0xFF
    descriptor[7] = height & 0xFF
    descriptor[8] = (height >> 8) & 0xFF

    // 打包字段（无局部颜色表）
    descriptor[9] = 0x00

    // 实际实现需要添加压缩的图像数据
    // 这里返回简化的占位数据
    const imageDataPlaceholder = new Uint8Array([
      0x08, // LZW 最小编码大小
      0x01, // 块大小
      0x00, // 数据
      0x00  // 块终止
    ])

    // 合并描述符和图像数据
    const result = new Uint8Array(descriptor.length + imageDataPlaceholder.length)
    result.set(descriptor, 0)
    result.set(imageDataPlaceholder, descriptor.length)

    return result
  }

  /**
   * 获取 ImageData
   */
  private async getImageData(data: HTMLCanvasElement | ImageData): Promise<ImageData> {
    if (data instanceof ImageData) {
      return data
    }

    const ctx = data.getContext('2d')
    if (!ctx) {
      throw new Error('Cannot get 2d context from canvas')
    }

    return ctx.getImageData(0, 0, data.width, data.height)
  }

  /**
   * 触发进度事件
   */
  private emitProgress(progress: number): void {
    this.onProgressCallbacks.forEach(callback => callback(progress))
  }

  /**
   * 触发完成事件
   */
  private emitFinished(blob: Blob): void {
    this.onFinishedCallbacks.forEach(callback => callback(blob))
  }

  /**
   * 触发错误事件
   */
  private emitError(error: Error): void {
    this.onErrorCallbacks.forEach(callback => callback(error))
  }
}

/**
 * 创建 GIF 编码器的工厂函数
 */
export function createGIFEncoder(options: GIFEncoderOptions): GIFEncoder {
  return new GIFEncoder(options)
}





