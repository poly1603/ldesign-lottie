/**
 * Lottie Core WASM Module
 * 高性能计算核心，用于路径插值、矩阵变换和颜色计算
 */

#include <emscripten.h>
#include <math.h>
#include <stdlib.h>
#include <string.h>

// 导出函数声明
#define WASM_EXPORT EMSCRIPTEN_KEEPALIVE

// 数学常量
#define PI 3.14159265358979323846
#define DEG_TO_RAD (PI / 180.0)
#define RAD_TO_DEG (180.0 / PI)

// ============================================================================
// 矩阵操作
// ============================================================================

/**
 * 4x4 矩阵乘法
 */
WASM_EXPORT void matrix4_multiply(float* out, const float* a, const float* b) {
    float temp[16];
    
    for (int i = 0; i < 4; i++) {
        for (int j = 0; j < 4; j++) {
            float sum = 0;
            for (int k = 0; k < 4; k++) {
                sum += a[i * 4 + k] * b[k * 4 + j];
            }
            temp[i * 4 + j] = sum;
        }
    }
    
    memcpy(out, temp, sizeof(float) * 16);
}

/**
 * 创建平移矩阵
 */
WASM_EXPORT void matrix4_translate(float* out, float x, float y, float z) {
    out[0] = 1; out[4] = 0; out[8]  = 0; out[12] = x;
    out[1] = 0; out[5] = 1; out[9]  = 0; out[13] = y;
    out[2] = 0; out[6] = 0; out[10] = 1; out[14] = z;
    out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
}

/**
 * 创建缩放矩阵
 */
WASM_EXPORT void matrix4_scale(float* out, float x, float y, float z) {
    out[0] = x; out[4] = 0; out[8]  = 0; out[12] = 0;
    out[1] = 0; out[5] = y; out[9]  = 0; out[13] = 0;
    out[2] = 0; out[6] = 0; out[10] = z; out[14] = 0;
    out[3] = 0; out[7] = 0; out[11] = 0; out[15] = 1;
}

/**
 * 创建旋转矩阵（绕 Z 轴）
 */
WASM_EXPORT void matrix4_rotate_z(float* out, float angle) {
    float rad = angle * DEG_TO_RAD;
    float c = cos(rad);
    float s = sin(rad);
    
    out[0] = c; out[4] = -s; out[8]  = 0; out[12] = 0;
    out[1] = s; out[5] = c;  out[9]  = 0; out[13] = 0;
    out[2] = 0; out[6] = 0;  out[10] = 1; out[14] = 0;
    out[3] = 0; out[7] = 0;  out[11] = 0; out[15] = 1;
}

/**
 * 矩阵求逆
 */
WASM_EXPORT int matrix4_inverse(float* out, const float* m) {
    float inv[16], det;
    int i;

    inv[0] = m[5]  * m[10] * m[15] - 
             m[5]  * m[11] * m[14] - 
             m[9]  * m[6]  * m[15] + 
             m[9]  * m[7]  * m[14] +
             m[13] * m[6]  * m[11] - 
             m[13] * m[7]  * m[10];

    inv[4] = -m[4]  * m[10] * m[15] + 
              m[4]  * m[11] * m[14] + 
              m[8]  * m[6]  * m[15] - 
              m[8]  * m[7]  * m[14] - 
              m[12] * m[6]  * m[11] + 
              m[12] * m[7]  * m[10];

    inv[8] = m[4]  * m[9] * m[15] - 
             m[4]  * m[11] * m[13] - 
             m[8]  * m[5] * m[15] + 
             m[8]  * m[7] * m[13] + 
             m[12] * m[5] * m[11] - 
             m[12] * m[7] * m[9];

    inv[12] = -m[4]  * m[9] * m[14] + 
               m[4]  * m[10] * m[13] +
               m[8]  * m[5] * m[14] - 
               m[8]  * m[6] * m[13] - 
               m[12] * m[5] * m[10] + 
               m[12] * m[6] * m[9];

    det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];

    if (det == 0)
        return 0;

    det = 1.0 / det;

    for (i = 0; i < 16; i++)
        out[i] = inv[i] * det;

    return 1;
}

// ============================================================================
// 贝塞尔曲线计算
// ============================================================================

/**
 * 二次贝塞尔曲线插值
 */
WASM_EXPORT void bezier2_point(float* out, float t, 
                               float x0, float y0, 
                               float x1, float y1, 
                               float x2, float y2) {
    float t1 = 1 - t;
    float t1_2 = t1 * t1;
    float t_2 = t * t;
    
    out[0] = t1_2 * x0 + 2 * t1 * t * x1 + t_2 * x2;
    out[1] = t1_2 * y0 + 2 * t1 * t * y1 + t_2 * y2;
}

