/**
 * 性能基准测试
 */

import { describe, bench } from 'vitest'
import { LottieManager } from '../../core/LottieManager'
import { CacheManager } from '../../core/CacheManager'
import { ResourceCompressor } from '../../core/ResourceCompressor'
import { WorkerManager } from '../../core/WorkerManager'

const mockAnimationData = {
  v: '5.0.0',
  fr: 30,
  ip: 0,
  op: 120,
  w: 500,
  h: 500,
  layers: Array(20).fill(null).map((_, i) => ({
    ty: 4,
    nm: `Layer ${i}`,
    ip: 0,
    op: 120,
    shapes: [
      {
        ty: 'rc',
        s: { a: 0, k: [100, 100] },
        p: { a: 0, k: [250, 250] }
      }
    ]
  })),
  assets: []
}

describe('性能基准测试', () => {
  describe('LottieManager', () => {
    bench('创建实例', () => {
      const manager = LottieManager.getInstance()
      const container = document.createElement('div')

      const instance = manager.create({
        container,
        animationData: mockAnimationData
      })

      manager.destroy(instance.id)
    })

    bench('批量创建实例', () => {
      const manager = LottieManager.getInstance()
      const instances = []

      for (let i = 0; i < 10; i++) {
        const container = document.createElement('div')
        instances.push(manager.create({
          container,
          animationData: mockAnimationData
        }))
      }

      instances.forEach(inst => manager.destroy(inst.id))
    })
  })

  describe('CacheManager', () => {
    bench('LRU 缓存写入', () => {
      const cache = new CacheManager(50, 3600000)

      for (let i = 0; i < 100; i++) {
        cache.set(`key${i}`, mockAnimationData)
      }

      cache.destroy()
    })

    bench('LRU 缓存读取', () => {
      const cache = new CacheManager(50, 3600000)

      // 预填充缓存
      for (let i = 0; i < 50; i++) {
        cache.set(`key${i}`, mockAnimationData)
      }

      // 基准测试读取
      for (let i = 0; i < 100; i++) {
        cache.get(`key${i % 50}`)
      }

      cache.destroy()
    })

    bench('缓存命中率计算', () => {
      const cache = new CacheManager(50, 3600000)

      cache.set('key1', mockAnimationData)
      cache.get('key1')
      cache.get('key2')
      cache.getHitRate()

      cache.destroy()
    })
  })

  describe('ResourceCompressor', () => {
    bench('分析动画数据', () => {
      const compressor = ResourceCompressor.getInstance()
      compressor.analyze(mockAnimationData)
    })

    bench('压缩动画数据', async () => {
      const compressor = ResourceCompressor.getInstance()
      await compressor.compress(mockAnimationData, {
        compressPaths: true,
        removeRedundant: true,
        precision: 2
      })
    })

    bench('路径简化', () => {
      const compressor = ResourceCompressor.getInstance()
      const path = Array(100).fill(null).map((_, i) => [i, Math.sin(i)])
      compressor.simplifyPath(path, 0.5)
    })
  })

  describe('WorkerManager', () => {
    bench('Worker 任务提交', async () => {
      const workerManager = WorkerManager.getInstance()
      await workerManager.parseAnimation(mockAnimationData)
    })
  })
})

