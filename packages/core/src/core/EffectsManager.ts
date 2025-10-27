/**
 * 特效管理器
 * 为 Lottie 动画添加各种视觉特效，支持 CSS 滤镜、WebGL 着色器和粒子系统
 */

import type { ILottieInstance } from '../types'
import { WebGLRenderer } from './WebGLRenderer'

export type FilterType =
  | 'blur'
  | 'brightness'
  | 'contrast'
  | 'grayscale'
  | 'hue-rotate'
  | 'invert'
  | 'opacity'
  | 'saturate'
  | 'sepia'
  | 'drop-shadow'

export interface FilterEffect {
  type: FilterType
  value: number | string
  enabled: boolean
}

export interface ParticleConfig {
  count: number
  size: number
  color: string
  speed: number
  direction: number // 角度
  spread: number
  lifetime: number
  gravity: number
  emissionRate?: number // 每秒发射粒子数
  loop?: boolean // 是否循环
}

export interface ShaderConfig {
  fragmentShader: string
  vertexShader?: string
  uniforms?: Record<string, any>
}

export interface WebGLEffect {
  id: string
  type: 'shader' | 'postprocess'
  config: ShaderConfig
  enabled: boolean
}

// 预设着色器
export const PRESET_SHADERS = {
  glitch: {
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform vec2 u_resolution;
      varying vec2 v_texCoord;
      
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }
      
      void main() {
        vec2 uv = v_texCoord;
        float glitchStrength = sin(u_time * 10.0) * 0.5 + 0.5;
        
        // RGB shift
        float r = texture2D(u_texture, uv + vec2(glitchStrength * 0.01, 0.0)).r;
        float g = texture2D(u_texture, uv).g;
        float b = texture2D(u_texture, uv - vec2(glitchStrength * 0.01, 0.0)).b;
        
        // Scanlines
        float scanline = sin(uv.y * u_resolution.y * 2.0) * 0.04;
        
        // Noise
        float noise = random(uv + u_time) * 0.1 * glitchStrength;
        
        vec3 color = vec3(r, g, b) + scanline + noise;
        gl_FragColor = vec4(color, 1.0);
      }
    `
  },

  pixelate: {
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_pixelSize;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 pixelSize = vec2(u_pixelSize) / u_resolution;
        vec2 coord = floor(v_texCoord / pixelSize) * pixelSize;
        gl_FragColor = texture2D(u_texture, coord);
      }
    `,
    uniforms: {
      u_pixelSize: 8.0
    }
  },

  wave: {
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_time;
      uniform float u_amplitude;
      uniform float u_frequency;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 uv = v_texCoord;
        uv.y += sin(uv.x * u_frequency + u_time) * u_amplitude;
        gl_FragColor = texture2D(u_texture, uv);
      }
    `,
    uniforms: {
      u_amplitude: 0.05,
      u_frequency: 10.0
    }
  },

  chromatic: {
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform float u_amount;
      varying vec2 v_texCoord;
      
      void main() {
        vec2 uv = v_texCoord;
        vec2 offset = vec2(u_amount, -u_amount) * 0.01;
        
        float r = texture2D(u_texture, uv + offset).r;
        float g = texture2D(u_texture, uv).g;
        float b = texture2D(u_texture, uv - offset).b;
        
        gl_FragColor = vec4(r, g, b, 1.0);
      }
    `,
    uniforms: {
      u_amount: 1.0
    }
  },

  bloom: {
    fragmentShader: `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec2 u_resolution;
      uniform float u_threshold;
      uniform float u_intensity;
      varying vec2 v_texCoord;
      
      vec3 sampleBox(vec2 uv, float delta) {
        vec3 color = vec3(0.0);
        for (float x = -4.0; x <= 4.0; x++) {
          for (float y = -4.0; y <= 4.0; y++) {
            vec2 offset = vec2(x, y) * delta / u_resolution;
            color += texture2D(u_texture, uv + offset).rgb;
          }
        }
        return color / 81.0;
      }
      
      void main() {
        vec3 color = texture2D(u_texture, v_texCoord).rgb;
        vec3 bloom = sampleBox(v_texCoord, 2.0);
        
        // Extract bright areas
        float brightness = dot(bloom, vec3(0.2126, 0.7152, 0.0722));
        if (brightness > u_threshold) {
          bloom *= u_intensity;
        } else {
          bloom = vec3(0.0);
        }
        
        gl_FragColor = vec4(color + bloom, 1.0);
      }
    `,
    uniforms: {
      u_threshold: 0.8,
      u_intensity: 1.5
    }
  }
}

