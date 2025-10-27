/**
 * WebGL 渲染器
 * 使用 GPU 加速渲染 Lottie 动画
 */

import type { ILottieInstance } from '../types'

export interface WebGLRendererConfig {
  /** 抗锯齿 */
  antialias?: boolean
  /** 透明背景 */
  alpha?: boolean
  /** 深度测试 */
  depth?: boolean
  /** 模板测试 */
  stencil?: boolean
  /** 保留绘制缓冲区 */
  preserveDrawingBuffer?: boolean
  /** 低功耗模式 */
  powerPreference?: 'default' | 'high-performance' | 'low-power'
  /** 失败时是否回退到 Canvas */
  fallbackToCanvas?: boolean
  /** 最大纹理大小 */
  maxTextureSize?: number
  /** 启用纹理缓存 */
  enableTextureCache?: boolean
  /** 启用批量渲染 */
  enableBatching?: boolean
}

export interface WebGLStats {
  drawCalls: number
  triangles: number
  textures: number
  shaders: number
  fps: number
  gpuMemory: number
}

interface Shader {
  vertex: WebGLShader
  fragment: WebGLShader
  program: WebGLProgram
  attributes: Record<string, number>
  uniforms: Record<string, WebGLUniformLocation>
}

interface Texture {
  id: string
  texture: WebGLTexture
  width: number
  height: number
  lastUsed: number
}

interface RenderBatch {
  vertices: Float32Array
  uvs: Float32Array
  colors: Float32Array
  indices: Uint16Array
  texture: WebGLTexture | null
  blendMode: string
  vertexCount: number
  indexCount: number
}

/**
 * WebGL 渲染器类
 */
export class WebGLRenderer {
  private instance: ILottieInstance
  private config: Required<WebGLRendererConfig>
  private canvas: HTMLCanvasElement | null = null
  private gl: WebGL2RenderingContext | WebGLRenderingContext | null = null
  private isWebGL2 = false

  // 着色器
  private shaders = new Map<string, Shader>()
  private currentShader: Shader | null = null

  // 纹理管理
  private textures = new Map<string, Texture>()
  private textureUnit = 0
  private maxTextureUnits = 8

  // 批量渲染
  private batches: RenderBatch[] = []
  private currentBatch: RenderBatch | null = null

  // 缓冲区
  private vertexBuffer: WebGLBuffer | null = null
  private uvBuffer: WebGLBuffer | null = null
  private colorBuffer: WebGLBuffer | null = null
  private indexBuffer: WebGLBuffer | null = null

  // 性能统计
  private stats: WebGLStats = {
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    shaders: 0,
    fps: 0,
    gpuMemory: 0
  }

  private lastFrameTime = 0
  private frameCount = 0

  // 变换矩阵
  private projectionMatrix = new Float32Array(16)
  private modelViewMatrix = new Float32Array(16)
  private matrixStack: Float32Array[] = []

  constructor(instance: ILottieInstance, config?: WebGLRendererConfig) {
    this.instance = instance

    this.config = {
      antialias: config?.antialias ?? true,
      alpha: config?.alpha ?? true,
      depth: config?.depth ?? false,
      stencil: config?.stencil ?? false,
      preserveDrawingBuffer: config?.preserveDrawingBuffer ?? false,
      powerPreference: config?.powerPreference ?? 'high-performance',
      fallbackToCanvas: config?.fallbackToCanvas ?? true,
      maxTextureSize: config?.maxTextureSize ?? 4096,
      enableTextureCache: config?.enableTextureCache ?? true,
      enableBatching: config?.enableBatching ?? true
    }

    this.initWebGL()
  }

  /**
   * 初始化 WebGL
   */
  private initWebGL(): void {
    // 创建 canvas
    this.canvas = document.createElement('canvas')
    this.canvas.style.position = 'absolute'
    this.canvas.style.top = '0'
    this.canvas.style.left = '0'
    this.canvas.style.width = '100%'
    this.canvas.style.height = '100%'
    this.canvas.style.pointerEvents = 'none'

    // 获取 WebGL 上下文
    const contextOptions: WebGLContextAttributes = {
      antialias: this.config.antialias,
      alpha: this.config.alpha,
      depth: this.config.depth,
      stencil: this.config.stencil,
      preserveDrawingBuffer: this.config.preserveDrawingBuffer,
      powerPreference: this.config.powerPreference
    }

    // 尝试 WebGL2
    this.gl = this.canvas.getContext('webgl2', contextOptions) as WebGL2RenderingContext
    if (this.gl) {
      this.isWebGL2 = true
    } else {
      // 回退到 WebGL1
      this.gl = this.canvas.getContext('webgl', contextOptions) ||
        this.canvas.getContext('experimental-webgl', contextOptions)
    }

    if (!this.gl) {
      if (this.config.fallbackToCanvas) {
        console.warn('WebGL not supported, falling back to Canvas renderer')
        // 这里应该切换到 Canvas 渲染器
      } else {
        throw new Error('WebGL not supported')
      }
    }

    // 初始化 WebGL 状态
    this.setupWebGL()

    // 加载默认着色器
    this.loadDefaultShaders()

    // 创建缓冲区
    this.createBuffers()

    // 设置视口
    this.updateViewport()
  }

