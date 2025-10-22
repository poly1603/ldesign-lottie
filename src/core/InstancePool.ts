import type { ILottieInstance, PoolStats } from '../types'

/**
 * 实例池 - 用于管理和复用 Lottie 实例
 */
export class InstancePool {
  private instances: Map<string, ILottieInstance> = new Map()
  private activeInstances: Set<string> = new Set()
  private idleInstances: Set<string> = new Set()
  private maxSize: number
  private peakSize: number = 0

  // 预热和复用
  private prewarmedInstances: Map<string, ILottieInstance[]> = new Map()
  private instanceUsageCount: Map<string, number> = new Map()
  private lastAccessTime: Map<string, number> = new Map()

  // 动态调整
  private targetIdleRatio: number = 0.2 // 目标空闲比例
  private adjustmentTimer: number | null = null

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize
    this.startDynamicAdjustment()
  }

  /**
   * 添加实例到池中
   */
  add(instance: ILottieInstance): boolean {
    if (this.instances.size >= this.maxSize) {
      console.warn('[InstancePool] Pool is full, cannot add more instances')
      return false
    }

    this.instances.set(instance.id, instance)
    this.idleInstances.add(instance.id)

    // 更新峰值
    if (this.instances.size > this.peakSize) {
      this.peakSize = this.instances.size
    }

    return true
  }

  /**
   * 从池中获取实例
   */
  get(id: string): ILottieInstance | undefined {
    return this.instances.get(id)
  }

  /**
   * 将实例标记为活跃
   */
  activate(id: string): boolean {
    if (!this.instances.has(id)) return false

    this.idleInstances.delete(id)
    this.activeInstances.add(id)

    // 更新使用统计
    const count = this.instanceUsageCount.get(id) || 0
    this.instanceUsageCount.set(id, count + 1)
    this.lastAccessTime.set(id, Date.now())

    return true
  }

  /**
   * 预热实例（预先创建指定数量的实例）
   */
  prewarm(key: string, count: number, factory: () => ILottieInstance): void {
    if (!this.prewarmedInstances.has(key)) {
      this.prewarmedInstances.set(key, [])
    }

    const instances = this.prewarmedInstances.get(key)!
    for (let i = 0; i < count; i++) {
      if (this.instances.size >= this.maxSize) break

      const instance = factory()
      instances.push(instance)
      this.add(instance)
    }

    console.log(`[InstancePool] Prewarmed ${count} instances for key: ${key}`)
  }

  /**
   * 获取或创建实例（对象复用）
   */
  getOrCreate(key: string, factory: () => ILottieInstance): ILottieInstance {
    const prewarmed = this.prewarmedInstances.get(key)

    // 优先使用预热的实例
    if (prewarmed && prewarmed.length > 0) {
      const instance = prewarmed.pop()!
      this.activate(instance.id)
      return instance
    }

    // 尝试复用空闲实例
    const idleInstance = this.getIdleInstanceByUsage()
    if (idleInstance) {
      this.activate(idleInstance.id)
      return idleInstance
    }

    // 创建新实例
    const newInstance = factory()
    this.add(newInstance)
    this.activate(newInstance.id)
    return newInstance
  }

  /**
   * 根据使用频率获取空闲实例（LRU 策略）
   */
  private getIdleInstanceByUsage(): ILottieInstance | null {
    if (this.idleInstances.size === 0) return null

    let lruInstance: ILottieInstance | null = null
    let oldestTime = Infinity

    for (const id of this.idleInstances) {
      const lastAccess = this.lastAccessTime.get(id) || 0
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess
        lruInstance = this.instances.get(id) || null
      }
    }

    return lruInstance
  }

  /**
   * 动态调整池容量
   */
  private startDynamicAdjustment(): void {
    this.adjustmentTimer = window.setInterval(() => {
      this.adjustPoolSize()
    }, 60000) // 每分钟调整一次
  }

  /**
   * 调整池大小
   */
  private adjustPoolSize(): void {
    const totalSize = this.instances.size
    if (totalSize === 0) return

    const idleRatio = this.idleInstances.size / totalSize

    // 如果空闲率过高，清理最少使用的实例
    if (idleRatio > this.targetIdleRatio * 2) {
      const toRemove = Math.floor(this.idleInstances.size * 0.3) // 移除30%的空闲实例
      const lruInstances = this.getLRUInstances(toRemove)

      lruInstances.forEach(instance => {
        this.remove(instance.id)
      })

      console.log(`[InstancePool] Adjusted pool size, removed ${toRemove} idle instances`)
    }
  }

  /**
   * 获取最少使用的实例列表
   */
  private getLRUInstances(count: number): ILottieInstance[] {
    const idleList = Array.from(this.idleInstances)
      .map(id => ({
        id,
        instance: this.instances.get(id)!,
        lastAccess: this.lastAccessTime.get(id) || 0,
        usageCount: this.instanceUsageCount.get(id) || 0
      }))
      .sort((a, b) => {
        // 优先移除使用次数少且最近未访问的
        if (a.usageCount !== b.usageCount) {
          return a.usageCount - b.usageCount
        }
        return a.lastAccess - b.lastAccess
      })

    return idleList.slice(0, count).map(item => item.instance)
  }

  /**
   * 将实例标记为空闲
   */
  deactivate(id: string): boolean {
    if (!this.instances.has(id)) return false

    this.activeInstances.delete(id)
    this.idleInstances.add(id)
    return true
  }

  /**
   * 从池中移除实例
   */
  remove(id: string): boolean {
    const instance = this.instances.get(id)
    if (!instance) return false

    // 销毁实例
    try {
      instance.destroy()
    } catch (error) {
      console.error('[InstancePool] Error destroying instance:', error)
    }

    this.instances.delete(id)
    this.activeInstances.delete(id)
    this.idleInstances.delete(id)
    return true
  }

  /**
   * 清理空闲实例
   */
  cleanIdle(count?: number): number {
    const toClean = count ?? this.idleInstances.size
    let cleaned = 0

    const idleArray = Array.from(this.idleInstances)
    for (let i = 0; i < Math.min(toClean, idleArray.length); i++) {
      if (this.remove(idleArray[i])) {
        cleaned++
      }
    }

    return cleaned
  }

  /**
   * 获取所有活跃实例
   */
  getActiveInstances(): ILottieInstance[] {
    return Array.from(this.activeInstances)
      .map(id => this.instances.get(id))
      .filter((instance): instance is ILottieInstance => instance !== undefined)
  }

  /**
   * 获取所有空闲实例
   */
  getIdleInstances(): ILottieInstance[] {
    return Array.from(this.idleInstances)
      .map(id => this.instances.get(id))
      .filter((instance): instance is ILottieInstance => instance !== undefined)
  }

  /**
   * 获取池统计信息
   */
  getStats(): PoolStats {
    return {
      total: this.instances.size,
      active: this.activeInstances.size,
      idle: this.idleInstances.size,
      peak: this.peakSize,
    }
  }

  /**
   * 检查是否已满
   */
  isFull(): boolean {
    return this.instances.size >= this.maxSize
  }

  /**
   * 清空池
   */
  clear(): void {
    // 停止动态调整
    if (this.adjustmentTimer !== null) {
      clearInterval(this.adjustmentTimer)
      this.adjustmentTimer = null
    }

    // 销毁所有实例
    this.instances.forEach(instance => {
      try {
        instance.destroy()
      } catch (error) {
        console.error('[InstancePool] Error destroying instance:', error)
      }
    })

    this.instances.clear()
    this.activeInstances.clear()
    this.idleInstances.clear()
    this.prewarmedInstances.clear()
    this.instanceUsageCount.clear()
    this.lastAccessTime.clear()
    this.peakSize = 0
  }

  /**
   * 销毁池
   */
  destroy(): void {
    this.clear()
  }
}
