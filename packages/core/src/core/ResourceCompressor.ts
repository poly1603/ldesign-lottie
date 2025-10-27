/**
 * 资源压缩器
 * 优化 Lottie 动画数据，减少文件大小和内存占用
 */

export interface CompressionOptions {
  /** 是否压缩路径数据 */
  compressPaths?: boolean
  /** 是否移除冗余数据 */
  removeRedundant?: boolean
  /** 是否优化图片资源 */
  optimizeImages?: boolean
  /** 精度（小数点位数） */
  precision?: number
  /** 是否压缩颜色 */
  compressColors?: boolean
  /** 是否移除隐藏图层 */
  removeHiddenLayers?: boolean
}

export interface CompressionResult {
  data: any
  originalSize: number
  compressedSize: number
  compressionRatio: number
  optimizations: string[]
}

/**
 * 资源压缩器类
 */
export class ResourceCompressor {
  private static instance: ResourceCompressor | null = null

  private constructor() { }

  /**
   * 获取单例实例
   */
  static getInstance(): ResourceCompressor {
    if (!ResourceCompressor.instance) {
      ResourceCompressor.instance = new ResourceCompressor()
    }
    return ResourceCompressor.instance
  }

  /**
   * 压缩动画数据
   */
  async compress(animationData: any, options?: CompressionOptions): Promise<CompressionResult> {
    const opts: Required<CompressionOptions> = {
      compressPaths: options?.compressPaths ?? true,
      removeRedundant: options?.removeRedundant ?? true,
      optimizeImages: options?.optimizeImages ?? true,
      precision: options?.precision ?? 2,
      compressColors: options?.compressColors ?? true,
      removeHiddenLayers: options?.removeHiddenLayers ?? true
    }

    const optimizations: string[] = []
    const originalSize = this.calculateSize(animationData)
    let data = JSON.parse(JSON.stringify(animationData)) // 深拷贝

    // 移除冗余数据
    if (opts.removeRedundant) {
      data = this.removeRedundantData(data)
      optimizations.push('removeRedundant')
    }

    // 压缩路径数据
    if (opts.compressPaths) {
      data = this.compressPaths(data, opts.precision)
      optimizations.push('compressPaths')
    }

    // 压缩颜色
    if (opts.compressColors) {
      data = this.compressColors(data, opts.precision)
      optimizations.push('compressColors')
    }

    // 移除隐藏图层
    if (opts.removeHiddenLayers) {
      data = this.removeHiddenLayers(data)
      optimizations.push('removeHiddenLayers')
    }

    // 优化图片资源
    if (opts.optimizeImages) {
      data = await this.optimizeImages(data)
      optimizations.push('optimizeImages')
    }

    const compressedSize = this.calculateSize(data)
    const compressionRatio = originalSize > 0 ? (1 - compressedSize / originalSize) : 0

    return {
      data,
      originalSize,
      compressedSize,
      compressionRatio,
      optimizations
    }
  }

  /**
   * 移除冗余数据
   */
  private removeRedundantData(data: any): any {
    // 移除默认值
    const cleanObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(cleanObject)
      }

      if (obj && typeof obj === 'object') {
        const cleaned: any = {}

        for (const [key, value] of Object.entries(obj)) {
          // 跳过空值和默认值
          if (value === null || value === undefined) continue
          if (value === '' || value === 0) continue
          if (Array.isArray(value) && value.length === 0) continue
          if (typeof value === 'object' && Object.keys(value).length === 0) continue

          cleaned[key] = cleanObject(value)
        }

        return cleaned
      }

