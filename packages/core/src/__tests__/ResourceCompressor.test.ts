/**
 * ResourceCompressor 单元测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ResourceCompressor } from '../core/ResourceCompressor'

describe('ResourceCompressor', () => {
  let compressor: ResourceCompressor

  beforeEach(() => {
    compressor = ResourceCompressor.getInstance()
  })

  const mockAnimationData = {
    v: '5.0.0',
    fr: 30,
    ip: 0,
    op: 60,
    w: 500,
    h: 500,
    layers: [
      {
        ty: 4,
        nm: 'Shape Layer',
        ip: 0,
        op: 60,
        shapes: [
          {
            ty: 'rc',
            d: 1,
            s: { a: 0, k: [100.123456789, 100.123456789] },
            p: { a: 0, k: [250.987654321, 250.987654321] }
          }
        ]
      },
      {
        ty: 4,
        nm: 'Hidden Layer',
        hd: true, // 隐藏
        ip: 0,
        op: 60
      }
    ],
    assets: []
  }

  describe('分析功能', () => {
    it('应该正确分析动画数据', () => {
      const analysis = compressor.analyze(mockAnimationData)

      expect(analysis).toHaveProperty('totalSize')
      expect(analysis).toHaveProperty('layerCount')
      expect(analysis).toHaveProperty('frameCount')
      expect(analysis).toHaveProperty('complexity')
      expect(analysis.layerCount).toBe(2)
    })

    it('应该识别动画复杂度', () => {
      const simpleData = { ...mockAnimationData, layers: mockAnimationData.layers.slice(0, 1) }
      const analysis = compressor.analyze(simpleData)

      expect(analysis.complexity).toBe('low')
    })
  })

  describe('压缩功能', () => {
    it('应该能够压缩动画数据', async () => {
      const result = await compressor.compress(mockAnimationData, {
        compressPaths: true,
        removeRedundant: true
      })

      expect(result.compressedSize).toBeLessThan(result.originalSize)
      expect(result.compressionRatio).toBeGreaterThan(0)
      expect(result.optimizations).toBeInstanceOf(Array)
    })

    it('应该移除隐藏图层', async () => {
      const result = await compressor.compress(mockAnimationData, {
        removeHiddenLayers: true
      })

      expect(result.data.layers.length).toBe(1)
      expect(result.data.layers[0].hd).not.toBe(true)
    })

    it('应该压缩路径精度', async () => {
      const result = await compressor.compress(mockAnimationData, {
        compressPaths: true,
        precision: 2
      })

      const shape = result.data.layers[0].shapes[0]
      const sValue = shape.s.k[0]

      // 精度应该被限制在2位小数
      expect(sValue).toBeCloseTo(100.12, 2)
    })
  })

  describe('路径简化', () => {
    it('应该简化路径数据', () => {
      const path = [
        [0, 0],
        [1, 1],
        [2, 2],
        [3, 3],
        [4, 4],
        [5, 5]
      ]

      const simplified = compressor.simplifyPath(path, 0.5)

      // 简化后的路径应该更短
      expect(simplified.length).toBeLessThan(path.length)
      // 但应该保留起点和终点
      expect(simplified[0]).toEqual([0, 0])
      expect(simplified[simplified.length - 1]).toEqual([5, 5])
    })
  })

  describe('优化建议', () => {
    it('应该提供压缩建议', () => {
      const suggestions = compressor.getCompressionSuggestions(mockAnimationData)

      expect(suggestions).toBeInstanceOf(Array)
      expect(suggestions.length).toBeGreaterThan(0)
    })

    it('应该针对复杂动画提供建议', () => {
      const complexData = {
        ...mockAnimationData,
        layers: Array(100).fill(mockAnimationData.layers[0])
      }

      const suggestions = compressor.getCompressionSuggestions(complexData)

      expect(suggestions.some(s => s.includes('图层'))).toBe(true)
    })
  })
})

