/**
 * 性能分析器
 * 分析 Lottie 动画性能，生成性能报告和优化建议
 */

import type { ILottieInstance } from '../types'

export interface ProfilerConfig {
  /** 采样间隔（ms） */
  sampleInterval?: number
  /** 采样持续时间（ms） */
  duration?: number
  /** 是否收集内存信息 */
  collectMemory?: boolean
  /** 是否收集渲染信息 */
  collectRendering?: boolean
}

export interface ProfileSample {
  timestamp: number
  fps: number
  memory: number
  cpu: number
  renderTime: number
}

export interface PerformanceReport {
  duration: number
  samples: number
  avgFps: number
  minFps: number
  maxFps: number
  avgMemory: number
  peakMemory: number
  avgCpu: number
  avgRenderTime: number
  bottlenecks: Bottleneck[]
  suggestions: string[]
  score: number // 0-100
}

export interface Bottleneck {
  type: 'fps' | 'memory' | 'cpu' | 'rendering'
  severity: 'low' | 'medium' | 'high'
  description: string
  timestamp: number
}

/**
 * 性能分析器类
 */
export class Profiler {
  private instance: ILottieInstance
  private config: Required<ProfilerConfig>
  private samples: ProfileSample[] = []
  private isRunning: boolean = false
  private startTime: number = 0
  private sampleTimer: number | null = null
  private performanceObserver: PerformanceObserver | null = null

  constructor(instance: ILottieInstance, config?: ProfilerConfig) {
    this.instance = instance

    this.config = {
      sampleInterval: config?.sampleInterval ?? 100,
      duration: config?.duration ?? 5000,
      collectMemory: config?.collectMemory ?? true,
      collectRendering: config?.collectRendering ?? true
    }
  }

