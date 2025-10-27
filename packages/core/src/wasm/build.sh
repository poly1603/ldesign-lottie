#!/bin/bash

# WebAssembly 编译脚本
# 需要先安装 Emscripten: https://emscripten.org/docs/getting_started/downloads.html

echo "Building Lottie Core WASM module..."

# 编译选项
OPTIMIZE="-O3"
EXPORTS="['_malloc', '_free']"
EXTRA_EXPORTED_RUNTIME_METHODS="['ccall', 'cwrap', 'getValue', 'setValue']"

# SIMD 支持检测
if [[ "$1" == "--simd" ]]; then
    echo "Building with SIMD support..."
    SIMD_FLAGS="-msimd128"
else
    SIMD_FLAGS=""
fi

# 编译命令
emcc lottie-core.c \
    -o lottie-core.js \
    $OPTIMIZE \
    $SIMD_FLAGS \
    -s WASM=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME="LottieCoreWASM" \
    -s EXPORTED_FUNCTIONS="$EXPORTS" \
    -s EXTRA_EXPORTED_RUNTIME_METHODS="$EXTRA_EXPORTED_RUNTIME_METHODS" \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s SINGLE_FILE=0 \
    -s ENVIRONMENT='web,worker' \
    --no-entry

# 生成 TypeScript 声明文件
echo "Generating TypeScript declarations..."
cat > lottie-core.d.ts << EOF
export interface LottieCoreWASMModule {
  // 内存管理
  _malloc(size: number): number;
  _free(ptr: number): void;
  
  // 矩阵操作
  _matrix4_multiply(out: number, a: number, b: number): void;
  _matrix4_translate(out: number, x: number, y: number, z: number): void;
  _matrix4_scale(out: number, x: number, y: number, z: number): void;
  _matrix4_rotate_z(out: number, angle: number): void;
  _matrix4_inverse(out: number, m: number): number;
  
  // 贝塞尔曲线
  _bezier2_point(out: number, t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number): void;
  _bezier3_point(out: number, t: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
  _bezier3_batch(out: number, count: number, t_values: number, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number): void;
  
  // 路径简化
  _simplify_path(out: number, points: number, count: number, tolerance: number): number;
  
  // 颜色操作
  _rgb_to_hsl(out: number, r: number, g: number, b: number): void;
  _hsl_to_rgb(out: number, h: number, s: number, l: number): void;
  _color_blend(out: number, r1: number, g1: number, b1: number, a1: number, r2: number, g2: number, b2: number, a2: number, factor: number): void;
  
  // 缓动函数
  _easing_cubic_in(t: number): number;
  _easing_cubic_out(t: number): number;
  _easing_cubic_in_out(t: number): number;
  _easing_elastic_out(t: number): number;
  _easing_bounce_out(t: number): number;
  
  // SIMD 优化（如果可用）
  _simd_vec4_add?(out: number, a: number, b: number, count: number): void;
  _simd_vec4_mul?(out: number, a: number, b: number, count: number): void;
  _simd_matrix4_vec4_mul?(out: number, m: number, v: number): void;
  
  // 版本
  _get_version(): number;
  
  // 运行时方法
  HEAPU8: Uint8Array;
  HEAPF32: Float32Array;
  
  ccall<T>(name: string, returnType: string | null, argTypes: string[], args: any[]): T;
  cwrap<T>(name: string, returnType: string | null, argTypes: string[]): T;
  getValue(ptr: number, type: string): number;
  setValue(ptr: number, value: number, type: string): void;
}

export default function(): Promise<LottieCoreWASMModule>;
EOF

echo "Build complete!"
echo "Generated files:"
echo "  - lottie-core.js"
echo "  - lottie-core.wasm"
echo "  - lottie-core.d.ts"


