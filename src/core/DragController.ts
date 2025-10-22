/**
 * 拖拽控制器
 * 为 Lottie 动画添加拖拽交互功能
 */

import type { ILottieInstance } from '../types'

export interface DragConfig {
  /** 拖拽轴向 */
  axis?: 'x' | 'y' | 'both'
  /** 边界约束 */
  bounds?: {
    left?: number
    right?: number
    top?: number
    bottom?: number
  }
  /** 吸附网格大小 */
  grid?: number
  /** 是否启用惯性 */
  inertia?: boolean
  /** 惯性摩擦系数 */
  friction?: number
  /** 拖拽时的动画控制 */
  animateOnDrag?: boolean
  /** 拖拽映射到动画进度 */
  mapToProgress?: boolean
}

export interface DragEvent {
  x: number
  y: number
  deltaX: number
  deltaY: number
  progress?: number
}

/**
 * 拖拽控制器类
 */
export class DragController {
  private instance: ILottieInstance
  private config: Required<DragConfig>
  private container: HTMLElement | null = null

  // 拖拽状态
  private isDragging: boolean = false
  private startX: number = 0
  private startY: number = 0
  private currentX: number = 0
  private currentY: number = 0
  private lastX: number = 0
  private lastY: number = 0

  // 惯性相关
  private velocityX: number = 0
  private velocityY: number = 0
  private inertiaAnimationId: number | null = null

  // 路径记录
  private path: Array<{ x: number; y: number; time: number }> = []
  private maxPathLength: number = 50

  // 事件回调
  private callbacks = new Map<string, Set<Function>>()

  // 绑定的事件处理器
  private boundHandlers = {
    pointerDown: this.handlePointerDown.bind(this),
    pointerMove: this.handlePointerMove.bind(this),
    pointerUp: this.handlePointerUp.bind(this),
    pointerCancel: this.handlePointerCancel.bind(this)
  }

  constructor(instance: ILottieInstance, config?: DragConfig) {
    this.instance = instance
    this.container = instance.container

    this.config = {
      axis: config?.axis ?? 'both',
      bounds: config?.bounds ?? {},
      grid: config?.grid ?? 0,
      inertia: config?.inertia ?? false,
      friction: config?.friction ?? 0.95,
      animateOnDrag: config?.animateOnDrag ?? false,
      mapToProgress: config?.mapToProgress ?? false
    }

    this.init()
  }

  /**
   * 初始化
   */
  private init(): void {
    if (!this.container) {
      console.warn('[DragController] No container found')
      return
    }

    // 添加事件监听
    this.container.addEventListener('pointerdown', this.boundHandlers.pointerDown)

    // 设置样式
    this.container.style.touchAction = 'none'
    this.container.style.userSelect = 'none'
  }

  /**
   * 处理指针按下
   */
  private handlePointerDown(e: PointerEvent): void {
    e.preventDefault()

    this.isDragging = true
    this.startX = e.clientX
    this.startY = e.clientY
    this.currentX = e.clientX
    this.currentY = e.clientY
    this.lastX = e.clientX
    this.lastY = e.clientY

    // 重置速度
    this.velocityX = 0
    this.velocityY = 0

    // 停止惯性动画
    if (this.inertiaAnimationId !== null) {
      cancelAnimationFrame(this.inertiaAnimationId)
      this.inertiaAnimationId = null
    }

    // 清空路径
    this.path = []
    this.path.push({ x: e.clientX, y: e.clientY, time: performance.now() })

    // 添加移动和释放监听
    document.addEventListener('pointermove', this.boundHandlers.pointerMove)
    document.addEventListener('pointerup', this.boundHandlers.pointerUp)
    document.addEventListener('pointercancel', this.boundHandlers.pointerCancel)

    // 暂停动画
    if (this.config.animateOnDrag) {
      this.instance.pause()
    }

    this.emit('dragStart', this.createDragEvent())
  }

  /**
   * 处理指针移动
   */
  private handlePointerMove(e: PointerEvent): void {
    if (!this.isDragging) return

    e.preventDefault()

    const deltaX = e.clientX - this.currentX
    const deltaY = e.clientY - this.currentY

    this.currentX = e.clientX
    this.currentY = e.clientY

    // 计算速度
    const now = performance.now()
    const dt = now - (this.path[this.path.length - 1]?.time || now)
    if (dt > 0) {
      this.velocityX = deltaX / dt * 16.67 // 归一化到 60fps
      this.velocityY = deltaY / dt * 16.67
    }

    // 记录路径
    this.path.push({ x: e.clientX, y: e.clientY, time: now })
    if (this.path.length > this.maxPathLength) {
      this.path.shift()
    }

    // 应用约束
    const constrainedPos = this.applyConstraints(this.currentX, this.currentY)

    // 更新位置
    this.updatePosition(constrainedPos.x, constrainedPos.y)

    // 如果映射到动画进度
    if (this.config.mapToProgress && this.container) {
      const progress = this.calculateProgress(constrainedPos.x, constrainedPos.y)
      this.updateAnimationProgress(progress)
    }

    this.emit('drag', this.createDragEvent())
  }

