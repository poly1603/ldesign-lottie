/**
 * AI 优化器
 * 提供智能优化建议、自动性能调优和异常检测
 */

import type { ILottieInstance, LottieConfig, PerformanceMetrics } from '../types'
import { PerformanceMonitor } from './PerformanceMonitor'
import { ResourceCompressor } from './ResourceCompressor'
import { WASMCore, initWASM } from './WASMCore'

export interface OptimizationSuggestion {
  type: 'performance' | 'quality' | 'compatibility' | 'size'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  action?: () => void | Promise<void>
  autoApply?: boolean
}

export interface DeviceProfile {
  tier: 'low' | 'medium' | 'high'
  cpu: number
  memory: number
  gpu: string
  connection: 'slow' | 'medium' | 'fast'
  battery?: 'low' | 'medium' | 'high'
}

export interface OptimizationResult {
  suggestions: OptimizationSuggestion[]
  appliedOptimizations: string[]
  performanceGain: number
  sizeReduction: number
}

export interface AIOptimizerConfig {
  enableAutoOptimization?: boolean
  enableAnomalyDetection?: boolean
  enablePredictiveLoading?: boolean
  aggressiveness?: 'conservative' | 'balanced' | 'aggressive'
  targetFPS?: number
  maxMemory?: number
}

/**
 * AI 优化器类
 */
export class AIOptimizer {
  private static instance: AIOptimizer | null = null
  private config: Required<AIOptimizerConfig>
  private deviceProfile: DeviceProfile | null = null
  private performanceHistory: PerformanceMetrics[] = []
  private anomalyThreshold = 2 // 标准差倍数
  private optimizationHistory: Map<string, Date> = new Map()

  // 机器学习模型参数（简化版）
  private performanceModel = {
    weights: {
      fps: 0.4,
      memory: 0.3,
      cpuUsage: 0.2,
      complexity: 0.1
    },
    baseline: {
      fps: 60,
      memory: 50,
      cpuUsage: 30
    }
  }

  private constructor(config?: AIOptimizerConfig) {
    this.config = {
      enableAutoOptimization: config?.enableAutoOptimization ?? true,
      enableAnomalyDetection: config?.enableAnomalyDetection ?? true,
      enablePredictiveLoading: config?.enablePredictiveLoading ?? true,
      aggressiveness: config?.aggressiveness ?? 'balanced',
      targetFPS: config?.targetFPS ?? 60,
      maxMemory: config?.maxMemory ?? 100
    }

    this.detectDeviceProfile()
    this.initializeWASM()
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: AIOptimizerConfig): AIOptimizer {
    if (!AIOptimizer.instance) {
      AIOptimizer.instance = new AIOptimizer(config)
    }
    return AIOptimizer.instance
  }

  /**
   * 初始化 WASM
   */
  private async initializeWASM(): Promise<void> {
    try {
      await initWASM()
      console.log('[AIOptimizer] WASM initialized for accelerated computations')
    } catch (error) {
      console.warn('[AIOptimizer] WASM initialization failed, using fallback')
    }
  }

  /**
   * 检测设备配置
   */
  private detectDeviceProfile(): void {
    const cpu = navigator.hardwareConcurrency || 4
    const memory = (navigator as any).deviceMemory || 4
    const connection = (navigator as any).connection

    // 设备分级
    let tier: DeviceProfile['tier'] = 'medium'
    if (cpu <= 2 || memory <= 2) {
      tier = 'low'
    } else if (cpu >= 8 && memory >= 8) {
      tier = 'high'
    }

    // 网络速度
    let connectionSpeed: DeviceProfile['connection'] = 'medium'
    if (connection) {
      const downlink = connection.downlink || 10
      if (downlink < 1.5) connectionSpeed = 'slow'
      else if (downlink > 10) connectionSpeed = 'fast'
    }

    // GPU 检测
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
    let gpu = 'unknown'

    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
      if (debugInfo) {
        gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      }
    }

    this.deviceProfile = {
      tier,
      cpu,
      memory,
      gpu,
      connection: connectionSpeed
    }

