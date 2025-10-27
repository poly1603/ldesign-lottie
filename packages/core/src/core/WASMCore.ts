/**
 * WebAssembly 核心加速模块
 * 提供高性能的计算加速功能
 */

import LottieCoreModule from '../wasm/lottie-core.js'
import type { LottieCoreWASMModule } from '../wasm/lottie-core'

let wasmModule: LottieCoreWASMModule | null = null
let isInitialized = false
let initPromise: Promise<void> | null = null

/**
 * 初始化 WebAssembly 模块
 */
export async function initWASM(): Promise<void> {
  if (isInitialized) return
  if (initPromise) return initPromise

  initPromise = (async () => {
    try {
      console.log('[WASMCore] Initializing WebAssembly module...')
      wasmModule = await LottieCoreModule()
      isInitialized = true
      console.log('[WASMCore] WebAssembly module initialized successfully')
    } catch (error) {
      console.error('[WASMCore] Failed to initialize WebAssembly:', error)
      throw error
    }
  })()

  return initPromise
}

/**
 * 获取 WASM 模块
 */
function getModule(): LottieCoreWASMModule {
  if (!wasmModule) {
    throw new Error('WASM module not initialized. Call initWASM() first.')
  }
  return wasmModule
}

/**
 * 矩阵运算
 */
export const WASMMatrix = {
  /**
   * 创建平移矩阵
   */
  translate(x: number, y: number, z: number): Float32Array {
    const matrix = new Float32Array(16)
    // 单位矩阵
    matrix[0] = 1; matrix[4] = 0; matrix[8] = 0; matrix[12] = x
    matrix[1] = 0; matrix[5] = 1; matrix[9] = 0; matrix[13] = y
    matrix[2] = 0; matrix[6] = 0; matrix[10] = 1; matrix[14] = z
    matrix[3] = 0; matrix[7] = 0; matrix[11] = 0; matrix[15] = 1
    return matrix
  },

  /**
   * 创建缩放矩阵
   */
  scale(x: number, y: number, z: number): Float32Array {
    const matrix = new Float32Array(16)
    matrix[0] = x; matrix[4] = 0; matrix[8] = 0; matrix[12] = 0
    matrix[1] = 0; matrix[5] = y; matrix[9] = 0; matrix[13] = 0
    matrix[2] = 0; matrix[6] = 0; matrix[10] = z; matrix[14] = 0
    matrix[3] = 0; matrix[7] = 0; matrix[11] = 0; matrix[15] = 1
    return matrix
  },

  /**
   * 创建 Z 轴旋转矩阵
   */
  rotateZ(angle: number): Float32Array {
    const module = getModule()
    const ptr = module._malloc(16 * 4)
    module._matrix4_rotate_z(ptr, angle)

    const result = new Float32Array(16)
    for (let i = 0; i < 16; i++) {
      result[i] = module.HEAPF32[(ptr / 4) + i]
    }

    module._free(ptr)
    return result
  },

  /**
   * 矩阵乘法
   */
  multiply(a: Float32Array, b: Float32Array): Float32Array {
    const module = getModule()
    const aPtr = module._malloc(16 * 4)
    const bPtr = module._malloc(16 * 4)
    const outPtr = module._malloc(16 * 4)

    // 复制数据到 WASM 内存
    for (let i = 0; i < 16; i++) {
      module.HEAPF32[(aPtr / 4) + i] = a[i]
      module.HEAPF32[(bPtr / 4) + i] = b[i]
    }

    module._matrix4_multiply(outPtr, aPtr, bPtr)

    const result = new Float32Array(16)
    for (let i = 0; i < 16; i++) {
      result[i] = module.HEAPF32[(outPtr / 4) + i]
    }

    module._free(aPtr)
    module._free(bPtr)
    module._free(outPtr)

    return result
  },

  /**
   * 矩阵求逆
   */
  inverse(m: Float32Array): Float32Array | null {
    const module = getModule()
    const mPtr = module._malloc(16 * 4)
    const outPtr = module._malloc(16 * 4)

    for (let i = 0; i < 16; i++) {
      module.HEAPF32[(mPtr / 4) + i] = m[i]
    }

    const success = module._matrix4_inverse(outPtr, mPtr)

    if (!success) {
      module._free(mPtr)
      module._free(outPtr)
      return null
    }

    const result = new Float32Array(16)
    for (let i = 0; i < 16; i++) {
      result[i] = module.HEAPF32[(outPtr / 4) + i]
    }

    module._free(mPtr)
    module._free(outPtr)

    return result
  }
}

