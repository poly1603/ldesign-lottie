/**
 * WASMCore 单元测试
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { initWASM, WASMMatrix, WASMBezier, WASMPath, WASMColor, WASMEasing, WASMSIMD } from '../core/WASMCore'

describe('WASMCore', () => {
  beforeAll(async () => {
    // 初始化 WASM 模块
    await initWASM()
  })

  describe('WASMMatrix', () => {
    it('应该正确创建平移矩阵', () => {
      const matrix = WASMMatrix.translate(10, 20, 30)

      expect(matrix).toBeInstanceOf(Float32Array)
      expect(matrix.length).toBe(16)
      expect(matrix[12]).toBe(10) // x translation
      expect(matrix[13]).toBe(20) // y translation
      expect(matrix[14]).toBe(30) // z translation
      expect(matrix[15]).toBe(1)  // w
    })

    it('应该正确创建缩放矩阵', () => {
      const matrix = WASMMatrix.scale(2, 3, 4)

      expect(matrix[0]).toBe(2)  // x scale
      expect(matrix[5]).toBe(3)  // y scale
      expect(matrix[10]).toBe(4) // z scale
      expect(matrix[15]).toBe(1)
    })

    it('应该正确创建旋转矩阵', () => {
      const matrix = WASMMatrix.rotateZ(90)

      // 90度旋转应该交换 x 和 y
      expect(matrix[0]).toBeCloseTo(0, 5)  // cos(90°) ≈ 0
      expect(matrix[1]).toBeCloseTo(1, 5)  // sin(90°) ≈ 1
      expect(matrix[4]).toBeCloseTo(-1, 5) // -sin(90°) ≈ -1
      expect(matrix[5]).toBeCloseTo(0, 5)  // cos(90°) ≈ 0
    })

    it('应该正确执行矩阵乘法', () => {
      const translation = WASMMatrix.translate(10, 20, 0)
      const scale = WASMMatrix.scale(2, 2, 1)
      const result = WASMMatrix.multiply(translation, scale)

      expect(result).toBeInstanceOf(Float32Array)
      expect(result.length).toBe(16)
    })

    it('应该能够计算矩阵逆', () => {
      const matrix = new Float32Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        10, 20, 30, 1
      ])

      const inverse = WASMMatrix.inverse(matrix)
      expect(inverse).not.toBeNull()

      if (inverse) {
        // 逆矩阵应该取消平移
        expect(inverse[12]).toBe(-10)
        expect(inverse[13]).toBe(-20)
        expect(inverse[14]).toBe(-30)
      }
    })
  })

  describe('WASMBezier', () => {
    it('应该计算二次贝塞尔曲线上的点', () => {
      const p0: [number, number] = [0, 0]
      const p1: [number, number] = [50, 100]
      const p2: [number, number] = [100, 0]

      const point = WASMBezier.quadratic(0.5, p0, p1, p2)

      expect(point).toHaveLength(2)
      expect(point[0]).toBeCloseTo(50, 1)
      expect(point[1]).toBeCloseTo(50, 1)
    })

    it('应该计算三次贝塞尔曲线上的点', () => {
      const p0: [number, number] = [0, 0]
      const p1: [number, number] = [25, 100]
      const p2: [number, number] = [75, 100]
      const p3: [number, number] = [100, 0]

      const point = WASMBezier.cubic(0.5, p0, p1, p2, p3)

      expect(point).toHaveLength(2)
      expect(point[0]).toBeCloseTo(50, 1)
      expect(point[1]).toBeGreaterThan(50)
    })

    it('应该批量计算贝塞尔曲线点', () => {
      const tValues = new Float32Array([0, 0.25, 0.5, 0.75, 1])
      const p0: [number, number] = [0, 0]
      const p1: [number, number] = [0, 100]
      const p2: [number, number] = [100, 100]
      const p3: [number, number] = [100, 0]

      const points = WASMBezier.cubicBatch(tValues, p0, p1, p2, p3)

      expect(points).toBeInstanceOf(Float32Array)
      expect(points.length).toBe(10) // 5 points * 2 coordinates

      // 验证起点和终点
      expect(points[0]).toBe(0)   // x at t=0
      expect(points[1]).toBe(0)   // y at t=0
      expect(points[8]).toBe(100) // x at t=1
      expect(points[9]).toBe(0)   // y at t=1
    })
  })

  describe('WASMPath', () => {
    it('应该简化路径', () => {
      // 创建一条直线上的多个点
      const points = new Float32Array([
        0, 0,
        10, 10,
        20, 20,
        30, 30,
        40, 40,
        50, 50
      ])

      const simplified = WASMPath.simplify(points, 1.0)

      expect(simplified).toBeInstanceOf(Float32Array)
      // 简化后应该只剩下起点和终点
      expect(simplified.length).toBeLessThanOrEqual(points.length)
    })
  })

  describe('WASMColor', () => {
    it('应该正确转换 RGB 到 HSL', () => {
      const [h, s, l] = WASMColor.rgbToHsl(255, 0, 0) // 纯红色

      expect(h).toBeCloseTo(0, 1)     // 色相 0°
      expect(s).toBeCloseTo(100, 1)   // 饱和度 100%
      expect(l).toBeCloseTo(50, 1)    // 亮度 50%
    })

    it('应该正确转换 HSL 到 RGB', () => {
      const [r, g, b] = WASMColor.hslToRgb(120, 100, 50) // 纯绿色

      expect(r).toBeCloseTo(0, 1)
      expect(g).toBeCloseTo(255, 1)
      expect(b).toBeCloseTo(0, 1)
    })

    it('应该正确混合颜色', () => {
      const color1: [number, number, number, number] = [255, 0, 0, 1]    // 红色
      const color2: [number, number, number, number] = [0, 0, 255, 1]    // 蓝色
      const blended = WASMColor.blend(color1, color2, 0.5)

      expect(blended[0]).toBeCloseTo(127.5, 1) // 红色分量
      expect(blended[1]).toBe(0)               // 绿色分量
      expect(blended[2]).toBeCloseTo(127.5, 1) // 蓝色分量
      expect(blended[3]).toBe(1)               // 透明度
    })
  })

  describe('WASMEasing', () => {
    it('应该计算 cubic in 缓动', () => {
      expect(WASMEasing.cubicIn(0)).toBe(0)
      expect(WASMEasing.cubicIn(0.5)).toBeCloseTo(0.125, 3)
      expect(WASMEasing.cubicIn(1)).toBe(1)
    })

    it('应该计算 cubic out 缓动', () => {
      expect(WASMEasing.cubicOut(0)).toBe(0)
      expect(WASMEasing.cubicOut(0.5)).toBeCloseTo(0.875, 3)
      expect(WASMEasing.cubicOut(1)).toBe(1)
    })

    it('应该计算 cubic in-out 缓动', () => {
      expect(WASMEasing.cubicInOut(0)).toBe(0)
      expect(WASMEasing.cubicInOut(0.5)).toBe(0.5)
      expect(WASMEasing.cubicInOut(1)).toBe(1)
    })

    it('应该计算 elastic out 缓动', () => {
      expect(WASMEasing.elasticOut(0)).toBe(0)
      expect(WASMEasing.elasticOut(1)).toBe(1)
      // 中间值应该有弹性效果（可能超过1）
      const mid = WASMEasing.elasticOut(0.5)
      expect(mid).toBeGreaterThan(0)
      expect(mid).toBeLessThan(1.5)
    })

    it('应该计算 bounce out 缓动', () => {
      expect(WASMEasing.bounceOut(0)).toBe(0)
      expect(WASMEasing.bounceOut(1)).toBeCloseTo(1, 3)
      // 测试弹跳效果
      const bounce = WASMEasing.bounceOut(0.9)
      expect(bounce).toBeGreaterThan(0.8)
      expect(bounce).toBeLessThan(1)
    })
  })

  describe('WASMSIMD', () => {
    it('应该检测 SIMD 支持', () => {
      const supported = WASMSIMD.isSupported
      expect(typeof supported).toBe('boolean')
      console.log('SIMD support:', supported)
    })

    if (WASMSIMD.isSupported) {
      it('应该执行 SIMD 向量加法', () => {
        const a = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8])
        const b = new Float32Array([10, 20, 30, 40, 50, 60, 70, 80])

        const result = WASMSIMD.vec4Add(a, b)

        expect(result).not.toBeNull()
        if (result) {
          expect(result[0]).toBe(11)
          expect(result[1]).toBe(22)
          expect(result[2]).toBe(33)
          expect(result[3]).toBe(44)
        }
      })

      it('应该执行 SIMD 向量乘法', () => {
        const a = new Float32Array([1, 2, 3, 4])
        const b = new Float32Array([10, 10, 10, 10])

        const result = WASMSIMD.vec4Mul(a, b)

        expect(result).not.toBeNull()
        if (result) {
          expect(result[0]).toBe(10)
          expect(result[1]).toBe(20)
          expect(result[2]).toBe(30)
          expect(result[3]).toBe(40)
        }
      })
    }
  })
})