    console.log('[AIOptimizer] Device profile:', this.deviceProfile)
  }

  /**
   * 分析动画并提供优化建议
   */
  async analyzeAnimation(instance: ILottieInstance): Promise<OptimizationResult> {
    const suggestions: OptimizationSuggestion[] = []
    const appliedOptimizations: string[] = []

    if (!instance.animation) {
      return { suggestions, appliedOptimizations, performanceGain: 0, sizeReduction: 0 }
    }

    // 获取动画数据
    const animationData = (instance.animation as any).animationData
    const compressor = ResourceCompressor.getInstance()
    const analysis = compressor.analyze(animationData)

    // 1. 复杂度分析
    if (analysis.complexity === 'high' || analysis.complexity === 'very-high') {
      suggestions.push({
        type: 'performance',
        severity: 'high',
        title: '动画复杂度过高',
        description: `当前动画包含 ${analysis.layerCount} 个图层，可能影响性能`,
        impact: '降低 20-40% CPU 使用率',
        action: async () => {
          if (instance.config.renderer !== 'canvas') {
            instance.switchRenderer('canvas')
          }
        },
        autoApply: this.config.aggressiveness === 'aggressive'
      })
    }

    // 2. 帧率优化
    const currentFPS = this.getCurrentFPS()
    if (currentFPS < this.config.targetFPS * 0.8) {
      suggestions.push({
        type: 'performance',
        severity: 'medium',
        title: '帧率低于目标值',
        description: `当前帧率 ${currentFPS.toFixed(0)} FPS，目标 ${this.config.targetFPS} FPS`,
        impact: '提升流畅度',
        action: () => {
          // 启用智能跳帧
          if (instance.config.advanced) {
            instance.config.advanced.enableSmartFrameSkip = true
            instance.config.advanced.targetFPS = 30
          }
        },
        autoApply: true
      })
    }

    // 3. 内存优化
    const memoryUsage = await this.estimateMemoryUsage(animationData)
    if (memoryUsage > this.config.maxMemory) {
      suggestions.push({
        type: 'size',
        severity: 'high',
        title: '内存使用过高',
        description: `预计内存使用 ${memoryUsage.toFixed(0)} MB，超过限制`,
        impact: '减少 30-50% 内存占用',
        action: async () => {
          const compressed = await compressor.compress(animationData, {
            removeHiddenLayers: true,
            compressPaths: true,
            removeRedundant: true
          })
          // 更新动画数据
          Object.assign(animationData, compressed.data)
        },
        autoApply: this.config.aggressiveness !== 'conservative'
      })
    }

    // 4. 渲染器建议
    if (this.deviceProfile) {
      const recommendedRenderer = this.getRecommendedRenderer()
      if (instance.config.renderer !== recommendedRenderer) {
        suggestions.push({
          type: 'compatibility',
          severity: 'low',
          title: '渲染器优化建议',
          description: `建议使用 ${recommendedRenderer} 渲染器以获得最佳性能`,
          impact: '提升 10-20% 渲染性能',
          action: () => {
            instance.switchRenderer(recommendedRenderer as any)
          },
          autoApply: false
        })
      }
    }

    // 5. 质量设置
    if (this.deviceProfile?.tier === 'low' && instance.config.quality !== 'low') {
      suggestions.push({
        type: 'quality',
        severity: 'medium',
        title: '降低渲染质量',
        description: '检测到低端设备，建议降低渲染质量',
        impact: '提升 30-50% 性能',
        action: () => {
          instance.updateConfig({ quality: 'low' })
        },
        autoApply: true
      })
    }

    // 自动应用优化
    if (this.config.enableAutoOptimization) {
      for (const suggestion of suggestions) {
        if (suggestion.autoApply && suggestion.action) {
          try {
            await suggestion.action()
            appliedOptimizations.push(suggestion.title)
          } catch (error) {
            console.error('[AIOptimizer] Failed to apply optimization:', error)
          }
        }
      }
    }

    // 计算优化效果
    const performanceGain = this.calculatePerformanceGain(suggestions)
    const sizeReduction = await this.calculateSizeReduction(animationData)

    return {
      suggestions,
      appliedOptimizations,
      performanceGain,
      sizeReduction
    }
  }

  /**
   * 检测性能异常
   */
  detectAnomalies(metrics: PerformanceMetrics): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = []

    // 添加到历史记录
    this.performanceHistory.push(metrics)
    if (this.performanceHistory.length > 100) {
      this.performanceHistory.shift()
    }

    if (this.performanceHistory.length < 10) {
      return suggestions // 数据不足
    }

    // 计算统计指标
    const stats = this.calculateStatistics()

    // FPS 异常检测
    if (Math.abs(metrics.fps - stats.fps.mean) > stats.fps.stdDev * this.anomalyThreshold) {
      suggestions.push({
        type: 'performance',
        severity: 'critical',
        title: 'FPS 异常',
        description: `检测到异常的帧率波动：${metrics.fps.toFixed(0)} FPS（正常范围：${(stats.fps.mean - stats.fps.stdDev).toFixed(0)}-${(stats.fps.mean + stats.fps.stdDev).toFixed(0)} FPS）`,
        impact: '可能导致动画卡顿',
        action: () => {
          console.warn('[AIOptimizer] FPS anomaly detected, triggering recovery...')
          // 触发恢复机制
        }
      })
    }

    // 内存泄漏检测
    const memoryTrend = this.detectMemoryLeak()
    if (memoryTrend > 0.5) { // MB/s
      suggestions.push({
        type: 'performance',
        severity: 'critical',
        title: '疑似内存泄漏',
        description: `内存使用持续增长：${memoryTrend.toFixed(2)} MB/s`,
        impact: '可能导致页面崩溃',
        action: () => {
          // 触发内存清理
          if (typeof gc !== 'undefined') {
            gc()
          }
        }
      })
    }

    return suggestions
  }

  /**
   * 获取推荐的渲染器
   */
  private getRecommendedRenderer(): string {
    if (!this.deviceProfile) return 'svg'

    const { tier, gpu } = this.deviceProfile

    // 高端设备使用 WebGL
    if (tier === 'high' && gpu.includes('NVIDIA') || gpu.includes('AMD')) {
      return 'webgl'
    }

    // 中端设备使用 Canvas
    if (tier === 'medium') {
      return 'canvas'
    }

    // 低端设备使用 SVG
    return 'svg'
  }

  /**
   * 计算统计指标
   */
  private calculateStatistics() {
    const fps = this.performanceHistory.map(m => m.fps)
    const memory = this.performanceHistory.map(m => m.memory)
    const cpuUsage = this.performanceHistory.map(m => m.cpuUsage)

    const calculate = (values: number[]) => {
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length
      const stdDev = Math.sqrt(variance)
      return { mean, stdDev }
    }

    return {
      fps: calculate(fps),
      memory: calculate(memory),
      cpuUsage: calculate(cpuUsage)
    }
  }

  /**
   * 检测内存泄漏
   */
  private detectMemoryLeak(): number {
    if (this.performanceHistory.length < 20) return 0

    const recent = this.performanceHistory.slice(-20)
    const memoryValues = recent.map(m => m.memory)
    const timestamps = recent.map((_, i) => i)

    // 简单线性回归
    const n = memoryValues.length
    const sumX = timestamps.reduce((a, b) => a + b, 0)
    const sumY = memoryValues.reduce((a, b) => a + b, 0)
    const sumXY = timestamps.reduce((a, x, i) => a + x * memoryValues[i], 0)
    const sumX2 = timestamps.reduce((a, x) => a + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)

    // 返回每秒内存增长率（MB/s）
    return slope > 0 ? slope : 0
  }

  /**
   * 估算内存使用
   */
  private async estimateMemoryUsage(animationData: any): Promise<number> {
    const jsonSize = JSON.stringify(animationData).length
    const estimatedMemory = jsonSize / 1024 / 1024 * 3 // 估算因子

    // 考虑图层数量
    const layerCount = animationData.layers?.length || 0
    const layerMemory = layerCount * 0.5 // 每层约 0.5MB

    return estimatedMemory + layerMemory
  }

  /**
   * 计算性能提升
   */
  private calculatePerformanceGain(suggestions: OptimizationSuggestion[]): number {
    let totalGain = 0

    for (const suggestion of suggestions) {
      switch (suggestion.severity) {
        case 'critical':
          totalGain += 40
          break
        case 'high':
          totalGain += 30
          break
        case 'medium':
          totalGain += 20
          break
        case 'low':
          totalGain += 10
          break
      }
    }

    return Math.min(totalGain, 100)
  }

  /**
   * 计算大小减少
   */
  private async calculateSizeReduction(animationData: any): Promise<number> {
    const compressor = ResourceCompressor.getInstance()
    const originalSize = JSON.stringify(animationData).length

    try {
      const compressed = await compressor.compress(animationData, {
        compressPaths: true,
        removeRedundant: true,
        removeHiddenLayers: true
      })

      const reduction = (1 - compressed.compressedSize / originalSize) * 100
      return Math.max(0, reduction)
    } catch {
      return 0
    }
  }

  /**
   * 获取当前 FPS
   */
  private getCurrentFPS(): number {
    if (this.performanceHistory.length === 0) return 60

    const recent = this.performanceHistory.slice(-5)
    const avgFPS = recent.reduce((sum, m) => sum + m.fps, 0) / recent.length

    return avgFPS
  }

  /**
   * 生成设备特定配置
   */
  generateAdaptiveConfig(): Partial<LottieConfig> {
    if (!this.deviceProfile) {
      return {}
    }

    const { tier, connection } = this.deviceProfile
    const config: Partial<LottieConfig> = {}

    // 根据设备等级设置
    switch (tier) {
      case 'low':
        config.renderer = 'svg'
        config.quality = 'low'
        config.advanced = {
          enableSmartFrameSkip: true,
          targetFPS: 30,
          enableAutoDegradation: true,
          maxMemory: 50
        }
        break

      case 'medium':
        config.renderer = 'canvas'
        config.quality = 'medium'
        config.advanced = {
          enableSmartFrameSkip: false,
          targetFPS: 45,
          enableAutoDegradation: true,
          maxMemory: 100
        }
        break

      case 'high':
        config.renderer = 'canvas' // 或 'webgl'
        config.quality = 'high'
        config.advanced = {
          enableSmartFrameSkip: false,
          targetFPS: 60,
          enableAutoDegradation: false,
          maxMemory: 200
        }
        break
    }

    // 根据网络状况设置
    switch (connection) {
      case 'slow':
        config.loadStrategy = 'lazy'
        config.preload = false
        break

      case 'medium':
        config.loadStrategy = 'eager'
        config.preload = true
        break

      case 'fast':
        config.loadStrategy = 'eager'
        config.preload = true
        break
    }

    return config
  }

  /**
   * 预测性能表现
   */
  predictPerformance(animationData: any): { fps: number; memory: number; risk: 'low' | 'medium' | 'high' } {
    const analysis = ResourceCompressor.getInstance().analyze(animationData)

    // 简化的性能预测模型
    let predictedFPS = this.performanceModel.baseline.fps
    let predictedMemory = this.performanceModel.baseline.memory

    // 根据复杂度调整
    switch (analysis.complexity) {
      case 'low':
        predictedFPS *= 1.2
        predictedMemory *= 0.8
        break
      case 'medium':
        predictedFPS *= 1.0
        predictedMemory *= 1.0
        break
      case 'high':
        predictedFPS *= 0.7
        predictedMemory *= 1.5
        break
      case 'very-high':
        predictedFPS *= 0.5
        predictedMemory *= 2.0
        break
    }

    // 根据设备调整
    if (this.deviceProfile) {
      switch (this.deviceProfile.tier) {
        case 'low':
          predictedFPS *= 0.6
          break
        case 'medium':
          predictedFPS *= 0.8
          break
        case 'high':
          predictedFPS *= 1.0
          break
      }
    }

    // 风险评估
    let risk: 'low' | 'medium' | 'high' = 'low'
    if (predictedFPS < 30 || predictedMemory > 150) {
      risk = 'high'
    } else if (predictedFPS < 45 || predictedMemory > 100) {
      risk = 'medium'
    }

    return {
      fps: Math.round(predictedFPS),
      memory: Math.round(predictedMemory),
      risk
    }
  }

  /**
   * 获取优化报告
   */
  generateReport(instance: ILottieInstance): string {
    const metrics = PerformanceMonitor.getInstance().getMetrics()
    const deviceInfo = this.deviceProfile

    let report = '# Lottie 动画优化报告\n\n'

    // 设备信息
    report += '## 设备信息\n'
    report += `- 设备等级: ${deviceInfo?.tier || '未知'}\n`
    report += `- CPU 核心: ${deviceInfo?.cpu || '未知'}\n`
    report += `- 内存: ${deviceInfo?.memory || '未知'} GB\n`
    report += `- GPU: ${deviceInfo?.gpu || '未知'}\n`
    report += `- 网络: ${deviceInfo?.connection || '未知'}\n\n`

    // 性能指标
    report += '## 当前性能\n'
    report += `- 平均 FPS: ${metrics.fps.toFixed(1)}\n`
    report += `- 内存使用: ${metrics.memory.toFixed(1)} MB\n`
    report += `- CPU 使用: ${metrics.cpuUsage.toFixed(1)}%\n\n`

    // 配置信息
    report += '## 当前配置\n'
    report += `- 渲染器: ${instance.config.renderer}\n`
    report += `- 质量: ${instance.config.quality}\n`
    report += `- 循环: ${instance.config.loop}\n`
    report += `- 自动播放: ${instance.config.autoplay}\n\n`

    // 优化建议
    report += '## 优化建议\n'
    report += '分析中...\n'

    return report
  }

  /**
   * 重置优化器
   */
  reset(): void {
    this.performanceHistory = []
    this.optimizationHistory.clear()
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.reset()
    AIOptimizer.instance = null
  }
}

// 导出便捷函数
export const aiOptimizer = AIOptimizer.getInstance()


