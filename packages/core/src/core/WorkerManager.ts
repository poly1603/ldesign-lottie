/**
 * Worker 管理器
 * 管理 Web Worker 的生命周期和任务调度
 */

import { createLottieWorker, isWorkerSupported } from './WorkerFactory'
import type { WorkerMessage, WorkerResponse } from '../workers/lottie.worker'

export interface WorkerTask<T = any> {
  id: string
  type: 'parse' | 'compress' | 'decompress' | 'optimize'
  data: any
  options?: any
  priority?: number // 优先级：数字越大优先级越高
  resolve: (result: T) => void
  reject: (error: Error) => void
  startTime: number
  retryCount?: number
}

export interface WorkerManagerConfig {
  /** Worker 数量（默认为 CPU 核心数的一半） */
  workerCount?: number
  /** 任务超时时间（ms） */
  timeout?: number
  /** 是否启用 Worker（可以禁用用于调试） */
  enabled?: boolean
  /** 是否使用共享 Worker */
  useSharedWorker?: boolean
  /** 最大任务重试次数 */
  maxRetries?: number
  /** 是否启用任务优先级 */
  enablePriority?: boolean
}

/**
 * Worker 管理器
 * 负责 Worker 池管理和任务分发
 */
export class WorkerManager {
  private static instance: WorkerManager | null = null
  private workers: Worker[] = []
  private availableWorkers: Worker[] = []
  private taskQueue: WorkerTask[] = []
  private pendingTasks = new Map<string, WorkerTask>()
  private taskIdCounter = 0
  private config: Required<WorkerManagerConfig>
  private isInitialized = false
  private isSupported = true

  // 共享 Worker 支持
  private sharedWorker: SharedWorker | null = null
  private sharedWorkerPort: MessagePort | null = null

  // Worker 健康状态跟踪
  private workerHealth = new Map<Worker, { tasks: number; errors: number; lastActive: number }>()

  // 性能统计
  private taskStats = {
    completed: 0,
    failed: 0,
    retried: 0,
    totalDuration: 0
  }

  private constructor(config?: WorkerManagerConfig) {
    // 检查 Worker 支持
    this.isSupported = isWorkerSupported()

    // 确定 Worker 数量
    const cpuCount = navigator.hardwareConcurrency || 4
    const defaultWorkerCount = Math.max(1, Math.floor(cpuCount / 2))

    this.config = {
      workerCount: config?.workerCount ?? defaultWorkerCount,
      timeout: config?.timeout ?? 30000,
      // 使用 Blob URL 方式，默认启用
      enabled: config?.enabled ?? this.isSupported,
      useSharedWorker: config?.useSharedWorker ?? false,
      maxRetries: config?.maxRetries ?? 3,
      enablePriority: config?.enablePriority ?? true
    }
  }

  /**
   * 获取单例实例
   */
  static getInstance(config?: WorkerManagerConfig): WorkerManager {
    if (!WorkerManager.instance) {
      WorkerManager.instance = new WorkerManager(config)
    }
    return WorkerManager.instance
  }

  /**
   * 初始化 Worker 池
   */
  async init(): Promise<void> {
    if (this.isInitialized || !this.config.enabled) {
      return
    }

    if (!this.isSupported) {
      console.warn('[WorkerManager] Web Workers not supported, falling back to main thread')
      return
    }

    try {
      // 尝试使用共享 Worker
      if (this.config.useSharedWorker && typeof SharedWorker !== 'undefined') {
        try {
          this.initSharedWorker()
          console.log('[WorkerManager] Using Shared Worker')
        } catch (error) {
          console.warn('[WorkerManager] Shared Worker failed, falling back to dedicated workers:', error)
          this.config.useSharedWorker = false
        }
      }

      // 如果不使用共享 Worker，创建专用 Worker 池
      if (!this.config.useSharedWorker) {
        for (let i = 0; i < this.config.workerCount; i++) {
          try {
            const worker = this.createWorker()
            this.workers.push(worker)
            this.availableWorkers.push(worker)

            // 初始化健康状态
            this.workerHealth.set(worker, {
              tasks: 0,
              errors: 0,
              lastActive: Date.now()
            })
          } catch (error) {
            console.warn(`[WorkerManager] Failed to create worker ${i}, disabling workers`)
            this.config.enabled = false
            this.isSupported = false
            return
          }
        }
      }

      this.isInitialized = true
      console.log(`[WorkerManager] Initialized with ${this.config.workerCount} workers`)
    } catch (error) {
      console.error('[WorkerManager] Failed to initialize:', error)
      this.config.enabled = false
    }
  }

