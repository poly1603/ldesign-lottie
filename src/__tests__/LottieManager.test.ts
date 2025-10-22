/**
 * LottieManager 单元测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { LottieManager } from '../core/LottieManager'

describe('LottieManager', () => {
  let manager: LottieManager

  beforeEach(() => {
    manager = LottieManager.getInstance()
  })

  afterEach(() => {
    manager.destroyAll()
    LottieManager.reset()
  })

  describe('实例管理', () => {
    it('应该创建单例实例', () => {
      const instance1 = LottieManager.getInstance()
      const instance2 = LottieManager.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('应该能够重置单例', () => {
      const instance1 = LottieManager.getInstance()
      LottieManager.reset()
      const instance2 = LottieManager.getInstance()
      expect(instance1).not.toBe(instance2)
    })

    it('应该能够创建动画实例', () => {
      const container = document.createElement('div')
      const instance = manager.create({
        container,
        animationData: { v: '5.0.0', fr: 30, ip: 0, op: 60, w: 100, h: 100, layers: [] }
      })

      expect(instance).toBeDefined()
      expect(instance.id).toBeTruthy()
    })

    it('应该能够通过 ID 获取实例', () => {
      const container = document.createElement('div')
      const instance = manager.create({
        container,
        animationData: { v: '5.0.0', fr: 30, ip: 0, op: 60, w: 100, h: 100, layers: [] }
      })

      const retrieved = manager.get(instance.id)
      expect(retrieved).toBe(instance)
    })

    it('应该能够销毁实例', () => {
      const container = document.createElement('div')
      const instance = manager.create({
        container,
        animationData: { v: '5.0.0', fr: 30, ip: 0, op: 60, w: 100, h: 100, layers: [] }
      })

      const result = manager.destroy(instance.id)
      expect(result).toBe(true)
      expect(manager.get(instance.id)).toBeUndefined()
    })
  })

  describe('全局控制', () => {
    it('应该能够播放所有实例', () => {
      const container1 = document.createElement('div')
      const container2 = document.createElement('div')

      const instance1 = manager.create({ container: container1, animationData: {} })
      const instance2 = manager.create({ container: container2, animationData: {} })

      const playSpy1 = vi.spyOn(instance1, 'play')
      const playSpy2 = vi.spyOn(instance2, 'play')

      manager.playAll()

      expect(playSpy1).toHaveBeenCalled()
      expect(playSpy2).toHaveBeenCalled()
    })

    it('应该能够暂停所有实例', () => {
      const container = document.createElement('div')
      const instance = manager.create({ container, animationData: {} })

      const pauseSpy = vi.spyOn(instance, 'pause')
      manager.pauseAll()

      expect(pauseSpy).toHaveBeenCalled()
    })

    it('应该能够设置全局播放速度', () => {
      const container = document.createElement('div')
      const instance = manager.create({ container, animationData: {} })

      const speedSpy = vi.spyOn(instance, 'setSpeed')
      manager.setGlobalSpeed(2)

      expect(speedSpy).toHaveBeenCalledWith(2)
    })
  })

  describe('缓存管理', () => {
    it('应该能够预加载动画', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ v: '5.0.0' })
        } as Response)
      )

      const data = await manager.preload('test.json')
      expect(data).toBeDefined()
      expect(data.v).toBe('5.0.0')
    })

    it('应该能够批量预加载', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ v: '5.0.0' })
        } as Response)
      )

      await manager.preloadBatch(['anim1.json', 'anim2.json'])
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('应该能够清空缓存', () => {
      manager.clearCache()
      const stats = manager.getCacheStats()
      expect(stats.size).toBe(0)
    })
  })

  describe('性能统计', () => {
    it('应该能够获取全局统计', () => {
      const stats = manager.getGlobalStats()

      expect(stats).toHaveProperty('totalInstances')
      expect(stats).toHaveProperty('activeInstances')
      expect(stats).toHaveProperty('averageFps')
      expect(stats).toHaveProperty('totalMemory')
      expect(stats).toHaveProperty('cacheHitRate')
    })

    it('应该能够获取池统计', () => {
      const stats = manager.getPoolStats()

      expect(stats).toHaveProperty('total')
      expect(stats).toHaveProperty('active')
      expect(stats).toHaveProperty('idle')
      expect(stats).toHaveProperty('peak')
    })
  })

  describe('设备检测', () => {
    it('应该能够获取设备信息', () => {
      const info = manager.getDeviceInfo()

      expect(info).toHaveProperty('isMobile')
      expect(info).toHaveProperty('performanceTier')
    })

    it('应该能够获取推荐配置', () => {
      const config = manager.getRecommendedConfig()

      expect(config).toHaveProperty('renderer')
      expect(config).toHaveProperty('targetFPS')
    })
  })

  describe('性能优化', () => {
    it('应该能够执行优化', () => {
      const result = manager.optimize()

      expect(result).toHaveProperty('cleaned')
      expect(result).toHaveProperty('cacheCleared')
      expect(typeof result.cleaned).toBe('number')
      expect(typeof result.cacheCleared).toBe('boolean')
    })

    it('应该能够自动优化', () => {
      const result = manager.autoOptimize()

      expect(result).toHaveProperty('optimized')
      expect(result).toHaveProperty('downgraded')
    })
  })
})