/**
 * 三次贝塞尔曲线插值
 */
WASM_EXPORT void bezier3_point(float* out, float t,
                               float x0, float y0,
                               float x1, float y1,
                               float x2, float y2,
                               float x3, float y3) {
    float t1 = 1 - t;
    float t1_3 = t1 * t1 * t1;
    float t1_2 = t1 * t1;
    float t_2 = t * t;
    float t_3 = t * t * t;
    
    out[0] = t1_3 * x0 + 3 * t1_2 * t * x1 + 3 * t1 * t_2 * x2 + t_3 * x3;
    out[1] = t1_3 * y0 + 3 * t1_2 * t * y1 + 3 * t1 * t_2 * y2 + t_3 * y3;
}

/**
 * 批量计算贝塞尔曲线点
 */
WASM_EXPORT void bezier3_batch(float* out, int count, float* t_values,
                               float x0, float y0,
                               float x1, float y1,
                               float x2, float y2,
                               float x3, float y3) {
    for (int i = 0; i < count; i++) {
        bezier3_point(&out[i * 2], t_values[i], x0, y0, x1, y1, x2, y2, x3, y3);
    }
}

// ============================================================================
// 路径插值和简化
// ============================================================================

/**
 * Douglas-Peucker 路径简化算法
 */
WASM_EXPORT int simplify_path(float* out, const float* points, int count, float tolerance) {
    if (count < 3) {
        memcpy(out, points, count * 2 * sizeof(float));
        return count;
    }
    
    // 找到距离最远的点
    float maxDist = 0;
    int maxIndex = 0;
    
    float x1 = points[0];
    float y1 = points[1];
    float x2 = points[(count - 1) * 2];
    float y2 = points[(count - 1) * 2 + 1];
    
    for (int i = 1; i < count - 1; i++) {
        float x = points[i * 2];
        float y = points[i * 2 + 1];
        
        // 计算点到线段的距离
        float A = x - x1;
        float B = y - y1;
        float C = x2 - x1;
        float D = y2 - y1;
        
        float dot = A * C + B * D;
        float len_sq = C * C + D * D;
        float param = -1;
        
        if (len_sq != 0) {
            param = dot / len_sq;
        }
        
        float xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        float dx = x - xx;
        float dy = y - yy;
        float dist = sqrt(dx * dx + dy * dy);
        
        if (dist > maxDist) {
            maxDist = dist;
            maxIndex = i;
        }
    }
    
    // 如果最大距离大于容差，递归简化
    if (maxDist > tolerance) {
        float temp1[count * 2];
        float temp2[count * 2];
        
        int count1 = simplify_path(temp1, points, maxIndex + 1, tolerance);
        int count2 = simplify_path(temp2, &points[maxIndex * 2], count - maxIndex, tolerance);
        
        memcpy(out, temp1, (count1 - 1) * 2 * sizeof(float));
        memcpy(&out[(count1 - 1) * 2], temp2, count2 * 2 * sizeof(float));
        
        return count1 + count2 - 1;
    } else {
        // 只保留起点和终点
        out[0] = x1;
        out[1] = y1;
        out[2] = x2;
        out[3] = y2;
        return 2;
    }
}

// ============================================================================
// 颜色操作
// ============================================================================

/**
 * RGB 到 HSL 转换
 */
WASM_EXPORT void rgb_to_hsl(float* out, float r, float g, float b) {
    r /= 255.0;
    g /= 255.0;
    b /= 255.0;
    
    float max = fmax(fmax(r, g), b);
    float min = fmin(fmin(r, g), b);
    float h, s, l = (max + min) / 2;
    
    if (max == min) {
        h = s = 0;
    } else {
        float d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        if (max == r) {
            h = (g - b) / d + (g < b ? 6 : 0);
        } else if (max == g) {
            h = (b - r) / d + 2;
        } else {
            h = (r - g) / d + 4;
        }
        
        h /= 6;
    }
    
    out[0] = h * 360;
    out[1] = s * 100;
    out[2] = l * 100;
}

/**
 * HSL 到 RGB 转换
 */
