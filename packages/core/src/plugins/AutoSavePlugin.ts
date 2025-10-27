/**
 * 自动保存插件
 * 自动保存动画状态和播放进度
 */

import { createPlugin } from '../core/PluginSystem'
import type { PluginContext } from '../core/PluginSystem'

export interface AutoSaveConfig {
  enabled?: boolean
  interval?: number // 保存间隔（毫秒）
  savePosition?: boolean // 保存播放位置
  saveConfig?: boolean // 保存配置
  saveState?: boolean // 保存状态
  storageKey?: string // 存储键前缀
}

interface SavedData {
  timestamp: number
  position?: number
  state?: 'playing' | 'paused' | 'stopped'
  config?: any
  loop?: boolean
  speed?: number
}

class AutoSaveManager {
  private config: Required<AutoSaveConfig> = {
    enabled: true,
    interval: 5000,
    savePosition: true,
    saveConfig: true,
    saveState: true,
    storageKey: 'lottie-autosave'
  }

  private intervalId: NodeJS.Timeout | null = null
  private context: PluginContext | null = null
  private lastSave: number = 0

  initialize(context: PluginContext, config?: AutoSaveConfig): void {
    this.context = context
    this.updateConfig(config || {})

    if (this.config.enabled) {
      this.start()
      this.restore()
    }
  }

  updateConfig(config: Partial<AutoSaveConfig>): void {
    this.config = { ...this.config, ...config }

    // 重启自动保存
    if (this.intervalId) {
      this.stop()
      if (this.config.enabled) {
        this.start()
      }
    }
  }

  start(): void {
    if (this.intervalId) return

    this.intervalId = setInterval(() => {
      this.save()
    }, this.config.interval)

    this.context?.logger.info('Auto-save started')
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
      this.context?.logger.info('Auto-save stopped')
    }
  }

  save(): void {
    if (!this.context) return

    const data: SavedData = {
      timestamp: Date.now()
    }

    // 保存播放位置
    if (this.config.savePosition) {
      data.position = this.context.utils.getCurrentFrame()
    }

    // 保存状态
    if (this.config.saveState) {
      const state = this.context.lottie.state
      data.state = state
    }

    // 保存配置
    if (this.config.saveConfig) {
      data.config = this.context.lottie.config
      data.loop = this.context.lottie.config.loop
      data.speed = this.context.lottie.config.speed
    }

    // 存储到 localStorage
    const key = `${this.config.storageKey}-${this.context.lottie.id}`
    try {
      localStorage.setItem(key, JSON.stringify(data))
      this.lastSave = Date.now()
      this.context.logger.debug(`Auto-saved at frame ${data.position}`)
    } catch (error) {
      this.context.logger.error('Failed to save:', error)
    }
  }

  restore(): void {
    if (!this.context) return

    const key = `${this.config.storageKey}-${this.context.lottie.id}`

    try {
      const saved = localStorage.getItem(key)
      if (!saved) return

      const data: SavedData = JSON.parse(saved)

      // 检查数据是否过期（超过24小时）
      const maxAge = 24 * 60 * 60 * 1000
      if (Date.now() - data.timestamp > maxAge) {
        localStorage.removeItem(key)
        return
      }

      // 恢复播放位置
      if (data.position !== undefined && this.config.savePosition) {
        this.context.utils.goToFrame(data.position)
        this.context.logger.info(`Restored to frame ${data.position}`)
      }

      // 恢复配置
      if (data.config && this.config.saveConfig) {
        if (data.loop !== undefined) {
          this.context.lottie.setLoop(data.loop)
        }
        if (data.speed !== undefined) {
          this.context.lottie.setSpeed(data.speed)
        }
      }

      // 恢复状态
      if (data.state && this.config.saveState) {
        if (data.state === 'playing') {
          this.context.lottie.play()
        }
      }

      this.context.logger.info('Auto-save data restored')
    } catch (error) {
      this.context.logger.error('Failed to restore:', error)
    }
  }

  clear(): void {
    if (!this.context) return

    const key = `${this.config.storageKey}-${this.context.lottie.id}`
    localStorage.removeItem(key)
    this.context.logger.info('Auto-save data cleared')
  }

  getLastSaveTime(): number {
    return this.lastSave
  }

  destroy(): void {
    this.stop()
    this.context = null
  }
}

// 创建插件
export const AutoSavePlugin = createPlugin({
  metadata: {
    name: 'auto-save',
    version: '1.0.0',
    author: 'LDesign Team',
    description: 'Automatically save animation state and progress',
    keywords: ['save', 'restore', 'persistence', 'state']
  },

  hooks: {
    onInstall(context: PluginContext): void {
      const manager = new AutoSaveManager()
      context.storage.set('manager', manager)

      const config = context.storage.get('config') as AutoSaveConfig
      manager.initialize(context, config)
    },

    onActivate(context: PluginContext): void {
      const manager = context.storage.get('manager') as AutoSaveManager
      if (manager) {
        manager.start()
      }
    },

    onDeactivate(context: PluginContext): void {
      const manager = context.storage.get('manager') as AutoSaveManager
      if (manager) {
        // 停用前保存一次
        manager.save()
        manager.stop()
      }
    },

    afterPlay(context: PluginContext): void {
      const manager = context.storage.get('manager') as AutoSaveManager
      if (manager) {
        // 播放后立即保存
        manager.save()
      }
    },

    afterPause(context: PluginContext): void {
      const manager = context.storage.get('manager') as AutoSaveManager
      if (manager) {
        // 暂停后立即保存
        manager.save()
      }
    },

    afterStop(context: PluginContext): void {
      const manager = context.storage.get('manager') as AutoSaveManager
      if (manager) {
        // 停止后立即保存
        manager.save()
      }
    },

    onLoop(context: PluginContext, loopCount: number): void {
      const manager = context.storage.get('manager') as AutoSaveManager
      if (manager && loopCount % 5 === 0) {
        // 每5次循环保存一次
        manager.save()
      }
    },

    onUninstall(context: PluginContext): void {
      const manager = context.storage.get('manager') as AutoSaveManager
      if (manager) {
        manager.destroy()
      }
      context.storage.clear()
    }
  },

  config: {
    get(): AutoSaveConfig {
      const storage = (this as any).context?.storage
      return storage?.get('config') || {}
    },

    set(config: AutoSaveConfig): void {
      const context = (this as any).context
      if (!context) return

      context.storage.set('config', config)

      const manager = context.storage.get('manager') as AutoSaveManager
      if (manager) {
        manager.updateConfig(config)
      }
    },

    validate(config: AutoSaveConfig): boolean {
      if (!config) return true

      // 验证间隔时间
      if (config.interval !== undefined && config.interval < 1000) {
        return false // 最小1秒
      }

      return true
    }
  },

  extend(api: any): void {
    // 扩展 API
    api.autoSave = {
      save: () => {
        const manager = (this as any).context?.storage.get('manager') as AutoSaveManager
        manager?.save()
      },

      restore: () => {
        const manager = (this as any).context?.storage.get('manager') as AutoSaveManager
        manager?.restore()
      },

      clear: () => {
        const manager = (this as any).context?.storage.get('manager') as AutoSaveManager
        manager?.clear()
      },

      getLastSaveTime: () => {
        const manager = (this as any).context?.storage.get('manager') as AutoSaveManager
        return manager?.getLastSaveTime()
      }
    }
  }
})

