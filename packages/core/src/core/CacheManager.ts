import type { CacheItem } from '../types'

/**
 * LRU 节点
 */
class LRUNode {
  key: string
  value: CacheItem
  prev: LRUNode | null = null
  next: LRUNode | null = null

  constructor(key: string, value: CacheItem) {
    this.key = key
    this.value = value
  }
}

/**
 * 缓存管理器 - LRU 算法 + IndexedDB 持久化
 */
export class CacheManager {
  private cache: Map<string, LRUNode> = new Map()
  private maxSize: number // 最大缓存大小 (bytes)
  private ttl: number // 缓存过期时间 (ms)
  private currentSize: number = 0 // 当前缓存大小 (bytes)
  private hits: number = 0
  private misses: number = 0

  // LRU 双向链表
  private head: LRUNode | null = null
  private tail: LRUNode | null = null

  // IndexedDB 支持
  private db: IDBDatabase | null = null
  private dbName: string = 'lottie-cache'
  private storeName: string = 'animations'
  private persistenceEnabled: boolean = false

  // 缓存预热
  private preloadQueue: Set<string> = new Set()
  private isPreloading: boolean = false

  constructor(maxSize: number = 50, ttl: number = 3600000, enablePersistence: boolean = false) {
    this.maxSize = maxSize * 1024 * 1024 // 转换为 bytes
    this.ttl = ttl
    this.persistenceEnabled = enablePersistence

    if (enablePersistence && typeof indexedDB !== 'undefined') {
      this.initIndexedDB()
    }
  }

  /**
   * 初始化 IndexedDB
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => {
        console.error('[CacheManager] IndexedDB initialization failed')
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('[CacheManager] IndexedDB initialized')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, { keyPath: 'key' })
          objectStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  /**
   * 设置缓存
   */
  set(key: string, data: any): boolean {
    // 计算数据大小
    const size = this.calculateSize(data)

    // 如果超过最大大小，不缓存
    if (size > this.maxSize) {
      console.warn('[CacheManager] Data too large to cache')
      return false
    }

    // 如果添加后超过最大大小，使用 LRU 驱逐
    while (this.currentSize + size > this.maxSize && this.cache.size > 0) {
      this.evictLRU()
    }

    const cacheItem: CacheItem = {
      data,
      timestamp: Date.now(),
      size,
    }

    // 如果 key 已存在，先删除旧的
    if (this.cache.has(key)) {
      this.removeNode(this.cache.get(key)!)
      const old = this.cache.get(key)!
      this.currentSize -= old.value.size
    }

    // 创建新节点并添加到头部
    const node = new LRUNode(key, cacheItem)
    this.addToHead(node)
    this.cache.set(key, node)
    this.currentSize += size

    // 持久化到 IndexedDB
    if (this.persistenceEnabled && this.db) {
      this.persistToIndexedDB(key, cacheItem)
    }

    return true
  }

  /**
   * 获取缓存
   */
  get(key: string): any | null {
    const node = this.cache.get(key)

    if (!node) {
      this.misses++
      // 尝试从 IndexedDB 加载
      if (this.persistenceEnabled && this.db) {
        this.loadFromIndexedDB(key).then(data => {
          if (data) {
            this.set(key, data)
          }
        })
      }
      return null
    }

    // 检查是否过期
    if (Date.now() - node.value.timestamp > this.ttl) {
      this.delete(key)
      this.misses++
      return null
    }

    // 移动到头部（最近使用）
    this.moveToHead(node)
    this.hits++

    // 更新访问时间
    node.value.timestamp = Date.now()

    return node.value.data
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const node = this.cache.get(key)
    if (!node) return false

    this.removeNode(node)
    this.currentSize -= node.value.size
    this.cache.delete(key)

    // 从 IndexedDB 删除
    if (this.persistenceEnabled && this.db) {
      this.deleteFromIndexedDB(key)
    }

    return true
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.head = null
    this.tail = null
    this.currentSize = 0
    this.hits = 0
    this.misses = 0

    // 清空 IndexedDB
    if (this.persistenceEnabled && this.db) {
      this.clearIndexedDB()
    }
  }

  /**
   * 获取缓存命中率
   */
  getHitRate(): number {
    const total = this.hits + this.misses
    return total === 0 ? 0 : Math.round((this.hits / total) * 100) / 100
  }

  /**
   * 获取当前缓存大小 (MB)
   */
  getCurrentSize(): number {
    return Math.round(this.currentSize / 1024 / 1024 * 100) / 100
  }

  /**
   * LRU 驱逐 - 移除最少使用的项
   */
  private evictLRU(): void {
    if (!this.tail) return

    const key = this.tail.key
    this.delete(key)
    console.log(`[CacheManager] LRU evicted: ${key}`)
  }

  /**
   * 添加节点到头部
   */
  private addToHead(node: LRUNode): void {
    node.prev = null
    node.next = this.head

    if (this.head) {
      this.head.prev = node
    }

    this.head = node

    if (!this.tail) {
      this.tail = node
    }
  }