  /**
   * 开始性能分析
   */
  async start(): Promise<PerformanceReport> {
    if (this.isRunning) {
      throw new Error('Profiler is already running')
    }

    this.isRunning = true
    this.samples = []
    this.startTime = performance.now()

    // 设置 Performance Observer
    if (this.config.collectRendering && typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              // 处理渲染指标
            }
          }
        })
        this.performanceObserver.observe({ entryTypes: ['measure', 'paint'] })
      } catch (error) {
        console.warn('[Profiler] PerformanceObserver not supported:', error)
      }
    }

    return new Promise((resolve) => {
      // 开始采样
      this.sampleTimer = window.setInterval(() => {
        this.collectSample()

        // 检查是否完成
        if (performance.now() - this.startTime >= this.config.duration) {
          this.stop()
          const report = this.generateReport()
          resolve(report)
        }
      }, this.config.sampleInterval)

      // 立即采集第一个样本
      this.collectSample()
    })
  }

  /**
   * 停止性能分析
   */
  stop(): void {
    if (!this.isRunning) return

    this.isRunning = false

    if (this.sampleTimer !== null) {
      clearInterval(this.sampleTimer)
      this.sampleTimer = null
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
      this.performanceObserver = null
    }
  }

  /**
   * 采集样本
   */
  private collectSample(): void {
    const timestamp = performance.now() - this.startTime
    const metrics = this.instance.getMetrics()

    const sample: ProfileSample = {
      timestamp,
      fps: metrics?.fps || 0,
      memory: this.config.collectMemory ? this.getMemoryUsage() : 0,
      cpu: this.getCpuUsage(),
      renderTime: this.getRenderTime()
    }

    this.samples.push(sample)
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in performance && (performance as any).memory) {
      const memoryInfo = (performance as any).memory
      return memoryInfo.usedJSHeapSize / 1024 / 1024
    }
    return 0
  }

  /**
   * 获取 CPU 使用情况（估算）
   */
  private getCpuUsage(): number {
    // 简化的 CPU 使用估算
    // 实际应用中可以使用更准确的方法
    const metrics = this.instance.getMetrics()
    if (!metrics) return 0

    // 基于 FPS 降低程度估算 CPU 使用
    const fpsRatio = metrics.fps / 60
    return Math.max(0, Math.min(100, (1 - fpsRatio) * 100))
  }

  /**
   * 获取渲染时间
   */
  private getRenderTime(): number {
    // 使用 Performance API 测量渲染时间
    const entries = performance.getEntriesByType('measure')
    const recentEntry = entries[entries.length - 1]
    return recentEntry?.duration || 0
  }

  /**
   * 生成性能报告
   */
  private generateReport(): PerformanceReport {
    if (this.samples.length === 0) {
      throw new Error('No samples collected')
    }

    // 计算统计数据
    const fpsSamples = this.samples.map(s => s.fps).filter(fps => fps > 0)
    const memorySamples = this.samples.map(s => s.memory).filter(m => m > 0)
    const cpuSamples = this.samples.map(s => s.cpu)
    const renderTimeSamples = this.samples.map(s => s.renderTime).filter(t => t > 0)

    const avgFps = this.average(fpsSamples)
    const minFps = Math.min(...fpsSamples)
    const maxFps = Math.max(...fpsSamples)
    const avgMemory = this.average(memorySamples)
    const peakMemory = Math.max(...memorySamples)
    const avgCpu = this.average(cpuSamples)
    const avgRenderTime = this.average(renderTimeSamples)

    // 检测瓶颈
    const bottlenecks = this.detectBottlenecks()

    // 生成建议
    const suggestions = this.generateSuggestions(avgFps, peakMemory, avgCpu, avgRenderTime)

    // 计算性能评分
    const score = this.calculateScore(avgFps, peakMemory, avgCpu)

    return {
      duration: performance.now() - this.startTime,
      samples: this.samples.length,
      avgFps: Math.round(avgFps * 10) / 10,
      minFps: Math.round(minFps * 10) / 10,
      maxFps: Math.round(maxFps * 10) / 10,
      avgMemory: Math.round(avgMemory * 10) / 10,
      peakMemory: Math.round(peakMemory * 10) / 10,
      avgCpu: Math.round(avgCpu * 10) / 10,
      avgRenderTime: Math.round(avgRenderTime * 100) / 100,
      bottlenecks,
      suggestions,
      score
    }
  }

  /**
   * 检测性能瓶颈
   */
  private detectBottlenecks(): Bottleneck[] {
    const bottlenecks: Bottleneck[] = []

    this.samples.forEach((sample, index) => {
      // FPS 瓶颈
      if (sample.fps < 30 && sample.fps > 0) {
        bottlenecks.push({
          type: 'fps',
          severity: sample.fps < 15 ? 'high' : sample.fps < 25 ? 'medium' : 'low',
          description: `Low FPS detected: ${sample.fps.toFixed(1)} fps`,
          timestamp: sample.timestamp
        })
      }

      // 内存瓶颈
      if (sample.memory > 100) {
        bottlenecks.push({
          type: 'memory',
          severity: sample.memory > 200 ? 'high' : sample.memory > 150 ? 'medium' : 'low',
          description: `High memory usage: ${sample.memory.toFixed(1)} MB`,
          timestamp: sample.timestamp
        })
      }

      // CPU 瓶颈
      if (sample.cpu > 70) {
        bottlenecks.push({
          type: 'cpu',
          severity: sample.cpu > 90 ? 'high' : sample.cpu > 80 ? 'medium' : 'low',
          description: `High CPU usage: ${sample.cpu.toFixed(1)}%`,
          timestamp: sample.timestamp
        })
      }

      // 渲染瓶颈
      if (sample.renderTime > 16.67) { // > 1帧时间 @ 60fps
        bottlenecks.push({
          type: 'rendering',
          severity: sample.renderTime > 33 ? 'high' : sample.renderTime > 20 ? 'medium' : 'low',
          description: `Slow rendering: ${sample.renderTime.toFixed(2)} ms`,
          timestamp: sample.timestamp
        })
      }
    })

    // 去重并按严重程度排序
    const uniqueBottlenecks = this.deduplicateBottlenecks(bottlenecks)
    return uniqueBottlenecks.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      return severityOrder[b.severity] - severityOrder[a.severity]
    })
  }

  /**
   * 去重瓶颈（合并相近时间的同类型瓶颈）
   */
  private deduplicateBottlenecks(bottlenecks: Bottleneck[]): Bottleneck[] {
    const grouped = new Map<string, Bottleneck[]>()

    bottlenecks.forEach(b => {
      const key = `${b.type}-${Math.floor(b.timestamp / 1000)}`
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(b)
    })

    return Array.from(grouped.values()).map(group => {
      // 返回最严重的
      return group.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 }
        return severityOrder[b.severity] - severityOrder[a.severity]
      })[0]
    })
  }

  /**
   * 生成优化建议
   */
  private generateSuggestions(
    avgFps: number,
    peakMemory: number,
    avgCpu: number,
    avgRenderTime: number
  ): string[] {
    const suggestions: string[] = []

    // FPS 建议
    if (avgFps < 30) {
      suggestions.push('FPS 较低，建议启用智能跳帧功能')
      suggestions.push('考虑切换到 canvas 渲染器以提升性能')
    } else if (avgFps < 50) {
      suggestions.push('FPS 可以进一步优化，尝试降低动画复杂度')
    }

    // 内存建议
    if (peakMemory > 150) {
      suggestions.push('内存占用较高，建议启用资源压缩')
      suggestions.push('考虑实现懒加载策略')
    } else if (peakMemory > 100) {
      suggestions.push('内存占用偏高，可以优化资源使用')
    }

    // CPU 建议
    if (avgCpu > 70) {
      suggestions.push('CPU 使用率高，建议启用 Web Worker')
      suggestions.push('考虑使用批量渲染优化')
    }

    // 渲染建议
    if (avgRenderTime > 16.67) {
      suggestions.push('渲染时间过长，尝试启用 OffscreenCanvas')
      suggestions.push('简化动画路径数据可以提升渲染速度')
    }

    // 通用建议
    if (suggestions.length === 0) {
      suggestions.push('性能表现良好，继续保持！')
    }

    return suggestions
  }

  /**
   * 计算性能评分
   */
  private calculateScore(avgFps: number, peakMemory: number, avgCpu: number): number {
    let score = 100

    // FPS 评分 (40分)
    if (avgFps >= 55) {
      score -= 0
    } else if (avgFps >= 45) {
      score -= 10
    } else if (avgFps >= 30) {
      score -= 20
    } else {
      score -= 40
    }

    // 内存评分 (30分)
    if (peakMemory <= 50) {
      score -= 0
    } else if (peakMemory <= 100) {
      score -= 10
    } else if (peakMemory <= 150) {
      score -= 20
    } else {
      score -= 30
    }

    // CPU 评分 (30分)
    if (avgCpu <= 30) {
      score -= 0
    } else if (avgCpu <= 50) {
      score -= 10
    } else if (avgCpu <= 70) {
      score -= 20
    } else {
      score -= 30
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * 计算平均值
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length
  }

  /**
   * 获取样本数据
   */
  getSamples(): ProfileSample[] {
    return [...this.samples]
  }

  /**
   * 导出火焰图数据
   */
  exportFlameGraph(): any {
    // 生成火焰图所需的数据结构
    const flamegraph: any = {
      name: 'root',
      value: 0,
      children: []
    }

    // 按时间分组样本
    const groups = this.groupSamplesByTime(50) // 50ms 分组

    groups.forEach((group, index) => {
      const avgFps = this.average(group.map(s => s.fps))
      const avgMemory = this.average(group.map(s => s.memory))

      flamegraph.children.push({
        name: `Frame ${index}`,
        value: group[0].renderTime || 1,
        fps: avgFps,
        memory: avgMemory
      })
    })

    return flamegraph
  }

  /**
   * 按时间分组样本
   */
  private groupSamplesByTime(interval: number): ProfileSample[][] {
    const groups: ProfileSample[][] = []
    let currentGroup: ProfileSample[] = []
    let groupStartTime = 0

    this.samples.forEach(sample => {
      if (sample.timestamp - groupStartTime >= interval) {
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [sample]
        groupStartTime = sample.timestamp
      } else {
        currentGroup.push(sample)
      }
    })

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.stop()
    this.samples = []
  }
}