      return obj
    }

    return cleanObject(data)
  }

  /**
   * 压缩路径数据
   */
  private compressPaths(data: any, precision: number): any {
    const roundNumber = (num: number): number => {
      return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision)
    }

    const compressValue = (value: any): any => {
      if (typeof value === 'number') {
        return roundNumber(value)
      }

      if (Array.isArray(value)) {
        return value.map(compressValue)
      }

      if (value && typeof value === 'object') {
        const compressed: any = {}
        for (const [key, val] of Object.entries(value)) {
          compressed[key] = compressValue(val)
        }
        return compressed
      }

      return value
    }

    return compressValue(data)
  }

  /**
   * 压缩颜色数据
   */
  private compressColors(data: any, precision: number): any {
    const compressColor = (value: any): any => {
      if (Array.isArray(value)) {
        // 检查是否是颜色数组 [r, g, b] 或 [r, g, b, a]
        if (value.length === 3 || value.length === 4) {
          const isColor = value.every((v: any) => typeof v === 'number' && v >= 0 && v <= 1)
          if (isColor) {
            return value.map((v: number) =>
              Math.round(v * Math.pow(10, precision)) / Math.pow(10, precision)
            )
          }
        }

        return value.map(compressColor)
      }

      if (value && typeof value === 'object') {
        const compressed: any = {}
        for (const [key, val] of Object.entries(value)) {
          compressed[key] = compressColor(val)
        }
        return compressed
      }

      return value
    }

    return compressColor(data)
  }

  /**
   * 移除隐藏图层
   */
  private removeHiddenLayers(data: any): any {
    if (!data.layers) return data

    const filterLayers = (layers: any[]): any[] => {
      return layers
        .filter((layer: any) => {
          // 保留可见图层
          if (layer.hd === true) return false // hd = hidden
          if (layer.op !== undefined && layer.ip !== undefined) {
            // 检查是否有有效的时间范围
            if (layer.op <= layer.ip) return false
          }
          return true
        })
        .map((layer: any) => {
          // 递归处理子图层
          if (layer.layers) {
            layer.layers = filterLayers(layer.layers)
          }
          return layer
        })
    }

    return {
      ...data,
      layers: filterLayers(data.layers)
    }
  }

  /**
   * 优化图片资源
   */
  private async optimizeImages(data: any): Promise<any> {
    if (!data.assets) return data

    const optimizeAsset = async (asset: any): Promise<any> => {
      // 如果是图片资源
      if (asset.p && asset.u && asset.e === 0) {
        // 这里可以添加实际的图片优化逻辑
        // 例如：转换为 WebP、调整质量等
        // 目前只是占位符
        return asset
      }

      // 如果是 base64 图片
      if (asset.p && asset.p.startsWith('data:image')) {
        try {
          // 可以在这里添加 base64 图片压缩
          return asset
        } catch (error) {
          console.warn('[ResourceCompressor] Failed to optimize image:', error)
          return asset
        }
      }

      return asset
    }

    const optimizedAssets = await Promise.all(
      data.assets.map(optimizeAsset)
    )

    return {
      ...data,
      assets: optimizedAssets
    }
  }

  /**
   * 简化路径数据
   */
  simplifyPath(path: number[][], tolerance: number = 0.5): number[][] {
    if (path.length <= 2) return path

    // Douglas-Peucker 算法简化路径
    const getDistance = (point: number[], lineStart: number[], lineEnd: number[]): number => {
      const [x, y] = point
      const [x1, y1] = lineStart
      const [x2, y2] = lineEnd

      const A = x - x1
      const B = y - y1
      const C = x2 - x1
      const D = y2 - y1

      const dot = A * C + B * D
      const lenSq = C * C + D * D
      let param = -1

      if (lenSq !== 0) {
        param = dot / lenSq
      }

      let xx, yy

      if (param < 0) {
        xx = x1
        yy = y1
      } else if (param > 1) {
        xx = x2
        yy = y2
      } else {
        xx = x1 + param * C
        yy = y1 + param * D
      }

      const dx = x - xx
      const dy = y - yy

      return Math.sqrt(dx * dx + dy * dy)
    }

    const simplify = (points: number[][], start: number, end: number): number[][] => {
      if (end <= start + 1) {
        return [points[start], points[end]]
      }

      let maxDist = 0
      let maxIndex = start

      for (let i = start + 1; i < end; i++) {
        const dist = getDistance(points[i], points[start], points[end])
        if (dist > maxDist) {
          maxDist = dist
          maxIndex = i
        }
      }

      if (maxDist > tolerance) {
        const left = simplify(points, start, maxIndex)
        const right = simplify(points, maxIndex, end)
        return [...left.slice(0, -1), ...right]
      } else {
        return [points[start], points[end]]
      }
    }

    return simplify(path, 0, path.length - 1)
  }

  /**
   * 计算数据大小（bytes）
   */
  private calculateSize(data: any): number {
    const str = JSON.stringify(data)
    return new Blob([str]).size
  }

  /**
   * 分析动画数据
   */
  analyze(data: any): {
    totalSize: number
    layerCount: number
    assetCount: number
    frameCount: number
    duration: number
    hasImages: boolean
    hasShapes: boolean
    complexity: 'low' | 'medium' | 'high'
  } {
    const totalSize = this.calculateSize(data)
    const layerCount = this.countLayers(data.layers || [])
    const assetCount = data.assets?.length || 0
    const frameCount = (data.op || 0) - (data.ip || 0)
    const duration = frameCount / (data.fr || 30)

    const hasImages = data.assets?.some((asset: any) =>
      asset.p || (asset.layers && asset.layers.some((l: any) => l.ty === 2))
    ) || false

    const hasShapes = data.layers?.some((layer: any) => layer.ty === 4) || false

    // 根据图层数量和资源数量判断复杂度
    let complexity: 'low' | 'medium' | 'high' = 'low'
    if (layerCount > 50 || assetCount > 20) {
      complexity = 'high'
    } else if (layerCount > 20 || assetCount > 10) {
      complexity = 'medium'
    }

    return {
      totalSize,
      layerCount,
      assetCount,
      frameCount,
      duration,
      hasImages,
      hasShapes,
      complexity
    }
  }

  /**
   * 递归计算图层数量
   */
  private countLayers(layers: any[]): number {
    let count = layers.length

    for (const layer of layers) {
      if (layer.layers) {
        count += this.countLayers(layer.layers)
      }
    }

    return count
  }

  /**
   * 获取压缩建议
   */
  getCompressionSuggestions(data: any): string[] {
    const analysis = this.analyze(data)
    const suggestions: string[] = []

    if (analysis.layerCount > 30) {
      suggestions.push('考虑移除不必要的图层以减少复杂度')
    }

    if (analysis.hasImages) {
      suggestions.push('优化图片资源可以显著减少文件大小')
    }

    if (analysis.assetCount > 15) {
      suggestions.push('合并或移除重复的资源')
    }

    if (analysis.complexity === 'high') {
      suggestions.push('动画复杂度较高，建议简化路径数据')
    }

    if (analysis.totalSize > 500000) { // 500KB
      suggestions.push('文件较大，建议启用所有压缩选项')
    }

    return suggestions
  }
}

// 导出单例
export const resourceCompressor = ResourceCompressor.getInstance()


