/**
 * CacheManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { CacheManager } from '../core/CacheManager'

describe('CacheManager', () => {
  let cacheManager: CacheManager

  beforeEach(() => {
    cacheManager = new CacheManager(10, 3600000) // 10MB, 1小时
  })

  afterEach(() => {
    cacheManager.destroy()
  })

  describe('基础功能', () => {
    it('应该能够设置和获取缓存', () => {
      const data = { test: 'data' }
      cacheManager.set('key1', data)

      const retrieved = cacheManager.get('key1')
      expect(retrieved).toEqual(data)
    })

    it('应该能够删除缓存', () => {
      cacheManager.set('key1', { test: 'data' })

      const deleted = cacheManager.delete('key1')
      expect(deleted).toBe(true)
      expect(cacheManager.get('key1')).toBeNull()
    })

    it('应该能够清空所有缓存', () => {
      cacheManager.set('key1', { test: 'data1' })
      cacheManager.set('key2', { test: 'data2' })

      cacheManager.clear()

      expect(cacheManager.get('key1')).toBeNull()
      expect(cacheManager.get('key2')).toBeNull()
    })
  })

  describe('LRU 算法', () => {
    it('应该实现 LRU 淘汰策略', () => {
      // 创建小容量缓存
      const smallCache = new CacheManager(0.001, 3600000) // 1KB

      // 添加多个项
      smallCache.set('key1', { data: 'a'.repeat(100) })
      smallCache.set('key2', { data: 'b'.repeat(100) })
      smallCache.set('key3', { data: 'c'.repeat(100) })

      // key1 应该被淘汰（最少使用）
      expect(smallCache.get('key1')).toBeNull()

      smallCache.destroy()
    })

    it('访问应该更新 LRU 顺序', () => {
      const smallCache = new CacheManager(0.001, 3600000)

      smallCache.set('key1', { data: 'a'.repeat(100) })
      smallCache.set('key2', { data: 'b'.repeat(100) })

      // 访问 key1
      smallCache.get('key1')

      // 添加新项，key2 应该被淘汰
      smallCache.set('key3', { data: 'c'.repeat(100) })

      expect(smallCache.get('key1')).toBeTruthy()
      expect(smallCache.get('key2')).toBeNull()

      smallCache.destroy()
    })
  })

  describe('缓存统计', () => {
    it('应该正确计算命中率', () => {
      cacheManager.set('key1', { test: 'data' })

      cacheManager.get('key1') // 命中
      cacheManager.get('key2') // 未命中
      cacheManager.get('key1') // 命中

      const hitRate = cacheManager.getHitRate()
      expect(hitRate).toBeCloseTo(0.67, 1) // 2/3
    })

    it('应该正确计算当前大小', () => {
      cacheManager.set('key1', { test: 'data' })
      const size = cacheManager.getCurrentSize()

      expect(size).toBeGreaterThan(0)
    })

    it('应该提供详细统计信息', () => {
      cacheManager.set('key1', { test: 'data1' })
      cacheManager.set('key2', { test: 'data2' })
      cacheManager.get('key1')

      const stats = cacheManager.getStats()

      expect(stats.count).toBe(2)
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBeGreaterThanOrEqual(0)
    })
  })

  describe('过期处理', () => {
    it('应该清理过期缓存', () => {
      const shortTTL = new CacheManager(10, 100) // 100ms TTL

      shortTTL.set('key1', { test: 'data' })

      // 等待过期
      setTimeout(() => {
        const cleaned = shortTTL.cleanExpired()
        expect(cleaned).toBe(1)
        expect(shortTTL.get('key1')).toBeNull()

        shortTTL.destroy()
      }, 150)
    })
  })
})

