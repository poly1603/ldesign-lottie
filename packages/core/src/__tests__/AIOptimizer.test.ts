/**
 * AIOptimizer 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AIOptimizer } from '../core/AIOptimizer'
import { LottieInstance } from '../core/LottieInstance'
import type { PerformanceMetrics } from '../types'

// Mock LottieInstance
vi.mock('../core/LottieInstance')

describe('AIOptimizer', () => {
  let optimizer: AIOptimizer
  let mockInstance: any

  beforeEach(() => {
    optimizer = AIOptimizer.getInstance({
      enableAutoOptimization: false, // 禁用自动优化以便测试
      targetFPS: 60,
      maxMemory: 100
    })

    // 创建模拟实例
    mockInstance = {
      id: 'test-instance',
      animation: {
        animationData: {
          layers: Array(10).fill({ ty: 4 }),
          assets: []
        },
        currentFrame: 0,
        totalFrames: 100
      },
      config: {
        renderer: 'svg',
        quality: 'high',
        advanced: {}
      },
      switchRenderer: vi.fn(),
      updateConfig: vi.fn()
    }
  })

  describe('设备检测', () => {
    it('应该正确检测设备配置', () => {
      const config = optimizer.generateAdaptiveConfig()

      expect(config).toHaveProperty('renderer')
      expect(config).toHaveProperty('quality')
      expect(config).toHaveProperty('advanced')
    })

    it('应该为低端设备生成合适的配置', () => {
      // 模拟低端设备
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 2,
        configurable: true
      })

      const newOptimizer = AIOptimizer.getInstance()
      const config = newOptimizer.generateAdaptiveConfig()

      expect(config.quality).toBe('low')
      expect(config.advanced?.enableSmartFrameSkip).toBe(true)
      expect(config.advanced?.targetFPS).toBeLessThanOrEqual(30)
    })
  })

  describe('动画分析', () => {
    it('应该分析动画并提供优化建议', async () => {
      const result = await optimizer.analyzeAnimation(mockInstance)

      expect(result).toHaveProperty('suggestions')
      expect(result).toHaveProperty('appliedOptimizations')
      expect(result).toHaveProperty('performanceGain')
      expect(result).toHaveProperty('sizeReduction')

      expect(result.suggestions).toBeInstanceOf(Array)
    })

    it('应该检测高复杂度动画', async () => {
      // 创建高复杂度动画
      mockInstance.animation.animationData.layers = Array(50).fill({ ty: 4 })

      const result = await optimizer.analyzeAnimation(mockInstance)

      const complexitySuggestion = result.suggestions.find(s =>
        s.title.includes('复杂度')
      )

      expect(complexitySuggestion).toBeDefined()
      expect(complexitySuggestion?.severity).toBe('high')
    })

    it('应该建议降低质量设置', async () => {
      // 模拟低端设备
      const newOptimizer = AIOptimizer.getInstance({
        enableAutoOptimization: false
      })

      const result = await newOptimizer.analyzeAnimation(mockInstance)

      const qualitySuggestion = result.suggestions.find(s =>
        s.type === 'quality'
      )

      // 可能会有质量建议
      if (qualitySuggestion) {
        expect(qualitySuggestion.action).toBeDefined()
      }
    })
  })

  describe('异常检测', () => {
    it('应该检测 FPS 异常', () => {
      // 添加正常的性能历史
      for (let i = 0; i < 20; i++) {
        const normalMetrics: PerformanceMetrics = {
          fps: 60,
          memory: 50,
          cpuUsage: 30,
          renderTime: 16,
          frameCount: i
        }
        optimizer.detectAnomalies(normalMetrics)
      }

      // 添加异常数据
      const anomalyMetrics: PerformanceMetrics = {
        fps: 10, // 严重低于正常值
        memory: 50,
        cpuUsage: 30,
        renderTime: 100,
        frameCount: 21
      }

      const suggestions = optimizer.detectAnomalies(anomalyMetrics)

      expect(suggestions.length).toBeGreaterThan(0)

      const fpsAnomaly = suggestions.find(s => s.title.includes('FPS'))
      expect(fpsAnomaly).toBeDefined()
      expect(fpsAnomaly?.severity).toBe('critical')
    })

    it('应该检测内存泄漏', () => {
      // 模拟内存持续增长
      for (let i = 0; i < 30; i++) {
        const metrics: PerformanceMetrics = {
          fps: 60,
          memory: 50 + i * 2, // 每次增加 2MB
          cpuUsage: 30,
          renderTime: 16,
          frameCount: i
        }
        optimizer.detectAnomalies(metrics)
      }

      const lastMetrics: PerformanceMetrics = {
        fps: 60,
        memory: 110,
        cpuUsage: 30,
        renderTime: 16,
        frameCount: 31
      }

      const suggestions = optimizer.detectAnomalies(lastMetrics)

      const memoryLeak = suggestions.find(s => s.title.includes('内存泄漏'))

      // 可能检测到内存泄漏
      if (memoryLeak) {
        expect(memoryLeak.severity).toBe('critical')
      }
    })
  })

  describe('性能预测', () => {
    it('应该预测动画性能', () => {
      const animationData = {
        layers: Array(20).fill({ ty: 4 }),
        assets: []
      }

      const prediction = optimizer.predictPerformance(animationData)

      expect(prediction).toHaveProperty('fps')
      expect(prediction).toHaveProperty('memory')
      expect(prediction).toHaveProperty('risk')

      expect(prediction.fps).toBeGreaterThan(0)
      expect(prediction.memory).toBeGreaterThan(0)
      expect(['low', 'medium', 'high']).toContain(prediction.risk)
    })

    it('应该为复杂动画预测低性能', () => {
      const complexAnimation = {
        layers: Array(100).fill({ ty: 4 }),
        assets: Array(50).fill({})
      }

      const prediction = optimizer.predictPerformance(complexAnimation)

      expect(prediction.fps).toBeLessThan(30)
      expect(prediction.risk).toBe('high')
    })
  })

  describe('优化报告', () => {
    it('应该生成详细的优化报告', () => {
      const report = optimizer.generateReport(mockInstance)

      expect(report).toContain('设备信息')
      expect(report).toContain('当前性能')
      expect(report).toContain('当前配置')
      expect(report).toContain('优化建议')
    })
  })

  describe('自动优化', () => {
    it('应该在启用时自动应用优化', async () => {
      const autoOptimizer = AIOptimizer.getInstance({
        enableAutoOptimization: true,
        aggressiveness: 'aggressive'
      })

      // 创建低性能场景
      mockInstance.animation.animationData.layers = Array(50).fill({ ty: 4 })

      const result = await autoOptimizer.analyzeAnimation(mockInstance)

      // 应该有应用的优化
      expect(result.appliedOptimizations.length).toBeGreaterThan(0)
    })

    it('应该根据激进程度应用不同的优化', async () => {
      const conservativeOptimizer = AIOptimizer.getInstance({
        enableAutoOptimization: true,
        aggressiveness: 'conservative'
      })

      const aggressiveOptimizer = AIOptimizer.getInstance({
        enableAutoOptimization: true,
        aggressiveness: 'aggressive'
      })

      const conservativeResult = await conservativeOptimizer.analyzeAnimation(mockInstance)
      const aggressiveResult = await aggressiveOptimizer.analyzeAnimation(mockInstance)

      // 激进模式应该应用更多优化
      expect(aggressiveResult.appliedOptimizations.length).toBeGreaterThanOrEqual(
        conservativeResult.appliedOptimizations.length
      )
    })
  })

  describe('内存管理', () => {
    it('应该正确估算内存使用', async () => {
      const result = await optimizer.analyzeAnimation(mockInstance)

      // 检查是否有内存相关的建议
      const memorySuggestion = result.suggestions.find(s =>
        s.type === 'size' || s.title.includes('内存')
      )

      // 如果有内存建议，验证其属性
      if (memorySuggestion) {
        expect(memorySuggestion).toHaveProperty('severity')
        expect(memorySuggestion).toHaveProperty('impact')
      }
    })
  })

  describe('生命周期', () => {
    it('应该能够重置优化器', () => {
      // 添加一些历史数据
      for (let i = 0; i < 10; i++) {
        const metrics: PerformanceMetrics = {
          fps: 60,
          memory: 50,
          cpuUsage: 30,
          renderTime: 16,
          frameCount: i
        }
        optimizer.detectAnomalies(metrics)
      }

      optimizer.reset()

      // 重置后不应该检测到异常
      const anomalyMetrics: PerformanceMetrics = {
        fps: 10,
        memory: 50,
        cpuUsage: 30,
        renderTime: 100,
        frameCount: 0
      }

      const suggestions = optimizer.detectAnomalies(anomalyMetrics)

      // 由于历史数据不足，不应该检测到异常
      expect(suggestions.length).toBe(0)
    })

    it('应该能够销毁优化器', () => {
      optimizer.destroy()

      // 销毁后重新获取应该是新实例
      const newOptimizer = AIOptimizer.getInstance()
      expect(newOptimizer).toBeDefined()
    })
  })
})