  /**
   * 初始化共享 Worker
   */
  private initSharedWorker(): void {
    // SharedWorker 暂不支持 Blob URL，需要外部文件
    // 暂时禁用 SharedWorker 功能
    throw new Error('SharedWorker is not supported with Blob URL workers')

    this.sharedWorkerPort = this.sharedWorker.port
    this.sharedWorkerPort.start()

    // 监听消息
    this.sharedWorkerPort.onmessage = (e: MessageEvent<WorkerResponse>) => {
      this.handleSharedWorkerMessage(e.data)
    }

    // 监听错误
    this.sharedWorker.onerror = (error) => {
      console.error('[WorkerManager] Shared Worker error:', error)
    }
  }

  /**
   * 处理共享 Worker 消息
   */
  private handleSharedWorkerMessage(response: WorkerResponse): void {
    const { id, result, error, duration } = response

    const task = this.pendingTasks.get(id)
    if (!task) {
      console.warn('[WorkerManager] Received response for unknown task:', id)
      return
    }

    this.pendingTasks.delete(id)

    if (duration) {
      const totalTime = performance.now() - task.startTime
      this.taskStats.totalDuration += totalTime
      console.log(`[WorkerManager] Shared Worker task ${id} completed in ${totalTime.toFixed(2)}ms`)
    }

    if (error) {
      const retryCount = task.retryCount || 0
      if (retryCount < this.config.maxRetries) {
        task.retryCount = retryCount + 1
        this.taskQueue.unshift(task)
        this.taskStats.retried++
      } else {
        this.taskStats.failed++
        task.reject(new Error(error))
      }
    } else {
      this.taskStats.completed++
      task.resolve(result)
    }

    this.processSharedWorkerQueue()
  }

  /**
   * 处理共享 Worker 队列
   */
  private processSharedWorkerQueue(): void {
    if (!this.sharedWorkerPort || this.taskQueue.length === 0) return

    if (this.config.enablePriority && this.taskQueue.length > 1) {
      this.taskQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    }

    while (this.taskQueue.length > 0) {
      const task = this.taskQueue.shift()!
      this.pendingTasks.set(task.id, task)

      const message: WorkerMessage = {
        type: task.type,
        id: task.id,
        data: task.data,
        options: task.options
      }

      this.sharedWorkerPort.postMessage(message)
    }
  }

