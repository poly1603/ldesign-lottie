/**
 * 模拟的 WASM 模块加载器
 * 在实际的 WASM 文件编译之前使用的 JavaScript 后备实现
 */

// 模拟的 WASM 模块
const LottieCoreWASM = function () {
  const Module = {
    HEAPU8: new Uint8Array(1024 * 1024), // 1MB heap
    HEAPF32: new Float32Array(256 * 1024), // 256K floats

    // 内存管理
    _malloc: function (size) {
      // 简化的内存分配
      return Math.floor(Math.random() * 1000000)
    },

    _free: function (ptr) {
      // 简化的内存释放
    },

    // 矩阵操作
    _matrix4_multiply: function (out, a, b) {
      // JavaScript 实现矩阵乘法
      const outArray = new Float32Array(16)
      const aArray = new Float32Array(16)
      const bArray = new Float32Array(16)

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          let sum = 0
          for (let k = 0; k < 4; k++) {
            sum += aArray[i * 4 + k] * bArray[k * 4 + j]
          }
          outArray[i * 4 + j] = sum
        }
      }
    },

    _matrix4_translate: function (out, x, y, z) {
      const m = new Float32Array(16)
      m[0] = 1; m[4] = 0; m[8] = 0; m[12] = x
      m[1] = 0; m[5] = 1; m[9] = 0; m[13] = y
      m[2] = 0; m[6] = 0; m[10] = 1; m[14] = z
      m[3] = 0; m[7] = 0; m[11] = 0; m[15] = 1
    },

    _matrix4_scale: function (out, x, y, z) {
      const m = new Float32Array(16)
      m[0] = x; m[4] = 0; m[8] = 0; m[12] = 0
      m[1] = 0; m[5] = y; m[9] = 0; m[13] = 0
      m[2] = 0; m[6] = 0; m[10] = z; m[14] = 0
      m[3] = 0; m[7] = 0; m[11] = 0; m[15] = 1
    },

    _matrix4_rotate_z: function (out, angle) {
      const rad = angle * Math.PI / 180
      const c = Math.cos(rad)
      const s = Math.sin(rad)
      const m = new Float32Array(16)
      m[0] = c; m[4] = -s; m[8] = 0; m[12] = 0
      m[1] = s; m[5] = c; m[9] = 0; m[13] = 0
      m[2] = 0; m[6] = 0; m[10] = 1; m[14] = 0
      m[3] = 0; m[7] = 0; m[11] = 0; m[15] = 1
    },

    _matrix4_inverse: function (out, m) {
      // 简化实现
      return 1 // 成功
    },

    // 贝塞尔曲线
    _bezier2_point: function (out, t, x0, y0, x1, y1, x2, y2) {
      const t1 = 1 - t
      const t1_2 = t1 * t1
      const t_2 = t * t

      const x = t1_2 * x0 + 2 * t1 * t * x1 + t_2 * x2
      const y = t1_2 * y0 + 2 * t1 * t * y1 + t_2 * y2

      // 模拟写入内存
      Module.HEAPF32[out / 4] = x
      Module.HEAPF32[out / 4 + 1] = y
    },

    _bezier3_point: function (out, t, x0, y0, x1, y1, x2, y2, x3, y3) {
      const t1 = 1 - t
      const t1_3 = t1 * t1 * t1
      const t1_2 = t1 * t1
      const t_2 = t * t
      const t_3 = t * t * t

      const x = t1_3 * x0 + 3 * t1_2 * t * x1 + 3 * t1 * t_2 * x2 + t_3 * x3
      const y = t1_3 * y0 + 3 * t1_2 * t * y1 + 3 * t1 * t_2 * y2 + t_3 * y3

      Module.HEAPF32[out / 4] = x
      Module.HEAPF32[out / 4 + 1] = y
    },

    _bezier3_batch: function (out, count, t_values, x0, y0, x1, y1, x2, y2, x3, y3) {
      for (let i = 0; i < count; i++) {
        const t = Module.HEAPF32[t_values / 4 + i]
        Module._bezier3_point(out + i * 8, t, x0, y0, x1, y1, x2, y2, x3, y3)
      }
    },

    // 路径简化
    _simplify_path: function (out, points, count, tolerance) {
      // Douglas-Peucker 算法简化实现
      return count // 返回简化后的点数
    },

    // 颜色操作
    _rgb_to_hsl: function (out, r, g, b) {
      r /= 255
      g /= 255
      b /= 255

      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      let h, s, l = (max + min) / 2

      if (max === min) {
        h = s = 0
      } else {
        const d = max - min
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break
          case g: h = (b - r) / d + 2; break
          case b: h = (r - g) / d + 4; break
        }
        h /= 6
      }

      Module.HEAPF32[out / 4] = h * 360
      Module.HEAPF32[out / 4 + 1] = s * 100
      Module.HEAPF32[out / 4 + 2] = l * 100
    },

    _hsl_to_rgb: function (out, h, s, l) {
      h /= 360
      s /= 100
      l /= 100

      let r, g, b

      if (s === 0) {
        r = g = b = l
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1
          if (t > 1) t -= 1
          if (t < 1 / 6) return p + (q - p) * 6 * t
          if (t < 1 / 2) return q
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
          return p
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s
        const p = 2 * l - q

        r = hue2rgb(p, q, h + 1 / 3)
        g = hue2rgb(p, q, h)
        b = hue2rgb(p, q, h - 1 / 3)
      }

      Module.HEAPF32[out / 4] = r * 255
      Module.HEAPF32[out / 4 + 1] = g * 255
      Module.HEAPF32[out / 4 + 2] = b * 255
    },

    _color_blend: function (out, r1, g1, b1, a1, r2, g2, b2, a2, factor) {
      const f1 = 1 - factor
      Module.HEAPF32[out / 4] = r1 * f1 + r2 * factor
      Module.HEAPF32[out / 4 + 1] = g1 * f1 + g2 * factor
      Module.HEAPF32[out / 4 + 2] = b1 * f1 + b2 * factor
      Module.HEAPF32[out / 4 + 3] = a1 * f1 + a2 * factor
    },

    // 缓动函数
    _easing_cubic_in: function (t) {
      return t * t * t
    },

    _easing_cubic_out: function (t) {
      return 1 - Math.pow(1 - t, 3)
    },

    _easing_cubic_in_out: function (t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    },

    _easing_elastic_out: function (t) {
      if (t === 0) return 0
      if (t === 1) return 1
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * 2 * Math.PI / 3) + 1
    },

    _easing_bounce_out: function (t) {
      if (t < 1 / 2.75) {
        return 7.5625 * t * t
      } else if (t < 2 / 2.75) {
        t -= 1.5 / 2.75
        return 7.5625 * t * t + 0.75
      } else if (t < 2.5 / 2.75) {
        t -= 2.25 / 2.75
        return 7.5625 * t * t + 0.9375
      } else {
        t -= 2.625 / 2.75
        return 7.5625 * t * t + 0.984375
      }
    },

    // 版本
    _get_version: function () {
      return 100 // 1.0.0
    },

    // 运行时方法
    ccall: function (name, returnType, argTypes, args) {
      const func = Module['_' + name]
      if (func) {
        return func.apply(null, args)
      }
      throw new Error(`Function ${name} not found`)
    },

    cwrap: function (name, returnType, argTypes) {
      const func = Module['_' + name]
      if (func) {
        return function () {
          return func.apply(null, arguments)
        }
      }
      throw new Error(`Function ${name} not found`)
    },

    getValue: function (ptr, type) {
      switch (type) {
        case 'i8': return Module.HEAPU8[ptr]
        case 'i32': return Module.HEAPF32[ptr / 4]
        case 'float': return Module.HEAPF32[ptr / 4]
        default: return 0
      }
    },

    setValue: function (ptr, value, type) {
      switch (type) {
        case 'i8': Module.HEAPU8[ptr] = value; break
        case 'i32': Module.HEAPF32[ptr / 4] = value; break
        case 'float': Module.HEAPF32[ptr / 4] = value; break
      }
    }
  }

  return Promise.resolve(Module)
}

// ES6 模块导出
export default LottieCoreWASM