/**
 * 贝塞尔曲线计算
 */
export const WASMBezier = {
  /**
   * 二次贝塞尔曲线
   */
  quadratic(t: number, p0: [number, number], p1: [number, number], p2: [number, number]): [number, number] {
    const module = getModule()
    const outPtr = module._malloc(2 * 8)

    module._bezier2_point(outPtr, t, p0[0], p0[1], p1[0], p1[1], p2[0], p2[1])

    const result: [number, number] = [
      module.HEAPF32[outPtr / 4],
      module.HEAPF32[(outPtr / 4) + 1]
    ]

    module._free(outPtr)
    return result
  },

  /**
   * 三次贝塞尔曲线
   */
  cubic(t: number, p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number]): [number, number] {
    const module = getModule()
    const outPtr = module._malloc(2 * 8)

    module._bezier3_point(outPtr, t, p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1])

    const result: [number, number] = [
      module.HEAPF32[outPtr / 4],
      module.HEAPF32[(outPtr / 4) + 1]
    ]

    module._free(outPtr)
    return result
  },

  /**
   * 批量计算三次贝塞尔曲线点
   */
  cubicBatch(tValues: Float32Array, p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number]): Float32Array {
    const module = getModule()
    const count = tValues.length
    const tPtr = module._malloc(count * 4)
    const outPtr = module._malloc(count * 2 * 4)

    // 复制 t 值
    for (let i = 0; i < count; i++) {
      module.HEAPF32[(tPtr / 4) + i] = tValues[i]
    }

    module._bezier3_batch(outPtr, count, tPtr, p0[0], p0[1], p1[0], p1[1], p2[0], p2[1], p3[0], p3[1])

    const result = new Float32Array(count * 2)
    for (let i = 0; i < count * 2; i++) {
      result[i] = module.HEAPF32[(outPtr / 4) + i]
    }

    module._free(tPtr)
    module._free(outPtr)

    return result
  }
}

/**
 * 路径简化
 */
export const WASMPath = {
  /**
   * Douglas-Peucker 路径简化算法
   */
  simplify(points: Float32Array, tolerance: number): Float32Array {
    const module = getModule()
    const count = points.length / 2
    const inPtr = module._malloc(points.length * 4)
    const outPtr = module._malloc(points.length * 4)

    // 复制输入数据
    for (let i = 0; i < points.length; i++) {
      module.HEAPF32[(inPtr / 4) + i] = points[i]
    }

    const simplifiedCount = module._simplify_path(outPtr, inPtr, count, tolerance)

    const result = new Float32Array(simplifiedCount * 2)
    for (let i = 0; i < simplifiedCount * 2; i++) {
      result[i] = module.HEAPF32[(outPtr / 4) + i]
    }

    module._free(inPtr)
    module._free(outPtr)

    return result
  }
}

/**
 * 颜色操作
 */
