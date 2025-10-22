/**
 * 滤镜管道
 * 串联多个滤镜，实现复杂特效
 */

import type { ILottieInstance } from '../types'
import { EffectsManager, type FilterEffect } from './EffectsManager'

export interface FilterPreset {
  name: string
  description: string
  filters: Array<{ type: FilterEffect['type']; value: number | string }>
}

export interface PipelineConfig {
  /** 是否启用实时预览 */
  livePreview?: boolean
  /** 过渡时长（ms） */
  transitionDuration?: number
  /** 性能模式 */
  performanceMode?: 'quality' | 'balanced' | 'performance'
}

/**
 * 滤镜管道类
 */
export class FilterPipeline {
  private instance: ILottieInstance
  private effectsManager: EffectsManager
  private config: Required<PipelineConfig>
  private pipeline: string[] = [] // 滤镜 ID 顺序
  private isTransitioning: boolean = false

  // 预设滤镜库
  private static presets: Map<string, FilterPreset> = new Map([
    ['vintage', {
      name: '复古',
      description: '怀旧的复古风格',
      filters: [
        { type: 'sepia', value: 60 },
        { type: 'contrast', value: 90 },
        { type: 'brightness', value: 110 }
      ]
    }],
    ['cyberpunk', {
      name: '赛博朋克',
      description: '霓虹灯效果',
      filters: [
        { type: 'saturate', value: 200 },
        { type: 'brightness', value: 130 },
        { type: 'contrast', value: 120 },
        { type: 'hue-rotate', value: '280deg' }
      ]
    }],
    ['dreamy', {
      name: '梦幻',
      description: '柔和朦胧效果',
      filters: [
        { type: 'blur', value: 1.5 },
        { type: 'brightness', value: 115 },
        { type: 'saturate', value: 120 }
      ]
    }],
    ['dramatic', {
      name: '戏剧化',
      description: '高对比度效果',
      filters: [
        { type: 'contrast', value: 150 },
        { type: 'brightness', value: 95 },
        { type: 'saturate', value: 110 }
      ]
    }],
    ['monochrome', {
      name: '单色',
      description: '黑白效果',
      filters: [
        { type: 'grayscale', value: 100 },
        { type: 'contrast', value: 120 }
      ]
    }],
    ['warm', {
      name: '暖色调',
      description: '温暖的色调',
      filters: [
        { type: 'sepia', value: 30 },
        { type: 'saturate', value: 120 },
        { type: 'brightness', value: 105 }
      ]
    }],
    ['cool', {
      name: '冷色调',
      description: '清冷的色调',
      filters: [
        { type: 'hue-rotate', value: '180deg' },
        { type: 'saturate', value: 90 },
        { type: 'brightness', value: 95 }
      ]
    }],
    ['glow', {
      name: '发光',
      description: '柔和光晕',
      filters: [
        { type: 'blur', value: 2 },
        { type: 'brightness', value: 140 },
        { type: 'saturate', value: 150 }
      ]
    }]
  ])

  constructor(instance: ILottieInstance, config?: PipelineConfig) {
    this.instance = instance
    this.effectsManager = new EffectsManager(instance)

    this.config = {
      livePreview: config?.livePreview ?? true,
      transitionDuration: config?.transitionDuration ?? 500,
      performanceMode: config?.performanceMode ?? 'balanced'
    }
  }

  /**
   * 添加滤镜到管道
   */
  addToPipeline(filterId: string): void {
    if (!this.pipeline.includes(filterId)) {
      this.pipeline.push(filterId)
    }
  }

  /**
   * 从管道移除滤镜
   */
  removeFromPipeline(filterId: string): void {
    const index = this.pipeline.indexOf(filterId)
    if (index > -1) {
      this.pipeline.splice(index, 1)
    }
  }

  /**
   * 重新排序管道
   */
  reorderPipeline(newOrder: string[]): void {
    this.pipeline = newOrder.filter(id => this.effectsManager.getFilters().has(id))
  }