  /**
   * 移除节点
   */
  private removeNode(node: LRUNode): void {
    if (node.prev) {
      node.prev.next = node.next
    } else {
      this.head = node.next
    }

    if (node.next) {
      node.next.prev = node.prev
    } else {
      this.tail = node.prev
    }
  }

  /**
   * 移动节点到头部
   */
  private moveToHead(node: LRUNode): void {
    this.removeNode(node)
    this.addToHead(node)
  }

  /**
   * 计算数据大小 (bytes)
   */
  private calculateSize(data: any): number {
    const str = JSON.stringify(data)
    return new Blob([str]).size
  }

  /**
   * 清理过期缓存
   */
  cleanExpired(): number {
    let cleaned = 0
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((node, key) => {
      if (now - node.value.timestamp > this.ttl) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => {
      this.delete(key)
      cleaned++
    })

    return cleaned
  }

  /**
   * 持久化到 IndexedDB
   */
  private async persistToIndexedDB(key: string, item: CacheItem): Promise<void> {
    if (!this.db) return

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)

      await objectStore.put({
        key,
        data: item.data,
        timestamp: item.timestamp,
        size: item.size
      })
    } catch (error) {
      console.error('[CacheManager] Failed to persist to IndexedDB:', error)
    }
  }

  /**
   * 从 IndexedDB 加载
   */
  private async loadFromIndexedDB(key: string): Promise<any | null> {
    if (!this.db) return null

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction([this.storeName], 'readonly')
        const objectStore = transaction.objectStore(this.storeName)
        const request = objectStore.get(key)

        request.onsuccess = () => {
          const result = request.result
          if (result && Date.now() - result.timestamp <= this.ttl) {
            resolve(result.data)
          } else {
            resolve(null)
          }
        }

        request.onerror = () => {
          resolve(null)
        }
      } catch (error) {
        console.error('[CacheManager] Failed to load from IndexedDB:', error)
        resolve(null)
      }
    })
  }

  /**
   * 从 IndexedDB 删除
   */
  private async deleteFromIndexedDB(key: string): Promise<void> {
    if (!this.db) return

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      await objectStore.delete(key)
    } catch (error) {
      console.error('[CacheManager] Failed to delete from IndexedDB:', error)
    }
  }

  /**
   * 清空 IndexedDB
   */
  private async clearIndexedDB(): Promise<void> {
    if (!this.db) return

    try {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const objectStore = transaction.objectStore(this.storeName)
      await objectStore.clear()
    } catch (error) {
      console.error('[CacheManager] Failed to clear IndexedDB:', error)
    }
  }

  /**
   * 缓存预热
   */
  async prewarm(keys: string[]): Promise<void> {
    if (!this.persistenceEnabled || !this.db) {
      console.warn('[CacheManager] Prewarming requires IndexedDB')
      return
    }

    if (this.isPreloading) {
      console.warn('[CacheManager] Preloading already in progress')
      return
    }

    this.isPreloading = true
    this.preloadQueue = new Set(keys)

    try {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const objectStore = transaction.objectStore(this.storeName)

      for (const key of keys) {
        const request = objectStore.get(key)

        await new Promise<void>((resolve) => {
          request.onsuccess = () => {
            const result = request.result
            if (result && Date.now() - result.timestamp <= this.ttl) {
              this.set(key, result.data)
            }
            this.preloadQueue.delete(key)
            resolve()
          }

          request.onerror = () => {
            this.preloadQueue.delete(key)
            resolve()
          }
        })
      }

      console.log(`[CacheManager] Prewarmed ${keys.length} items`)
    } catch (error) {
      console.error('[CacheManager] Prewarm failed:', error)
    } finally {
      this.isPreloading = false
    }
  }

  /**
   * 压缩缓存数据（使用 CompressionStreams API）
   */
  async compress(data: any): Promise<Blob> {
    const str = JSON.stringify(data)
    const blob = new Blob([str])

    if (typeof CompressionStream === 'undefined') {
      return blob
    }

    try {
      const stream = blob.stream().pipeThrough(new CompressionStream('gzip'))
      return await new Response(stream).blob()
    } catch (error) {
      console.warn('[CacheManager] Compression not supported, using uncompressed data')
      return blob
    }
  }

  /**
   * 解压缩缓存数据
   */
  async decompress(blob: Blob): Promise<any> {
    if (typeof DecompressionStream === 'undefined') {
      const text = await blob.text()
      return JSON.parse(text)
    }

    try {
      const stream = blob.stream().pipeThrough(new DecompressionStream('gzip'))
      const text = await new Response(stream).text()
      return JSON.parse(text)
    } catch (error) {
      console.warn('[CacheManager] Decompression failed, trying uncompressed')
      const text = await blob.text()
      return JSON.parse(text)
    }
  }

  /**
   * 获取缓存统计
   */
  getStats(): {
    size: number
    count: number
    hitRate: number
    hits: number
    misses: number
    oldestItem: string | null
    newestItem: string | null
  } {
    return {
      size: this.getCurrentSize(),
      count: this.cache.size,
      hitRate: this.getHitRate(),
      hits: this.hits,
      misses: this.misses,
      oldestItem: this.tail?.key || null,
      newestItem: this.head?.key || null
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.clear()
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}