  /**
   * 创建 Worker
   */
  private createWorker(): Worker {
    // 使用 Blob URL 方式创建 Worker
    try {
      const worker = createLottieWorker()

      // 监听消息
      worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(worker, e.data)
      }

      // 监听错误
      worker.onerror = (error) => {
        console.error('[WorkerManager] Worker error:', error)
        this.handleWorkerError(worker, error)
      }

      return worker
    } catch (error) {
      console.warn('[WorkerManager] Failed to create worker:', error)
      throw error
    }
  }

  /**
   * 处理 Worker 消息
   */
  private handleWorkerMessage(worker: Worker, response: WorkerResponse): void {
    const { id, result, error, duration } = response

    // Worker 初始化完成
    if ((response as any).type === 'ready') {
      return
    }

    const task = this.pendingTasks.get(id)
    if (!task) {
      console.warn('[WorkerManager] Received response for unknown task:', id)
      return
    }

    // 移除待处理任务
    this.pendingTasks.delete(id)

    // 标记 Worker 为可用
    this.availableWorkers.push(worker)

    // 更新 Worker 健康状态
    const health = this.workerHealth.get(worker)
    if (health) {
      health.lastActive = Date.now()
    }

    // 记录性能
    if (duration) {
      const totalTime = performance.now() - task.startTime
      this.taskStats.totalDuration += totalTime
      console.log(`[WorkerManager] Task ${id} completed in ${totalTime.toFixed(2)}ms (worker: ${duration.toFixed(2)}ms)`)
    }

    // 处理结果
    if (error) {
      // 尝试重试
      const retryCount = task.retryCount || 0
      if (retryCount < this.config.maxRetries) {
        console.warn(`[WorkerManager] Task ${id} failed, retrying (${retryCount + 1}/${this.config.maxRetries})`)
        task.retryCount = retryCount + 1
        this.taskQueue.unshift(task) // 添加到队列前面
        this.taskStats.retried++
      } else {
        this.taskStats.failed++
        task.reject(new Error(error))

        // 更新 Worker 错误计数
        if (health) {
          health.errors++
        }
      }
    } else {
      this.taskStats.completed++
      task.resolve(result)
    }

    // 处理队列中的下一个任务
    this.processQueue()
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(worker: Worker, error: ErrorEvent): void {
    // 查找使用这个 Worker 的任务
    for (const [id, task] of this.pendingTasks.entries()) {
      // 简单判断：如果没有其他待处理任务，这个错误就是当前任务的
      task.reject(new Error(`Worker error: ${error.message}`))
      this.pendingTasks.delete(id)
    }

    // 移除出错的 Worker
    const index = this.workers.indexOf(worker)
    if (index > -1) {
      this.workers.splice(index, 1)
    }

    const availableIndex = this.availableWorkers.indexOf(worker)
    if (availableIndex > -1) {
      this.availableWorkers.splice(availableIndex, 1)
    }

    // 终止 Worker
    worker.terminate()

    // 如果还有可用 Worker，继续处理队列
    if (this.workers.length > 0) {
      this.processQueue()
    }
  }

  /**
   * 提交任务
   */
  private async submitTask<T = any>(
    type: WorkerTask['type'],
    data: any,
    options?: any
  ): Promise<T> {
    // 如果 Worker 未启用，回退到主线程
    if (!this.config.enabled) {
      return this.executeInMainThread(type, data, options)
    }

    // 确保已初始化
    if (!this.isInitialized) {
      await this.init()
    }

    return new Promise<T>((resolve, reject) => {
      const task: WorkerTask<T> = {
        id: `task-${this.taskIdCounter++}`,
        type,
        data,
        options,
        resolve,
        reject,
        startTime: performance.now()
      }

      // 设置超时
      setTimeout(() => {
        if (this.pendingTasks.has(task.id)) {
          this.pendingTasks.delete(task.id)
          reject(new Error(`Task timeout after ${this.config.timeout}ms`))
        }
      }, this.config.timeout)

      // 添加到队列
      this.taskQueue.push(task)
      this.processQueue()
    })
  }

  /**
   * 处理任务队列（支持优先级）
   */
  private processQueue(): void {
    // 如果启用优先级，先排序队列
    if (this.config.enablePriority && this.taskQueue.length > 1) {
      this.taskQueue.sort((a, b) => (b.priority || 0) - (a.priority || 0))
    }

    // 处理队列中的任务
    while (this.taskQueue.length > 0 && this.availableWorkers.length > 0) {
      const task = this.taskQueue.shift()!
      const worker = this.getBestWorker()

      if (!worker) break

      // 记录待处理任务
      this.pendingTasks.set(task.id, task)

      // 更新 Worker 健康状态
      const health = this.workerHealth.get(worker)
      if (health) {
        health.tasks++
        health.lastActive = Date.now()
      }

      // 发送消息给 Worker
      const message: WorkerMessage = {
        type: task.type,
        id: task.id,
        data: task.data,
        options: task.options
      }

      // 使用 Transferable Objects 优化大数据传输
      const transferList = this.getTransferableObjects(task.data)
      if (transferList.length > 0) {
        worker.postMessage(message, transferList)
      } else {
        worker.postMessage(message)
      }
    }
  }

  /**
   * 获取最佳 Worker（负载最小的）
   */
  private getBestWorker(): Worker | null {
    if (this.availableWorkers.length === 0) return null

    // 移除第一个可用 Worker
    const worker = this.availableWorkers.shift()!

    // 简单策略：返回第一个可用的
    // 更复杂的策略可以基于 Worker 健康状态选择
    return worker
  }

  /**
   * 获取可传输对象
   */
  private getTransferableObjects(data: any): Transferable[] {
    const transferList: Transferable[] = []

    // 检查 ArrayBuffer
    if (data instanceof ArrayBuffer) {
      transferList.push(data)
    } else if (data && typeof data === 'object') {
      // 递归检查对象中的 ArrayBuffer
      Object.values(data).forEach(value => {
        if (value instanceof ArrayBuffer) {
          transferList.push(value)
        }
      })
    }

    return transferList
  }

  /**
   * 在主线程中执行（降级方案）
   */
  private async executeInMainThread<T = any>(
    type: WorkerTask['type'],
    data: any,
    options?: any
  ): Promise<T> {
    const { parseAnimationData, optimizeAnimationData } = await import('../workers/parser')
    const { compressData, decompressData } = await import('../workers/compressor')

    switch (type) {
      case 'parse':
        return await parseAnimationData(data, options) as T

      case 'compress':
        return await compressData(data, options) as T

      case 'decompress':
        return await decompressData(data, options) as T

      case 'optimize':
        return await optimizeAnimationData(data, options) as T

      default:
        throw new Error(`Unknown task type: ${type}`)
    }
  }

  /**
   * 解析动画数据
   */
  async parseAnimation(data: string | object, options?: any): Promise<any> {
    return this.submitTask('parse', data, options)
  }

  /**
   * 压缩动画数据
   */
  async compressAnimation(data: any, options?: any): Promise<ArrayBuffer> {
    return this.submitTask('compress', data, options)
  }

  /**
   * 解压缩动画数据
   */
  async decompressAnimation(buffer: ArrayBuffer, options?: any): Promise<any> {
    return this.submitTask('decompress', buffer, options)
  }

  /**
   * 优化动画数据
   */
  async optimizeAnimation(data: any, options?: any): Promise<any> {
    return this.submitTask('optimize', data, options)
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    totalWorkers: number
    availableWorkers: number
    pendingTasks: number
    queuedTasks: number
    isEnabled: boolean
    tasksCompleted: number
    tasksFailed: number
    tasksRetried: number
    averageDuration: number
    workerHealth: Array<{ tasks: number; errors: number; errorRate: number }>
  } {
    const workerHealthStats = Array.from(this.workerHealth.values()).map(health => ({
      tasks: health.tasks,
      errors: health.errors,
      errorRate: health.tasks > 0 ? health.errors / health.tasks : 0
    }))

    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      pendingTasks: this.pendingTasks.size,
      queuedTasks: this.taskQueue.length,
      isEnabled: this.config.enabled,
      tasksCompleted: this.taskStats.completed,
      tasksFailed: this.taskStats.failed,
      tasksRetried: this.taskStats.retried,
      averageDuration: this.taskStats.completed > 0
        ? this.taskStats.totalDuration / this.taskStats.completed
        : 0,
      workerHealth: workerHealthStats
    }
  }

  /**
   * 销毁所有 Worker
   */
  destroy(): void {
    // 清空队列
    this.taskQueue = []

    // 拒绝所有待处理任务
    for (const task of this.pendingTasks.values()) {
      task.reject(new Error('WorkerManager destroyed'))
    }
    this.pendingTasks.clear()

    // 终止所有 Worker
    for (const worker of this.workers) {
      worker.terminate()
    }

    this.workers = []
    this.availableWorkers = []
    this.isInitialized = false

    console.log('[WorkerManager] Destroyed')
  }

  /**
   * 重置单例（测试用）
   */
  static reset(): void {
    if (WorkerManager.instance) {
      WorkerManager.instance.destroy()
      WorkerManager.instance = null
    }
  }
}

// 导出单例
export const workerManager = WorkerManager.getInstance()