WASM_EXPORT void hsl_to_rgb(float* out, float h, float s, float l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    float r, g, b;
    
    if (s == 0) {
        r = g = b = l;
    } else {
        float hue2rgb(float p, float q, float t) {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1.0/6.0) return p + (q - p) * 6 * t;
            if (t < 1.0/2.0) return q;
            if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6;
            return p;
        }
        
        float q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        float p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1.0/3.0);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1.0/3.0);
    }
    
    out[0] = r * 255;
    out[1] = g * 255;
    out[2] = b * 255;
}

/**
 * 颜色混合
 */
WASM_EXPORT void color_blend(float* out, 
                             float r1, float g1, float b1, float a1,
                             float r2, float g2, float b2, float a2,
                             float factor) {
    float f1 = 1 - factor;
    out[0] = r1 * f1 + r2 * factor;
    out[1] = g1 * f1 + g2 * factor;
    out[2] = b1 * f1 + b2 * factor;
    out[3] = a1 * f1 + a2 * factor;
}

// ============================================================================
// 缓动函数
// ============================================================================

/**
 * 缓动函数计算
 */
WASM_EXPORT float easing_cubic_in(float t) {
    return t * t * t;
}

WASM_EXPORT float easing_cubic_out(float t) {
    return 1 - pow(1 - t, 3);
}

WASM_EXPORT float easing_cubic_in_out(float t) {
    return t < 0.5 ? 4 * t * t * t : 1 - pow(-2 * t + 2, 3) / 2;
}

WASM_EXPORT float easing_elastic_out(float t) {
    if (t == 0) return 0;
    if (t == 1) return 1;
    return pow(2, -10 * t) * sin((t * 10 - 0.75) * 2 * PI / 3) + 1;
}

WASM_EXPORT float easing_bounce_out(float t) {
    if (t < 1 / 2.75) {
        return 7.5625 * t * t;
    } else if (t < 2 / 2.75) {
        t -= 1.5 / 2.75;
        return 7.5625 * t * t + 0.75;
    } else if (t < 2.5 / 2.75) {
        t -= 2.25 / 2.75;
        return 7.5625 * t * t + 0.9375;
    } else {
        t -= 2.625 / 2.75;
        return 7.5625 * t * t + 0.984375;
    }
}

// ============================================================================
// SIMD 优化（如果支持）
// ============================================================================

#ifdef __EMSCRIPTEN_SIMD__
#include <wasm_simd128.h>

/**
 * SIMD 优化的向量加法
 */
WASM_EXPORT void simd_vec4_add(float* out, const float* a, const float* b, int count) {
    for (int i = 0; i < count; i += 4) {
        v128_t va = wasm_v128_load(&a[i]);
        v128_t vb = wasm_v128_load(&b[i]);
        v128_t result = wasm_f32x4_add(va, vb);
        wasm_v128_store(&out[i], result);
    }
}

/**
 * SIMD 优化的向量乘法
 */
WASM_EXPORT void simd_vec4_mul(float* out, const float* a, const float* b, int count) {
    for (int i = 0; i < count; i += 4) {
        v128_t va = wasm_v128_load(&a[i]);
        v128_t vb = wasm_v128_load(&b[i]);
        v128_t result = wasm_f32x4_mul(va, vb);
        wasm_v128_store(&out[i], result);
    }
}

/**
 * SIMD 优化的矩阵向量乘法
 */
WASM_EXPORT void simd_matrix4_vec4_mul(float* out, const float* m, const float* v) {
    v128_t vec = wasm_v128_load(v);
    
    v128_t row0 = wasm_v128_load(&m[0]);
    v128_t row1 = wasm_v128_load(&m[4]);
    v128_t row2 = wasm_v128_load(&m[8]);
    v128_t row3 = wasm_v128_load(&m[12]);
    
    v128_t result = wasm_f32x4_mul(row0, wasm_f32x4_splat(v[0]));
    result = wasm_f32x4_add(result, wasm_f32x4_mul(row1, wasm_f32x4_splat(v[1])));
    result = wasm_f32x4_add(result, wasm_f32x4_mul(row2, wasm_f32x4_splat(v[2])));
    result = wasm_f32x4_add(result, wasm_f32x4_mul(row3, wasm_f32x4_splat(v[3])));
    
    wasm_v128_store(out, result);
}

#endif

// ============================================================================
// 内存管理
// ============================================================================

/**
 * 分配内存
 */
WASM_EXPORT void* wasm_malloc(int size) {
    return malloc(size);
}

/**
 * 释放内存
 */
WASM_EXPORT void wasm_free(void* ptr) {
    free(ptr);
}

/**
 * 获取版本信息
 */
WASM_EXPORT int get_version() {
    return 100; // 1.0.0
}



