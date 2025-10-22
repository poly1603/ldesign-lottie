/**
 * 调试面板
 * 提供可视化调试界面，显示性能指标和动画信息
 */

import type { ILottieInstance, PerformanceMetrics } from '../types'
import { lottieManager } from './LottieManager'

export interface DebugPanelConfig {
  /** 面板位置 */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  /** 更新间隔（ms） */
  updateInterval?: number
  /** 是否显示性能图表 */
  showChart?: boolean
  /** 图表历史长度 */
  chartHistory?: number
  /** 自定义样式 */
  customStyles?: Partial<CSSStyleDeclaration>
}

interface LogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error'
  message: string
  data?: any
}

/**
 * 调试面板类
 */
export class DebugPanel {
  private instance: ILottieInstance | null = null
  private config: Required<Omit<DebugPanelConfig, 'customStyles'>> & { customStyles?: Partial<CSSStyleDeclaration> }
  private panel: HTMLElement | null = null
  private isVisible: boolean = false
  private updateTimer: number | null = null

  // 性能数据历史
  private fpsHistory: number[] = []
  private memoryHistory: number[] = []
  private logs: LogEntry[] = []
  private maxLogs: number = 100

  constructor(instance?: ILottieInstance, config?: DebugPanelConfig) {
    this.instance = instance || null

    this.config = {
      position: config?.position ?? 'top-right',
      updateInterval: config?.updateInterval ?? 1000,
      showChart: config?.showChart ?? true,
      chartHistory: config?.chartHistory ?? 60,
      customStyles: config?.customStyles
    }
  }

  /**
   * 显示面板
   */
  show(): void {
    if (this.isVisible) return

    this.createPanel()
    this.isVisible = true
    this.startUpdate()
  }

  /**
   * 隐藏面板
   */
  hide(): void {
    if (!this.isVisible) return

    this.stopUpdate()
    if (this.panel) {
      this.panel.remove()
      this.panel = null
    }
    this.isVisible = false
  }

  /**
   * 切换显示
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide()
    } else {
      this.show()
    }
  }

  /**
   * 创建面板
   */
  private createPanel(): void {
    if (this.panel) return

    this.panel = document.createElement('div')
    this.panel.className = 'lottie-debug-panel'
    this.applyStyles()

    // 创建内容结构
    this.panel.innerHTML = `
      <div class="debug-panel-header">
        <span class="debug-panel-title">🔍 Lottie Debug</span>
        <button class="debug-panel-close">×</button>
      </div>
      <div class="debug-panel-content">
        <div class="debug-section">
          <h3>实例信息</h3>
          <div class="debug-info" id="instance-info"></div>
        </div>
        <div class="debug-section">
          <h3>性能指标</h3>
          <div class="debug-info" id="performance-info"></div>
          ${this.config.showChart ? '<canvas class="debug-chart" id="fps-chart" width="300" height="100"></canvas>' : ''}
        </div>
        <div class="debug-section">
          <h3>全局统计</h3>
          <div class="debug-info" id="global-stats"></div>
        </div>
        <div class="debug-section">
          <h3>事件日志</h3>
          <div class="debug-logs" id="debug-logs"></div>
          <button class="debug-btn" id="clear-logs">清空日志</button>
        </div>
      </div>
    `

    // 添加事件监听
    const closeBtn = this.panel.querySelector('.debug-panel-close')
    closeBtn?.addEventListener('click', () => this.hide())

    const clearLogsBtn = this.panel.querySelector('#clear-logs')
    clearLogsBtn?.addEventListener('click', () => this.clearLogs())

    // 添加到 DOM
    document.body.appendChild(this.panel)
  }

  /**
   * 应用样式
   */
  private applyStyles(): void {
    if (!this.panel) return

    const positions = {
      'top-left': { top: '10px', left: '10px' },
      'top-right': { top: '10px', right: '10px' },
      'bottom-left': { bottom: '10px', left: '10px' },
      'bottom-right': { bottom: '10px', right: '10px' }
    }

    const baseStyles: Partial<CSSStyleDeclaration> = {
      position: 'fixed',
      ...positions[this.config.position],
      width: '400px',
      maxHeight: '600px',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      color: '#fff',
      fontFamily: 'monospace',
      fontSize: '12px',
      borderRadius: '8px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
      zIndex: '999999',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    }

    Object.assign(this.panel.style, baseStyles, this.config.customStyles)

    // 添加内联样式
    this.injectStyles()
  }