  /**
   * 应用预设
   */
  applyPreset(presetName: string): boolean {
    const preset = FilterPipeline.presets.get(presetName)
    if (!preset) return false

    // 清空当前滤镜
    this.effectsManager.clearFilters()
    this.pipeline = []

    // 应用预设滤镜
    preset.filters.forEach((filter, index) => {
      const filterId = `preset_${presetName}_${index}`
      this.effectsManager.addFilter(filterId, filter.type, filter.value)
      this.pipeline.push(filterId)
    })

    return true
  }

  /**
   * 获取所有预设
   */
  static getPresets(): FilterPreset[] {
    return Array.from(FilterPipeline.presets.values())
  }

  /**
   * 添加自定义预设
   */
  static addPreset(id: string, preset: FilterPreset): void {
    FilterPipeline.presets.set(id, preset)
  }

  /**
   * 过渡到新预设
   */
  async transitionToPreset(presetName: string): Promise<void> {
    if (this.isTransitioning) return

    const preset = FilterPipeline.presets.get(presetName)
    if (!preset) return

    this.isTransitioning = true

    const steps = 30
    const stepDuration = this.config.transitionDuration / steps

    for (let step = 0; step <= steps; step++) {
      const progress = step / steps

      // 插值滤镜值
      preset.filters.forEach((filter, index) => {
        const filterId = `preset_${presetName}_${index}`

        if (typeof filter.value === 'number') {
          const currentValue = this.getCurrentFilterValue(filterId, filter.type)
          const newValue = currentValue + (filter.value - currentValue) * progress

          if (step === 0) {
            this.effectsManager.addFilter(filterId, filter.type, newValue)
          } else {
            this.effectsManager.updateFilter(filterId, newValue)
          }
        }
      })

      if (step < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration))
      }
    }

    this.isTransitioning = false
  }

  /**
   * 获取当前滤镜值
   */
  private getCurrentFilterValue(filterId: string, type: FilterEffect['type']): number {
    const filters = this.effectsManager.getFilters()
    const filter = filters.get(filterId)

    if (filter && typeof filter.value === 'number') {
      return filter.value
    }

    // 返回默认值
    const defaults: Record<string, number> = {
      'blur': 0,
      'brightness': 100,
      'contrast': 100,
      'grayscale': 0,
      'hue-rotate': 0,
      'invert': 0,
      'opacity': 100,
      'saturate': 100,
      'sepia': 0
    }

    return defaults[type] || 0
  }

  /**
   * 优化性能
   */
  optimize(): void {
    switch (this.config.performanceMode) {
      case 'performance':
        // 禁用一些耗性能的滤镜
        this.effectsManager.getFilters().forEach((filter, id) => {
          if (filter.type === 'blur' || filter.type === 'drop-shadow') {
            this.effectsManager.toggleFilter(id, false)
          }
        })
        break

      case 'balanced':
        // 降低模糊半径
        this.effectsManager.getFilters().forEach((filter, id) => {
          if (filter.type === 'blur' && typeof filter.value === 'number') {
            this.effectsManager.updateFilter(id, Math.min(filter.value, 2))
          }
        })
        break

      case 'quality':
        // 保持所有滤镜
        break
    }
  }

  /**
   * 获取管道信息
   */
  getPipelineInfo(): {
    filterCount: number
    pipeline: string[]
    estimatedCost: number
  } {
    const filterCount = this.effectsManager.getFilters().size
    let estimatedCost = 0

    this.effectsManager.getFilters().forEach(filter => {
      if (!filter.enabled) return

      // 估算滤镜性能开销
      const costs: Record<string, number> = {
        'blur': 10,
        'drop-shadow': 8,
        'brightness': 2,
        'contrast': 2,
        'saturate': 3,
        'grayscale': 2,
        'sepia': 2,
        'hue-rotate': 4,
        'invert': 2,
        'opacity': 1
      }

      estimatedCost += costs[filter.type] || 1
    })

    return {
      filterCount,
      pipeline: [...this.pipeline],
      estimatedCost
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.effectsManager.destroy()
    this.pipeline = []
  }
}