export const WASMColor = {
  /**
   * RGB 转 HSL
   */
  rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    const module = getModule()
    const outPtr = module._malloc(3 * 4)

    module._rgb_to_hsl(outPtr, r, g, b)

    const result: [number, number, number] = [
      module.HEAPF32[outPtr / 4],
      module.HEAPF32[(outPtr / 4) + 1],
      module.HEAPF32[(outPtr / 4) + 2]
    ]

    module._free(outPtr)
    return result
  },

  /**
   * HSL 转 RGB
   */
  hslToRgb(h: number, s: number, l: number): [number, number, number] {
    const module = getModule()
    const outPtr = module._malloc(3 * 4)

    module._hsl_to_rgb(outPtr, h, s, l)

    const result: [number, number, number] = [
      module.HEAPF32[outPtr / 4],
      module.HEAPF32[(outPtr / 4) + 1],
      module.HEAPF32[(outPtr / 4) + 2]
    ]

    module._free(outPtr)
    return result
  },

  /**
   * 颜色混合
   */
  blend(color1: [number, number, number, number], color2: [number, number, number, number], factor: number): [number, number, number, number] {
    const module = getModule()
    const outPtr = module._malloc(4 * 4)

    module._color_blend(
      outPtr,
      color1[0], color1[1], color1[2], color1[3],
      color2[0], color2[1], color2[2], color2[3],
      factor
    )

    const result: [number, number, number, number] = [
      module.HEAPF32[outPtr / 4],
      module.HEAPF32[(outPtr / 4) + 1],
      module.HEAPF32[(outPtr / 4) + 2],
      module.HEAPF32[(outPtr / 4) + 3]
    ]

    module._free(outPtr)
    return result
  }
}

/**
 * 缓动函数
 */
export const WASMEasing = {
  cubicIn: (t: number): number => getModule()._easing_cubic_in(t),
  cubicOut: (t: number): number => getModule()._easing_cubic_out(t),
  cubicInOut: (t: number): number => getModule()._easing_cubic_in_out(t),
  elasticOut: (t: number): number => getModule()._easing_elastic_out(t),
  bounceOut: (t: number): number => getModule()._easing_bounce_out(t)
}

/**
 * SIMD 优化（如果支持）
 */
export const WASMSIMD = {
  get isSupported(): boolean {
    try {
      // 检测 WebAssembly SIMD 支持
      return WebAssembly.validate(new Uint8Array([
        0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x60, 0x00, 0x01, 0x7b, 0x03,
        0x02, 0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00,
        0x41, 0x00, 0xfd, 0x0f, 0x0b
      ]))
    } catch {
      return false
    }
  },

  /**
   * SIMD 向量加法
   */
  vec4Add(a: Float32Array, b: Float32Array): Float32Array | null {
    const module = getModule()
    if (!module._simd_vec4_add) return null

    const count = Math.min(a.length, b.length)
    const aPtr = module._malloc(count * 4)
    const bPtr = module._malloc(count * 4)
    const outPtr = module._malloc(count * 4)

    // 复制数据
    for (let i = 0; i < count; i++) {
      module.HEAPF32[(aPtr / 4) + i] = a[i]
      module.HEAPF32[(bPtr / 4) + i] = b[i]
    }

    module._simd_vec4_add(outPtr, aPtr, bPtr, count)

    const result = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      result[i] = module.HEAPF32[(outPtr / 4) + i]
    }

    module._free(aPtr)
    module._free(bPtr)
    module._free(outPtr)

    return result
  },

  /**
   * SIMD 向量乘法
   */
  vec4Mul(a: Float32Array, b: Float32Array): Float32Array | null {
    const module = getModule()
    if (!module._simd_vec4_mul) return null

    const count = Math.min(a.length, b.length)
    const aPtr = module._malloc(count * 4)
    const bPtr = module._malloc(count * 4)
    const outPtr = module._malloc(count * 4)

    for (let i = 0; i < count; i++) {
      module.HEAPF32[(aPtr / 4) + i] = a[i]
      module.HEAPF32[(bPtr / 4) + i] = b[i]
    }

    module._simd_vec4_mul(outPtr, aPtr, bPtr, count)

    const result = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      result[i] = module.HEAPF32[(outPtr / 4) + i]
    }

    module._free(aPtr)
    module._free(bPtr)
    module._free(outPtr)

    return result
  }
}

/**
 * WASM 核心模块导出
 */
export const WASMCore = {
  init: initWASM,
  isInitialized: () => isInitialized,
  getModule: () => getModule(),
  Matrix: WASMMatrix,
  Bezier: WASMBezier,
  Path: WASMPath,
  Color: WASMColor,
  Easing: WASMEasing,
  SIMD: WASMSIMD
}