/**
 * 特效管理器类
 */
export class EffectsManager {
  private instance: ILottieInstance
  private container: HTMLElement | null = null
  private filters: Map<string, FilterEffect> = new Map()
  private webglEffects: Map<string, WebGLEffect> = new Map()
  private particles: Particle[] = []
  private particleCanvas: HTMLCanvasElement | null = null
  private particleContext: CanvasRenderingContext2D | null = null
  private animationFrameId: number | null = null
  private isAnimating: boolean = false

  // WebGL 相关
  private webglCanvas: HTMLCanvasElement | null = null
  private gl: WebGLRenderingContext | null = null
  private shaderPrograms: Map<string, WebGLProgram> = new Map()
  private framebuffer: WebGLFramebuffer | null = null
  private texture: WebGLTexture | null = null
  private useWebGL: boolean = false
  private time: number = 0

  constructor(instance: ILottieInstance) {
    this.instance = instance
    this.container = instance.container
    this.checkWebGLSupport()
  }

  /**
   * 检查 WebGL 支持
   */
  private checkWebGLSupport(): void {
    try {
      const canvas = document.createElement('canvas')
      this.useWebGL = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      )
    } catch (e) {
      this.useWebGL = false
    }
  }

  /**
   * 添加滤镜
   */
  addFilter(id: string, type: FilterType, value: number | string): void {
    this.filters.set(id, {
      type,
      value,
      enabled: true
    })
    this.applyFilters()
  }

  /**
   * 移除滤镜
   */
  removeFilter(id: string): boolean {
    const result = this.filters.delete(id)
    if (result) {
      this.applyFilters()
    }
    return result
  }

  /**
   * 更新滤镜
   */
  updateFilter(id: string, value: number | string): boolean {
    const filter = this.filters.get(id)
    if (!filter) return false

    filter.value = value
    this.applyFilters()
    return true
  }

  /**
   * 启用/禁用滤镜
   */
  toggleFilter(id: string, enabled?: boolean): boolean {
    const filter = this.filters.get(id)
    if (!filter) return false

    filter.enabled = enabled !== undefined ? enabled : !filter.enabled
    this.applyFilters()
    return true
  }

  /**
   * 应用滤镜
   */
  private applyFilters(): void {
    if (!this.container) return

    const filterStrings: string[] = []

    this.filters.forEach(filter => {
      if (!filter.enabled) return

      switch (filter.type) {
        case 'blur':
          filterStrings.push(`blur(${filter.value}px)`)
          break
        case 'brightness':
          filterStrings.push(`brightness(${filter.value}%)`)
          break
        case 'contrast':
          filterStrings.push(`contrast(${filter.value}%)`)
          break
        case 'grayscale':
          filterStrings.push(`grayscale(${filter.value}%)`)
          break
        case 'hue-rotate':
          filterStrings.push(`hue-rotate(${filter.value}deg)`)
          break
        case 'invert':
          filterStrings.push(`invert(${filter.value}%)`)
          break
        case 'opacity':
          filterStrings.push(`opacity(${filter.value}%)`)
          break
        case 'saturate':
          filterStrings.push(`saturate(${filter.value}%)`)
          break
        case 'sepia':
          filterStrings.push(`sepia(${filter.value}%)`)
          break
        case 'drop-shadow':
          filterStrings.push(`drop-shadow(${filter.value})`)
          break
      }
    })

    this.container.style.filter = filterStrings.join(' ')
  }

  /**
   * 清除所有滤镜
   */
  clearFilters(): void {
    this.filters.clear()
    if (this.container) {
      this.container.style.filter = ''
    }
  }

  /**
   * 添加 WebGL 着色器特效
   */
  addShaderEffect(id: string, config: ShaderConfig | keyof typeof PRESET_SHADERS): void {
    if (!this.useWebGL) {
      console.warn('[EffectsManager] WebGL not supported')
      return
    }

    // 检查是否是预设
    let shaderConfig: ShaderConfig
    if (typeof config === 'string' && config in PRESET_SHADERS) {
      shaderConfig = PRESET_SHADERS[config as keyof typeof PRESET_SHADERS]
    } else {
      shaderConfig = config as ShaderConfig
    }

    this.webglEffects.set(id, {
      id,
      type: 'shader',
      config: shaderConfig,
      enabled: true
    })

    // 初始化 WebGL（如果需要）
    if (!this.gl) {
      this.initWebGL()
    }

    // 编译着色器
    this.compileShader(id, shaderConfig)

    // 开始渲染
    this.startWebGLRender()
  }

  /**
   * 初始化 WebGL
   */
  private initWebGL(): void {
    if (!this.container) return

    // 创建 canvas
    this.webglCanvas = document.createElement('canvas')
    this.webglCanvas.style.position = 'absolute'
    this.webglCanvas.style.top = '0'
    this.webglCanvas.style.left = '0'
    this.webglCanvas.style.width = '100%'
    this.webglCanvas.style.height = '100%'
    this.webglCanvas.style.pointerEvents = 'none'
    this.webglCanvas.style.zIndex = '5'

    const rect = this.container.getBoundingClientRect()
    this.webglCanvas.width = rect.width
    this.webglCanvas.height = rect.height

    // 获取 WebGL 上下文
    this.gl = this.webglCanvas.getContext('webgl') ||
      this.webglCanvas.getContext('experimental-webgl')

    if (!this.gl) {
      console.error('[EffectsManager] Failed to get WebGL context')
      return
    }

    this.container.appendChild(this.webglCanvas)

    // 设置 WebGL
    this.setupWebGL()
  }

  /**
   * 设置 WebGL
   */
  private setupWebGL(): void {
    if (!this.gl || !this.webglCanvas) return

    const gl = this.gl

    // 创建纹理
    this.texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    // 创建帧缓冲
    this.framebuffer = gl.createFramebuffer()
  }

  /**
   * 编译着色器程序
   */
  private compileShader(id: string, config: ShaderConfig): void {
    if (!this.gl) return

    const gl = this.gl

    // 默认顶点着色器
    const defaultVertexShader = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_texCoord;
      }
    `

    const vertexShaderSource = config.vertexShader || defaultVertexShader
    const fragmentShaderSource = config.fragmentShader

    // 编译顶点着色器
    const vertexShader = gl.createShader(gl.VERTEX_SHADER)
    if (!vertexShader) return

    gl.shaderSource(vertexShader, vertexShaderSource)
    gl.compileShader(vertexShader)

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('[EffectsManager] Vertex shader compilation error:', gl.getShaderInfoLog(vertexShader))
      return
    }

    // 编译片段着色器
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)
    if (!fragmentShader) return

    gl.shaderSource(fragmentShader, fragmentShaderSource)
    gl.compileShader(fragmentShader)

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('[EffectsManager] Fragment shader compilation error:', gl.getShaderInfoLog(fragmentShader))
      return
    }

    // 创建程序
    const program = gl.createProgram()
    if (!program) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[EffectsManager] Shader program link error:', gl.getProgramInfoLog(program))
      return
    }

    this.shaderPrograms.set(id, program)
  }

  /**
   * 开始 WebGL 渲染
   */
  private startWebGLRender(): void {
    if (this.animationFrameId) return

    const render = () => {
      this.renderWebGL()
      this.animationFrameId = requestAnimationFrame(render)
    }

    render()
  }

  /**
   * WebGL 渲染
   */
  private renderWebGL(): void {
    if (!this.gl || !this.webglCanvas) return

    const gl = this.gl
    this.time += 0.016 // ~60fps

    // 清除画布
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 遍历激活的特效
    this.webglEffects.forEach(effect => {
      if (!effect.enabled) return

      const program = this.shaderPrograms.get(effect.id)
      if (!program) return

      gl.useProgram(program)

      // 设置顶点数据
      const positionBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        -1, -1, 1, -1, -1, 1,
        -1, 1, 1, -1, 1, 1
      ]), gl.STATIC_DRAW)

      const positionLocation = gl.getAttribLocation(program, 'a_position')
      gl.enableVertexAttribArray(positionLocation)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      // 设置纹理坐标
      const texCoordBuffer = gl.createBuffer()
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer)
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        0, 0, 1, 0, 0, 1,
        0, 1, 1, 0, 1, 1
      ]), gl.STATIC_DRAW)

      const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord')
      gl.enableVertexAttribArray(texCoordLocation)
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0)

      // 设置统一变量
      const timeLocation = gl.getUniformLocation(program, 'u_time')
      if (timeLocation) {
        gl.uniform1f(timeLocation, this.time)
      }

      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
      if (resolutionLocation) {
        gl.uniform2f(resolutionLocation, this.webglCanvas.width, this.webglCanvas.height)
      }

      // 设置自定义统一变量
      if (effect.config.uniforms) {
        Object.entries(effect.config.uniforms).forEach(([name, value]) => {
          const location = gl.getUniformLocation(program, name)
          if (location) {
            if (typeof value === 'number') {
              gl.uniform1f(location, value)
            } else if (Array.isArray(value)) {
              if (value.length === 2) {
                gl.uniform2fv(location, value)
              } else if (value.length === 3) {
                gl.uniform3fv(location, value)
              } else if (value.length === 4) {
                gl.uniform4fv(location, value)
              }
            }
          }
        })
      }

      // 绘制
      gl.drawArrays(gl.TRIANGLES, 0, 6)
    })
  }

  /**
   * 移除 WebGL 特效
   */
  removeShaderEffect(id: string): boolean {
    const result = this.webglEffects.delete(id)

    if (result && this.gl) {
      const program = this.shaderPrograms.get(id)
      if (program) {
        this.gl.deleteProgram(program)
        this.shaderPrograms.delete(id)
      }

      // 如果没有特效了，停止渲染
      if (this.webglEffects.size === 0 && this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
    }

    return result
  }

  /**
   * 添加粒子效果
   */
  addParticles(config: ParticleConfig): void {
    if (!this.container) return

    // 创建粒子画布
    if (!this.particleCanvas) {
      this.initParticleCanvas()
    }

    // 创建粒子发射器
    const emitter = new ParticleEmitter(config)

    // 开始动画
    if (!this.isAnimating) {
      this.startParticleAnimation()
    }
  }

  /**
   * 初始化粒子画布
   */
  private initParticleCanvas(): void {
    if (!this.container) return

    this.particleCanvas = document.createElement('canvas')
    this.particleCanvas.style.position = 'absolute'
    this.particleCanvas.style.top = '0'
    this.particleCanvas.style.left = '0'
    this.particleCanvas.style.width = '100%'
    this.particleCanvas.style.height = '100%'
    this.particleCanvas.style.pointerEvents = 'none'
    this.particleCanvas.style.zIndex = '10'

    const rect = this.container.getBoundingClientRect()
    this.particleCanvas.width = rect.width
    this.particleCanvas.height = rect.height

    this.particleContext = this.particleCanvas.getContext('2d')
    this.container.appendChild(this.particleCanvas)
  }

  /**
   * 开始粒子动画
   */
  private startParticleAnimation(): void {
    this.isAnimating = true
    this.animateParticles()
  }

  /**
   * 粒子动画循环
   */
  private animateParticles = (): void => {
    if (!this.isAnimating || !this.particleContext || !this.particleCanvas) return

    const ctx = this.particleContext
    const canvas = this.particleCanvas

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 更新和绘制粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.update()

      if (particle.isDead()) {
        this.particles.splice(i, 1)
        continue
      }

      particle.draw(ctx)
    }

    // 继续动画
    if (this.particles.length > 0 || this.isAnimating) {
      requestAnimationFrame(this.animateParticles)
    }
  }

  /**
   * 停止粒子动画
   */
  stopParticles(): void {
    this.isAnimating = false
    this.particles = []
  }

  /**
   * 清除粒子画布
   */
  clearParticles(): void {
    this.stopParticles()
    if (this.particleCanvas) {
      this.particleCanvas.remove()
      this.particleCanvas = null
      this.particleContext = null
    }
  }

  /**
   * 应用预设特效
   */
  applyPreset(preset: 'glow' | 'neon' | 'vintage' | 'vibrant' | 'dark' | 'light' | 'glitch' | 'pixelate'): void {
    this.clearFilters()
    this.clearShaderEffects()

    switch (preset) {
      case 'glow':
        this.addFilter('blur', 'blur', 2)
        this.addFilter('brightness', 'brightness', 120)
        this.addFilter('contrast', 'contrast', 110)
        break

      case 'neon':
        this.addFilter('saturate', 'saturate', 200)
        this.addFilter('brightness', 'brightness', 150)
        this.addFilter('contrast', 'contrast', 120)
        if (this.useWebGL) {
          this.addShaderEffect('chromatic', 'chromatic')
        }
        break

      case 'vintage':
        this.addFilter('sepia', 'sepia', 60)
        this.addFilter('contrast', 'contrast', 90)
        this.addFilter('brightness', 'brightness', 110)
        break

      case 'vibrant':
        this.addFilter('saturate', 'saturate', 180)
        this.addFilter('contrast', 'contrast', 120)
        if (this.useWebGL) {
          this.addShaderEffect('bloom', 'bloom')
        }
        break

      case 'dark':
        this.addFilter('brightness', 'brightness', 70)
        this.addFilter('contrast', 'contrast', 130)
        break

      case 'light':
        this.addFilter('brightness', 'brightness', 130)
        this.addFilter('contrast', 'contrast', 90)
        break

      case 'glitch':
        if (this.useWebGL) {
          this.addShaderEffect('glitch', 'glitch')
        } else {
          // 备用 CSS 效果
          this.addFilter('hue', 'hue-rotate', 180)
        }
        break

      case 'pixelate':
        if (this.useWebGL) {
          this.addShaderEffect('pixelate', 'pixelate')
        }
        break
    }
  }

  /**
   * 清除所有 WebGL 特效
   */
  clearShaderEffects(): void {
    this.webglEffects.forEach((_, id) => {
      this.removeShaderEffect(id)
    })
  }

  /**
   * 获取所有滤镜
   */
  getFilters(): Map<string, FilterEffect> {
    return new Map(this.filters)
  }

  /**
   * 获取所有 WebGL 特效
   */
  getShaderEffects(): Map<string, WebGLEffect> {
    return new Map(this.webglEffects)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.clearFilters()
    this.clearParticles()
    this.clearShaderEffects()

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }

    if (this.webglCanvas) {
      this.webglCanvas.remove()
      this.webglCanvas = null
    }

    if (this.gl) {
      // 清理 WebGL 资源
      if (this.texture) this.gl.deleteTexture(this.texture)
      if (this.framebuffer) this.gl.deleteFramebuffer(this.framebuffer)

      this.shaderPrograms.forEach(program => {
        this.gl!.deleteProgram(program)
      })

      this.gl = null
    }
  }
}

/**
 * 粒子类
 */
class Particle {
  private x: number
  private y: number
  private vx: number
  private vy: number
  private size: number
  private color: string
  private lifetime: number
  private age: number = 0
  private gravity: number

  constructor(config: ParticleConfig, x?: number, y?: number) {
    // 位置
    this.x = x ?? Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800)
    this.y = y ?? Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600)

    // 根据方向和速度计算速度分量
    const angle = (config.direction + (Math.random() - 0.5) * config.spread) * Math.PI / 180
    this.vx = Math.cos(angle) * config.speed
    this.vy = Math.sin(angle) * config.speed

    this.size = config.size * (0.5 + Math.random() * 0.5)
    this.color = config.color
    this.lifetime = config.lifetime
    this.gravity = config.gravity
  }

  update(): void {
    this.vy += this.gravity
    this.x += this.vx
    this.y += this.vy
    this.age++
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = 1 - (this.age / this.lifetime)

    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = this.color
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  isDead(): boolean {
    return this.age >= this.lifetime
  }
}

/**
 * 粒子发射器
 */
class ParticleEmitter {
  private config: ParticleConfig
  private particles: Particle[] = []
  private lastEmitTime: number = 0
  private emitInterval: number

  constructor(config: ParticleConfig) {
    this.config = config
    this.emitInterval = config.emissionRate ? 1000 / config.emissionRate : 100

    // 初始粒子
    for (let i = 0; i < config.count; i++) {
      this.emit()
    }
  }

  emit(): void {
    this.particles.push(new Particle(this.config))
  }

  update(): void {
    const now = Date.now()

    // 发射新粒子
    if (this.config.loop && now - this.lastEmitTime > this.emitInterval) {
      this.emit()
      this.lastEmitTime = now
    }

    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      particle.update()

      if (particle.isDead()) {
        this.particles.splice(i, 1)
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(particle => particle.draw(ctx))
  }

  getParticleCount(): number {
    return this.particles.length
  }
}