  /**
   * 注入样式表
   */
  private injectStyles(): void {
    const styleId = 'lottie-debug-panel-styles'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .debug-panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background: rgba(255, 255, 255, 0.1);
        border-bottom: 1px solid rgba(255, 255, 255, 0.2);
      }
      
      .debug-panel-title {
        font-weight: bold;
        font-size: 14px;
      }
      
      .debug-panel-close {
        background: transparent;
        border: none;
        color: #fff;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
        line-height: 20px;
      }
      
      .debug-panel-close:hover {
        color: #ff4444;
      }
      
      .debug-panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 12px;
      }
      
      .debug-section {
        margin-bottom: 16px;
      }
      
      .debug-section h3 {
        margin: 0 0 8px 0;
        font-size: 13px;
        color: #4CAF50;
        border-bottom: 1px solid rgba(76, 175, 80, 0.3);
        padding-bottom: 4px;
      }
      
      .debug-info {
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        line-height: 1.6;
      }
      
      .debug-chart {
        width: 100%;
        margin-top: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
      }
      
      .debug-logs {
        max-height: 150px;
        overflow-y: auto;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        font-size: 11px;
      }
      
      .debug-log-entry {
        padding: 4px;
        margin-bottom: 4px;
        border-left: 3px solid;
      }
      
      .debug-log-entry.info {
        border-color: #2196F3;
      }
      
      .debug-log-entry.warn {
        border-color: #FF9800;
      }
      
      .debug-log-entry.error {
        border-color: #F44336;
      }
      
      .debug-btn {
        margin-top: 8px;
        padding: 6px 12px;
        background: #4CAF50;
        border: none;
        border-radius: 4px;
        color: #fff;
        cursor: pointer;
        font-size: 11px;
      }
      
      .debug-btn:hover {
        background: #45a049;
      }
      
      .debug-panel-content::-webkit-scrollbar,
      .debug-logs::-webkit-scrollbar {
        width: 6px;
      }
      
      .debug-panel-content::-webkit-scrollbar-track,
      .debug-logs::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
      }
      
      .debug-panel-content::-webkit-scrollbar-thumb,
      .debug-logs::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
      }
    `
    document.head.appendChild(style)
  }

  /**
   * 开始更新
   */
  private startUpdate(): void {
    this.updateTimer = window.setInterval(() => {
      this.update()
    }, this.config.updateInterval)

    this.update()
  }

  /**
   * 停止更新
   */
  private stopUpdate(): void {
    if (this.updateTimer !== null) {
      clearInterval(this.updateTimer)
      this.updateTimer = null
    }
  }

  /**
   * 更新面板数据
   */
  private update(): void {
    if (!this.panel) return

    this.updateInstanceInfo()
    this.updatePerformanceInfo()
    this.updateGlobalStats()
    this.updateLogs()
  }

  /**
   * 更新实例信息
   */
  private updateInstanceInfo(): void {
    const container = this.panel?.querySelector('#instance-info')
    if (!container) return

    if (!this.instance) {
      container.innerHTML = '<div>未绑定实例</div>'
      return
    }

    const animation = this.instance.animation
    const html = `
      <div>ID: ${this.instance.id}</div>
      <div>名称: ${this.instance.name}</div>
      <div>状态: ${this.instance.state}</div>
      <div>渲染器: ${this.instance.config.renderer || 'svg'}</div>
      ${animation ? `
        <div>总帧数: ${animation.totalFrames}</div>
        <div>当前帧: ${Math.round(animation.currentFrame)}</div>
        <div>帧率: ${animation.frameRate || 60} fps</div>
        <div>时长: ${(animation.getDuration(true) || 0).toFixed(2)}s</div>
      ` : '<div>动画未加载</div>'}
    `
    container.innerHTML = html
  }

  /**
   * 更新性能信息
   */
  private updatePerformanceInfo(): void {
    const container = this.panel?.querySelector('#performance-info')
    if (!container) return

    if (!this.instance) {
      container.innerHTML = '<div>无性能数据</div>'
      return
    }

    const metrics = this.instance.getMetrics()
    if (!metrics) {
      container.innerHTML = '<div>性能监控未启用</div>'
      return
    }

    // 记录历史数据
    this.fpsHistory.push(metrics.fps)
    this.memoryHistory.push(metrics.memory)

    if (this.fpsHistory.length > this.config.chartHistory) {
      this.fpsHistory.shift()
      this.memoryHistory.shift()
    }

    const html = `
      <div>FPS: ${metrics.fps} / 60</div>
      <div>内存: ${metrics.memory.toFixed(2)} MB</div>
      <div>加载时间: ${metrics.loadTime.toFixed(2)} ms</div>
      <div>时长: ${(metrics.duration / 1000).toFixed(2)}s</div>
    `
    container.innerHTML = html

    // 更新图表
    if (this.config.showChart) {
      this.updateChart()
    }
  }

  /**
   * 更新图表
   */
  private updateChart(): void {
    const canvas = this.panel?.querySelector('#fps-chart') as HTMLCanvasElement
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    // 清空画布
    ctx.clearRect(0, 0, width, height)

    // 绘制网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1

    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // 绘制 FPS 曲线
    if (this.fpsHistory.length > 1) {
      ctx.strokeStyle = '#4CAF50'
      ctx.lineWidth = 2
      ctx.beginPath()

      const stepX = width / (this.config.chartHistory - 1)
      const startIndex = Math.max(0, this.fpsHistory.length - this.config.chartHistory)

      this.fpsHistory.slice(startIndex).forEach((fps, i) => {
        const x = i * stepX
        const y = height - (fps / 60) * height

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })

      ctx.stroke()
    }

    // 绘制参考线（30fps 和 60fps）
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.setLineDash([5, 5])

    // 60fps 线
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(width, 0)
    ctx.stroke()

    // 30fps 线
    const fps30Y = height / 2
    ctx.beginPath()
    ctx.moveTo(0, fps30Y)
    ctx.lineTo(width, fps30Y)
    ctx.stroke()

    ctx.setLineDash([])
  }

  /**
   * 更新全局统计
   */
  private updateGlobalStats(): void {
    const container = this.panel?.querySelector('#global-stats')
    if (!container) return

    const stats = lottieManager.getGlobalStats()
    const html = `
      <div>总实例数: ${stats.totalInstances}</div>
      <div>活动实例: ${stats.activeInstances}</div>
      <div>平均 FPS: ${stats.averageFps}</div>
      <div>总内存: ${stats.totalMemory.toFixed(2)} MB</div>
      <div>缓存命中率: ${(stats.cacheHitRate * 100).toFixed(1)}%</div>
    `
    container.innerHTML = html
  }

  /**
   * 更新日志
   */
  private updateLogs(): void {
    const container = this.panel?.querySelector('#debug-logs')
    if (!container) return

    const html = this.logs.slice(-20).reverse().map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString()
      return `
        <div class="debug-log-entry ${log.level}">
          <span>[${time}]</span>
          <span>[${log.level.toUpperCase()}]</span>
          <span>${log.message}</span>
        </div>
      `
    }).join('')

    container.innerHTML = html || '<div style="opacity: 0.5;">暂无日志</div>'
  }

  /**
   * 添加日志
   */
  log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    this.logs.push({
      timestamp: Date.now(),
      level,
      message,
      data
    })

    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    if (this.isVisible) {
      this.updateLogs()
    }
  }

  /**
   * 清空日志
   */
  clearLogs(): void {
    this.logs = []
    this.updateLogs()
  }

  /**
   * 设置实例
   */
  setInstance(instance: ILottieInstance): void {
    this.instance = instance
    if (this.isVisible) {
      this.update()
    }
  }

  /**
   * 获取性能历史
   */
  getPerformanceHistory(): {
    fps: number[]
    memory: number[]
  } {
    return {
      fps: [...this.fpsHistory],
      memory: [...this.memoryHistory]
    }
  }

  /**
   * 导出日志
   */
  exportLogs(): LogEntry[] {
    return [...this.logs]
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.hide()
    this.logs = []
    this.fpsHistory = []
    this.memoryHistory = []

    // 移除样式
    const style = document.getElementById('lottie-debug-panel-styles')
    style?.remove()
  }
}

