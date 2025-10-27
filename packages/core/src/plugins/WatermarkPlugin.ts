/**
 * 水印插件
 * 为 Lottie 动画添加自定义水印
 */

import { createPlugin } from '../core/PluginSystem'
import type { PluginContext } from '../core/PluginSystem'

export interface WatermarkConfig {
  text?: string
  image?: string
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
  opacity?: number
  fontSize?: number
  fontColor?: string
  fontFamily?: string
  padding?: number
  rotation?: number
}

class WatermarkManager {
  private watermark: HTMLElement | null = null
  private config: WatermarkConfig = {
    text: '',
    position: 'bottom-right',
    opacity: 0.5,
    fontSize: 14,
    fontColor: '#000000',
    fontFamily: 'Arial, sans-serif',
    padding: 10,
    rotation: 0
  }

  updateConfig(config: WatermarkConfig): void {
    this.config = { ...this.config, ...config }
  }

  create(container: HTMLElement): void {
    this.destroy()

    this.watermark = document.createElement('div')
    this.watermark.className = 'lottie-watermark'

    // 设置样式
    Object.assign(this.watermark.style, {
      position: 'absolute',
      pointerEvents: 'none',
      zIndex: '9999',
      opacity: this.config.opacity?.toString(),
      fontSize: `${this.config.fontSize}px`,
      color: this.config.fontColor,
      fontFamily: this.config.fontFamily,
      transform: `rotate(${this.config.rotation}deg)`,
      userSelect: 'none',
      webkitUserSelect: 'none',
      msUserSelect: 'none'
    })

    // 设置位置
    const padding = this.config.padding || 10
    switch (this.config.position) {
      case 'top-left':
        this.watermark.style.top = `${padding}px`
        this.watermark.style.left = `${padding}px`
        break
      case 'top-right':
        this.watermark.style.top = `${padding}px`
        this.watermark.style.right = `${padding}px`
        break
      case 'bottom-left':
        this.watermark.style.bottom = `${padding}px`
        this.watermark.style.left = `${padding}px`
        break
      case 'bottom-right':
        this.watermark.style.bottom = `${padding}px`
        this.watermark.style.right = `${padding}px`
        break
      case 'center':
        this.watermark.style.top = '50%'
        this.watermark.style.left = '50%'
        this.watermark.style.transform = `translate(-50%, -50%) rotate(${this.config.rotation}deg)`
        break
    }

    // 设置内容
    if (this.config.text) {
      this.watermark.textContent = this.config.text
    } else if (this.config.image) {
      const img = document.createElement('img')
      img.src = this.config.image
      img.style.maxWidth = '100px'
      img.style.maxHeight = '100px'
      img.style.opacity = this.config.opacity?.toString() || '0.5'
      this.watermark.appendChild(img)
    }

    // 确保容器是相对定位
    const containerStyle = window.getComputedStyle(container)
    if (containerStyle.position === 'static') {
      container.style.position = 'relative'
    }

    container.appendChild(this.watermark)
  }

  update(config: WatermarkConfig): void {
    this.updateConfig(config)
    if (this.watermark && this.watermark.parentElement) {
      this.create(this.watermark.parentElement as HTMLElement)
    }
  }

  destroy(): void {
    if (this.watermark) {
      this.watermark.remove()
      this.watermark = null
    }
  }
}

// 创建插件
export const WatermarkPlugin = createPlugin({
  metadata: {
    name: 'watermark',
    version: '1.0.0',
    author: 'LDesign Team',
    description: 'Add watermark to Lottie animations',
    keywords: ['watermark', 'overlay', 'branding']
  },

  hooks: {
    onInstall(context: PluginContext): void {
      context.logger.info('Watermark plugin installed')

      // 创建管理器实例
      const manager = new WatermarkManager()

      // 存储到插件存储
      context.storage.set('manager', manager)
    },

    afterLoad(context: PluginContext): void {
      const config = context.storage.get('config') as WatermarkConfig
      if (!config || !config.text && !config.image) {
        context.logger.debug('No watermark config found')
        return
      }

      const container = context.lottie.container as HTMLElement
      if (!container) {
        context.logger.warn('Container not found')
        return
      }

      const manager = context.storage.get('manager') as WatermarkManager
      if (manager) {
        manager.create(container)
        context.logger.info('Watermark created')
      }
    },

    onUninstall(context: PluginContext): void {
      const manager = context.storage.get('manager') as WatermarkManager
      if (manager) {
        manager.destroy()
      }
      context.storage.clear()
      context.logger.info('Watermark plugin uninstalled')
    }
  },

  config: {
    get(): WatermarkConfig {
      const storage = (this as any).context?.storage
      return storage?.get('config') || {}
    },

    set(config: WatermarkConfig): void {
      const context = (this as any).context
      if (!context) return

      context.storage.set('config', config)

      const manager = context.storage.get('manager') as WatermarkManager
      if (manager) {
        manager.update(config)
      }
    },

    validate(config: WatermarkConfig): boolean {
      if (!config) return false

      // 必须有文本或图片
      if (!config.text && !config.image) return false

      // 验证位置
      const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center']
      if (config.position && !validPositions.includes(config.position)) return false

      // 验证透明度
      if (config.opacity !== undefined && (config.opacity < 0 || config.opacity > 1)) return false

      return true
    }
  }
})