  /**
   * 设置 WebGL 状态
   */
  private setupWebGL(): void {
    if (!this.gl) return

    const gl = this.gl

    // 启用混合
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // 设置清除颜色
    gl.clearColor(0, 0, 0, 0)

    // 禁用深度测试（2D渲染）
    gl.disable(gl.DEPTH_TEST)

    // 启用剔除背面
    gl.disable(gl.CULL_FACE)

    // 获取最大纹理单元数
    this.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)
  }

  /**
   * 加载默认着色器
   */
  private loadDefaultShaders(): void {
    // 基础着色器
    this.loadShader('basic', {
      vertex: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        attribute vec4 a_color;
        
        uniform mat4 u_projectionMatrix;
        uniform mat4 u_modelViewMatrix;
        
        varying vec2 v_texCoord;
        varying vec4 v_color;
        
        void main() {
          gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
          v_color = a_color;
        }
      `,
      fragment: `
        precision mediump float;
        
        uniform sampler2D u_texture;
        uniform bool u_useTexture;
        
        varying vec2 v_texCoord;
        varying vec4 v_color;
        
        void main() {
          if (u_useTexture) {
            gl_FragColor = texture2D(u_texture, v_texCoord) * v_color;
          } else {
            gl_FragColor = v_color;
          }
        }
      `
    })

    // 高斯模糊着色器
    this.loadShader('blur', {
      vertex: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        
        uniform mat4 u_projectionMatrix;
        uniform mat4 u_modelViewMatrix;
        
        varying vec2 v_texCoord;
        
        void main() {
          gl_Position = u_projectionMatrix * u_modelViewMatrix * vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragment: `
        precision mediump float;
        
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        uniform float u_radius;
        
        varying vec2 v_texCoord;
        
        void main() {
          vec4 color = vec4(0.0);
          float total = 0.0;
          
          for (float x = -4.0; x <= 4.0; x++) {
            for (float y = -4.0; y <= 4.0; y++) {
              vec2 offset = vec2(x, y) * u_radius / u_resolution;
              float weight = exp(-(x*x + y*y) / (2.0 * u_radius * u_radius));
              color += texture2D(u_texture, v_texCoord + offset) * weight;
              total += weight;
            }
          }
          
          gl_FragColor = color / total;
        }
      `
    })
  }

  /**
   * 加载着色器
   */
  private loadShader(name: string, source: { vertex: string; fragment: string }): void {
    if (!this.gl) return

    const gl = this.gl

    // 编译顶点着色器
    const vertexShader = this.compileShader(gl.VERTEX_SHADER, source.vertex)
    if (!vertexShader) {
      console.error(`Failed to compile vertex shader: ${name}`)
      return
    }

    // 编译片段着色器
    const fragmentShader = this.compileShader(gl.FRAGMENT_SHADER, source.fragment)
    if (!fragmentShader) {
      console.error(`Failed to compile fragment shader: ${name}`)
      return
    }

    // 创建程序
    const program = gl.createProgram()
    if (!program) {
      console.error(`Failed to create shader program: ${name}`)
      return
    }

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(`Failed to link shader program: ${name}`, gl.getProgramInfoLog(program))
      return
    }

    // 获取属性和统一变量位置
    const attributes: Record<string, number> = {}
    const uniforms: Record<string, WebGLUniformLocation> = {}

    // 获取所有属性
    const numAttributes = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    for (let i = 0; i < numAttributes; i++) {
      const info = gl.getActiveAttrib(program, i)
      if (info) {
        attributes[info.name] = gl.getAttribLocation(program, info.name)
      }
    }

    // 获取所有统一变量
    const numUniforms = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (let i = 0; i < numUniforms; i++) {
      const info = gl.getActiveUniform(program, i)
      if (info) {
        const location = gl.getUniformLocation(program, info.name)
        if (location) {
          uniforms[info.name] = location
        }
      }
    }

    this.shaders.set(name, {
      vertex: vertexShader,
      fragment: fragmentShader,
      program,
      attributes,
      uniforms
    })

    this.stats.shaders++
  }

  /**
   * 编译着色器
   */
  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null

    const gl = this.gl
    const shader = gl.createShader(type)
    if (!shader) return null

    gl.shaderSource(shader, source)
    gl.compileShader(shader)

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
      gl.deleteShader(shader)
      return null
    }

    return shader
  }

  /**
   * 创建缓冲区
   */
  private createBuffers(): void {
    if (!this.gl) return

    const gl = this.gl

    this.vertexBuffer = gl.createBuffer()
    this.uvBuffer = gl.createBuffer()
    this.colorBuffer = gl.createBuffer()
    this.indexBuffer = gl.createBuffer()
  }

  /**
   * 使用着色器
   */
  useShader(name: string): void {
    if (!this.gl) return

    const shader = this.shaders.get(name)
    if (!shader) {
      console.error(`Shader not found: ${name}`)
      return
    }

    if (this.currentShader !== shader) {
      this.gl.useProgram(shader.program)
      this.currentShader = shader

      // 更新投影矩阵
      this.updateProjectionMatrix()
    }
  }

  /**
   * 更新视口
   */
  private updateViewport(): void {
    if (!this.gl || !this.canvas || !this.instance.container) return

    const container = this.instance.container as HTMLElement
    const rect = container.getBoundingClientRect()

    const dpr = window.devicePixelRatio || 1
    const width = rect.width * dpr
    const height = rect.height * dpr

    this.canvas.width = width
    this.canvas.height = height

    this.gl.viewport(0, 0, width, height)

    // 更新投影矩阵
    this.updateProjectionMatrix()
  }

  /**
   * 更新投影矩阵
   */
  private updateProjectionMatrix(): void {
    if (!this.canvas) return

    const width = this.canvas.width
    const height = this.canvas.height

    // 正交投影矩阵
    this.ortho(0, width, height, 0, -1, 1, this.projectionMatrix)

    // 如果有当前着色器，更新统一变量
    if (this.currentShader && this.gl) {
      const location = this.currentShader.uniforms.u_projectionMatrix
      if (location) {
        this.gl.uniformMatrix4fv(location, false, this.projectionMatrix)
      }
    }
  }

  /**
   * 创建正交投影矩阵
   */
  private ortho(left: number, right: number, bottom: number, top: number, near: number, far: number, out: Float32Array): Float32Array {
    const lr = 1 / (left - right)
    const bt = 1 / (bottom - top)
    const nf = 1 / (near - far)

    out[0] = -2 * lr
    out[1] = 0
    out[2] = 0
    out[3] = 0
    out[4] = 0
    out[5] = -2 * bt
    out[6] = 0
    out[7] = 0
    out[8] = 0
    out[9] = 0
    out[10] = 2 * nf
    out[11] = 0
    out[12] = (left + right) * lr
    out[13] = (top + bottom) * bt
    out[14] = (far + near) * nf
    out[15] = 1

    return out
  }

  /**
   * 开始帧
   */
  beginFrame(): void {
    if (!this.gl) return

    // 清除画布
    this.gl.clear(this.gl.COLOR_BUFFER_BIT)

    // 重置统计
    this.stats.drawCalls = 0
    this.stats.triangles = 0

    // 重置批量渲染
    this.batches = []
    this.currentBatch = null

    // 重置矩阵
    this.loadIdentity()

    // 使用默认着色器
    this.useShader('basic')
  }

  /**
   * 结束帧
   */
  endFrame(): void {
    // 刷新所有批次
    this.flushBatches()

    // 更新 FPS
    this.updateFPS()

    // 清理未使用的纹理
    if (this.config.enableTextureCache) {
      this.cleanupTextures()
    }
  }

  /**
   * 刷新批次
   */
  private flushBatches(): void {
    if (!this.gl || this.batches.length === 0) return

    const gl = this.gl

    for (const batch of this.batches) {
      // 绑定纹理
      if (batch.texture) {
        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, batch.texture)

        if (this.currentShader) {
          gl.uniform1i(this.currentShader.uniforms.u_texture, 0)
          gl.uniform1i(this.currentShader.uniforms.u_useTexture, 1)
        }
      } else if (this.currentShader) {
        gl.uniform1i(this.currentShader.uniforms.u_useTexture, 0)
      }

      // 更新缓冲区
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, batch.vertices, gl.DYNAMIC_DRAW)

      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, batch.uvs, gl.DYNAMIC_DRAW)

      gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, batch.colors, gl.DYNAMIC_DRAW)

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer)
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, batch.indices, gl.DYNAMIC_DRAW)

      // 设置属性
      if (this.currentShader) {
        const posAttr = this.currentShader.attributes.a_position
        if (posAttr >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer)
          gl.enableVertexAttribArray(posAttr)
          gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0)
        }

        const uvAttr = this.currentShader.attributes.a_texCoord
        if (uvAttr >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer)
          gl.enableVertexAttribArray(uvAttr)
          gl.vertexAttribPointer(uvAttr, 2, gl.FLOAT, false, 0, 0)
        }

        const colorAttr = this.currentShader.attributes.a_color
        if (colorAttr >= 0) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
          gl.enableVertexAttribArray(colorAttr)
          gl.vertexAttribPointer(colorAttr, 4, gl.FLOAT, false, 0, 0)
        }
      }

      // 绘制
      gl.drawElements(gl.TRIANGLES, batch.indexCount, gl.UNSIGNED_SHORT, 0)

      this.stats.drawCalls++
      this.stats.triangles += batch.indexCount / 3
    }

    this.batches = []
  }

  /**
   * 创建纹理
   */
  createTexture(id: string, image: HTMLImageElement | HTMLCanvasElement | ImageBitmap): WebGLTexture | null {
    if (!this.gl) return null

    // 检查缓存
    if (this.config.enableTextureCache) {
      const cached = this.textures.get(id)
      if (cached) {
        cached.lastUsed = Date.now()
        return cached.texture
      }
    }

    const gl = this.gl
    const texture = gl.createTexture()
    if (!texture) return null

    gl.bindTexture(gl.TEXTURE_2D, texture)

    // 设置纹理参数
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    // 上传纹理数据
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)

    // 生成 mipmap（如果支持）
    if (this.isPowerOfTwo(image.width) && this.isPowerOfTwo(image.height)) {
      gl.generateMipmap(gl.TEXTURE_2D)
    }

    // 缓存纹理
    if (this.config.enableTextureCache) {
      this.textures.set(id, {
        id,
        texture,
        width: image.width,
        height: image.height,
        lastUsed: Date.now()
      })
      this.stats.textures++
    }

    return texture
  }

  /**
   * 检查是否是 2 的幂
   */
  private isPowerOfTwo(value: number): boolean {
    return (value & (value - 1)) === 0
  }

  /**
   * 清理未使用的纹理
   */
  private cleanupTextures(): void {
    if (!this.gl) return

    const now = Date.now()
    const maxAge = 60000 // 60秒

    for (const [id, texture] of this.textures) {
      if (now - texture.lastUsed > maxAge) {
        this.gl.deleteTexture(texture.texture)
        this.textures.delete(id)
        this.stats.textures--
      }
    }
  }

  /**
   * 绘制矩形
   */
  drawRect(x: number, y: number, width: number, height: number, color: number[]): void {
    if (!this.config.enableBatching) {
      this.immediateDrawRect(x, y, width, height, color)
      return
    }

    // 批量渲染
    if (!this.currentBatch || this.currentBatch.texture !== null) {
      this.currentBatch = this.createBatch()
      this.batches.push(this.currentBatch)
    }

    const batch = this.currentBatch
    const vertexOffset = batch.vertexCount

    // 添加顶点
    const vertices = batch.vertices
    const baseIndex = vertexOffset * 2

    vertices[baseIndex] = x
    vertices[baseIndex + 1] = y
    vertices[baseIndex + 2] = x + width
    vertices[baseIndex + 3] = y
    vertices[baseIndex + 4] = x + width
    vertices[baseIndex + 5] = y + height
    vertices[baseIndex + 6] = x
    vertices[baseIndex + 7] = y + height

    // 添加颜色
    const colors = batch.colors
    const colorIndex = vertexOffset * 4

    for (let i = 0; i < 4; i++) {
      const ci = colorIndex + i * 4
      colors[ci] = color[0]
      colors[ci + 1] = color[1]
      colors[ci + 2] = color[2]
      colors[ci + 3] = color[3]
    }

    // 添加索引
    const indices = batch.indices
    const indexOffset = batch.indexCount

    indices[indexOffset] = vertexOffset
    indices[indexOffset + 1] = vertexOffset + 1
    indices[indexOffset + 2] = vertexOffset + 2
    indices[indexOffset + 3] = vertexOffset
    indices[indexOffset + 4] = vertexOffset + 2
    indices[indexOffset + 5] = vertexOffset + 3

    batch.vertexCount += 4
    batch.indexCount += 6
  }

  /**
   * 立即绘制矩形
   */
  private immediateDrawRect(x: number, y: number, width: number, height: number, color: number[]): void {
    // 实现立即模式绘制
  }

  /**
   * 创建批次
   */
  private createBatch(): RenderBatch {
    const maxVertices = 10000

    return {
      vertices: new Float32Array(maxVertices * 2),
      uvs: new Float32Array(maxVertices * 2),
      colors: new Float32Array(maxVertices * 4),
      indices: new Uint16Array(maxVertices * 6),
      texture: null,
      blendMode: 'normal',
      vertexCount: 0,
      indexCount: 0
    }
  }

  /**
   * 加载单位矩阵
   */
  private loadIdentity(): void {
    this.modelViewMatrix = new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ])

    this.updateModelViewMatrix()
  }

  /**
   * 更新模型视图矩阵
   */
  private updateModelViewMatrix(): void {
    if (!this.currentShader || !this.gl) return

    const location = this.currentShader.uniforms.u_modelViewMatrix
    if (location) {
      this.gl.uniformMatrix4fv(location, false, this.modelViewMatrix)
    }
  }

  /**
   * 保存矩阵
   */
  pushMatrix(): void {
    this.matrixStack.push(new Float32Array(this.modelViewMatrix))
  }

  /**
   * 恢复矩阵
   */
  popMatrix(): void {
    const matrix = this.matrixStack.pop()
    if (matrix) {
      this.modelViewMatrix = matrix
      this.updateModelViewMatrix()
    }
  }

  /**
   * 平移
   */
  translate(x: number, y: number): void {
    const m = this.modelViewMatrix
    m[12] += m[0] * x + m[4] * y
    m[13] += m[1] * x + m[5] * y
    this.updateModelViewMatrix()
  }

  /**
   * 缩放
   */
  scale(x: number, y: number): void {
    const m = this.modelViewMatrix
    m[0] *= x
    m[1] *= x
    m[4] *= y
    m[5] *= y
    this.updateModelViewMatrix()
  }

  /**
   * 旋转
   */
  rotate(angle: number): void {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    const m = this.modelViewMatrix

    const m0 = m[0]
    const m1 = m[1]
    const m4 = m[4]
    const m5 = m[5]

    m[0] = m0 * cos + m4 * sin
    m[1] = m1 * cos + m5 * sin
    m[4] = m0 * -sin + m4 * cos
    m[5] = m1 * -sin + m5 * cos

    this.updateModelViewMatrix()
  }

  /**
   * 更新 FPS
   */
  private updateFPS(): void {
    const now = performance.now()
    const deltaTime = now - this.lastFrameTime

    if (deltaTime >= 1000) {
      this.stats.fps = Math.round(this.frameCount * 1000 / deltaTime)
      this.frameCount = 0
      this.lastFrameTime = now
    }

    this.frameCount++
  }

  /**
   * 获取统计信息
   */
  getStats(): WebGLStats {
    return { ...this.stats }
  }

  /**
   * 附加到容器
   */
  attachToContainer(): void {
    if (!this.canvas || !this.instance.container) return

    const container = this.instance.container as HTMLElement
    container.appendChild(this.canvas)
  }

  /**
   * 销毁
   */
  destroy(): void {
    if (this.gl) {
      // 删除着色器
      for (const shader of this.shaders.values()) {
        this.gl.deleteShader(shader.vertex)
        this.gl.deleteShader(shader.fragment)
        this.gl.deleteProgram(shader.program)
      }

      // 删除纹理
      for (const texture of this.textures.values()) {
        this.gl.deleteTexture(texture.texture)
      }

      // 删除缓冲区
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer)
      if (this.uvBuffer) this.gl.deleteBuffer(this.uvBuffer)
      if (this.colorBuffer) this.gl.deleteBuffer(this.colorBuffer)
      if (this.indexBuffer) this.gl.deleteBuffer(this.indexBuffer)
    }

    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas)
    }

    this.shaders.clear()
    this.textures.clear()
    this.batches = []
  }
}

/**
 * 检查 WebGL 支持
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch (e) {
    return false
  }
}

/**
 * 检查 WebGL2 支持
 */
export function isWebGL2Supported(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'))
  } catch (e) {
    return false
  }
}