  /**
   * 处理指针释放
   */
  private handlePointerUp(e: PointerEvent): void {
    if (!this.isDragging) return

    e.preventDefault()
    this.isDragging = false

    // 移除监听
    document.removeEventListener('pointermove', this.boundHandlers.pointerMove)
    document.removeEventListener('pointerup', this.boundHandlers.pointerUp)
    document.removeEventListener('pointercancel', this.boundHandlers.pointerCancel)

    // 启用惯性
    if (this.config.inertia && (Math.abs(this.velocityX) > 0.1 || Math.abs(this.velocityY) > 0.1)) {
      this.startInertia()
    }

    this.emit('dragEnd', this.createDragEvent())
  }

  /**
   * 处理指针取消
   */
  private handlePointerCancel(e: PointerEvent): void {
    this.handlePointerUp(e)
  }

  /**
   * 应用约束
   */
  private applyConstraints(x: number, y: number): { x: number; y: number } {
    let constrainedX = x
    let constrainedY = y

    // 轴向约束
    if (this.config.axis === 'x') {
      constrainedY = this.startY
    } else if (this.config.axis === 'y') {
      constrainedX = this.startX
    }

    // 边界约束
    if (this.config.bounds.left !== undefined) {
      constrainedX = Math.max(this.config.bounds.left, constrainedX)
    }
    if (this.config.bounds.right !== undefined) {
      constrainedX = Math.min(this.config.bounds.right, constrainedX)
    }
    if (this.config.bounds.top !== undefined) {
      constrainedY = Math.max(this.config.bounds.top, constrainedY)
    }
    if (this.config.bounds.bottom !== undefined) {
      constrainedY = Math.min(this.config.bounds.bottom, constrainedY)
    }

    // 网格吸附
    if (this.config.grid > 0) {
      constrainedX = Math.round(constrainedX / this.config.grid) * this.config.grid
      constrainedY = Math.round(constrainedY / this.config.grid) * this.config.grid
    }

    return { x: constrainedX, y: constrainedY }
  }

  /**
   * 更新位置
   */
  private updatePosition(x: number, y: number): void {
    if (!this.container) return

    const deltaX = x - this.lastX
    const deltaY = y - this.lastY

    // 可以在这里添加视觉反馈
    // 例如移动容器或改变某些样式

    this.lastX = x
    this.lastY = y
  }

  /**
   * 计算进度
   */
  private calculateProgress(x: number, y: number): number {
    if (!this.container) return 0

    const rect = this.container.getBoundingClientRect()
    let progress = 0

    if (this.config.axis === 'x' || this.config.axis === 'both') {
      progress = (x - rect.left) / rect.width
    } else if (this.config.axis === 'y') {
      progress = (y - rect.top) / rect.height
    }

    return Math.max(0, Math.min(1, progress))
  }

  /**
   * 更新动画进度
   */
  private updateAnimationProgress(progress: number): void {
    if (!this.instance.animation) return

    const totalFrames = this.instance.animation.totalFrames
    const frame = progress * totalFrames

    this.instance.goToAndStop(frame, true)
  }

  /**
   * 开始惯性动画
   */
  private startInertia(): void {
    const animate = (): void => {
      // 应用摩擦
      this.velocityX *= this.config.friction
      this.velocityY *= this.config.friction

      // 更新位置
      this.currentX += this.velocityX
      this.currentY += this.velocityY

      // 应用约束
      const constrainedPos = this.applyConstraints(this.currentX, this.currentY)
      this.updatePosition(constrainedPos.x, constrainedPos.y)

      // 如果映射到动画进度
      if (this.config.mapToProgress) {
        const progress = this.calculateProgress(constrainedPos.x, constrainedPos.y)
        this.updateAnimationProgress(progress)
      }

      // 检查是否停止
      if (Math.abs(this.velocityX) < 0.1 && Math.abs(this.velocityY) < 0.1) {
        this.inertiaAnimationId = null
        this.emit('inertiaEnd')
        return
      }

      this.inertiaAnimationId = requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * 创建拖拽事件对象
   */
  private createDragEvent(): DragEvent {
    const event: DragEvent = {
      x: this.currentX,
      y: this.currentY,
      deltaX: this.currentX - this.startX,
      deltaY: this.currentY - this.startY
    }

    if (this.config.mapToProgress) {
      event.progress = this.calculateProgress(this.currentX, this.currentY)
    }

    return event
  }

  /**
   * 获取拖拽路径
   */
  getPath(): Array<{ x: number; y: number; time: number }> {
    return [...this.path]
  }

  /**
   * 清空路径
   */
  clearPath(): void {
    this.path = []
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DragConfig>): void {
    Object.assign(this.config, config)
  }

  /**
   * 启用
   */
  enable(): void {
    if (!this.container) return
    this.container.addEventListener('pointerdown', this.boundHandlers.pointerDown)
  }

  /**
   * 禁用
   */
  disable(): void {
    if (!this.container) return
    this.container.removeEventListener('pointerdown', this.boundHandlers.pointerDown)

    if (this.isDragging) {
      this.isDragging = false
      document.removeEventListener('pointermove', this.boundHandlers.pointerMove)
      document.removeEventListener('pointerup', this.boundHandlers.pointerUp)
      document.removeEventListener('pointercancel', this.boundHandlers.pointerCancel)
    }
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
        console.error('[DragController] Error in callback:', error)
      }
    })
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.disable()

    if (this.inertiaAnimationId !== null) {
      cancelAnimationFrame(this.inertiaAnimationId)
      this.inertiaAnimationId = null
    }

    this.callbacks.clear()
    this.path = []
  }
}

