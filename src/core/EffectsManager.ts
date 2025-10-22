/**
 * 特效管理器
 * 为 Lottie 动画添加各种视觉特效
 */

import type { ILottieInstance } from '../types'

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
}

export interface ShaderConfig {
  fragmentShader: string
  vertexShader?: string
  uniforms?: Record<string, any>
}

/**
 * 特效管理器类
 */
export class EffectsManager {
  private instance: ILottieInstance
  private container: HTMLElement | null = null
  private filters: Map<string, FilterEffect> = new Map()
  private particles: Particle[] = []
  private particleCanvas: HTMLCanvasElement | null = null
  private particleContext: CanvasRenderingContext2D | null = null
  private animationFrameId: number | null = null
  private isAnimating: boolean = false

  constructor(instance: ILottieInstance) {
    this.instance = instance
    this.container = instance.container
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
   * 添加粒子效果
   */
  addParticles(config: ParticleConfig): void {
    if (!this.container) return

    // 创建粒子画布
    if (!this.particleCanvas) {
      this.initParticleCanvas()
    }

    // 创建粒子
    for (let i = 0; i < config.count; i++) {
      this.particles.push(new Particle(config))
    }

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
    if (this.particles.length > 0) {
      this.animationFrameId = requestAnimationFrame(this.animateParticles)
    } else {
      this.isAnimating = false
      this.animationFrameId = null
    }
  }

  /**
   * 停止粒子动画
   */
  stopParticles(): void {
    this.isAnimating = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
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
  applyPreset(preset: 'glow' | 'neon' | 'vintage' | 'vibrant' | 'dark' | 'light'): void {
    this.clearFilters()

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
        break

      case 'vintage':
        this.addFilter('sepia', 'sepia', 60)
        this.addFilter('contrast', 'contrast', 90)
        this.addFilter('brightness', 'brightness', 110)
        break

      case 'vibrant':
        this.addFilter('saturate', 'saturate', 180)
        this.addFilter('contrast', 'contrast', 120)
        break

      case 'dark':
        this.addFilter('brightness', 'brightness', 70)
        this.addFilter('contrast', 'contrast', 130)
        break

      case 'light':
        this.addFilter('brightness', 'brightness', 130)
        this.addFilter('contrast', 'contrast', 90)
        break
    }
  }

  /**
   * 获取所有滤镜
   */
  getFilters(): Map<string, FilterEffect> {
    return new Map(this.filters)
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.clearFilters()
    this.clearParticles()
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

  constructor(config: ParticleConfig) {
    // 随机初始位置
    this.x = Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 800)
    this.y = Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 600)

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

