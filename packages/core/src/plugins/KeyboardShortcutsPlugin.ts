/**
 * 键盘快捷键插件
 * 为 Lottie 动画添加键盘控制
 */

import { createPlugin } from '../core/PluginSystem'
import type { PluginContext } from '../core/PluginSystem'

export interface ShortcutConfig {
  enabled?: boolean
  preventDefault?: boolean
  shortcuts?: {
    play?: string[]
    pause?: string[]
    stop?: string[]
    togglePlay?: string[]
    speedUp?: string[]
    speedDown?: string[]
    nextFrame?: string[]
    prevFrame?: string[]
    firstFrame?: string[]
    lastFrame?: string[]
    toggleLoop?: string[]
    toggleMute?: string[]
    fullscreen?: string[]
  }
}

interface Shortcut {
  keys: string[]
  action: (context: PluginContext) => void
  description: string
}

class KeyboardManager {
  private shortcuts: Map<string, Shortcut> = new Map()
  private pressedKeys: Set<string> = new Set()
  private context: PluginContext | null = null
  private config: Required<ShortcutConfig> = {
    enabled: true,
    preventDefault: true,
    shortcuts: {
      play: ['Enter'],
      pause: ['Escape'],
      stop: ['s'],
      togglePlay: [' '], // 空格键
      speedUp: ['+', '='],
      speedDown: ['-', '_'],
      nextFrame: ['ArrowRight', '>'],
      prevFrame: ['ArrowLeft', '<'],
      firstFrame: ['Home', '0'],
      lastFrame: ['End', '9'],
      toggleLoop: ['l'],
      toggleMute: ['m'],
      fullscreen: ['f']
    }
  }

  initialize(context: PluginContext, config?: ShortcutConfig): void {
    this.context = context
    this.updateConfig(config || {})

    if (this.config.enabled) {
      this.setupShortcuts()
      this.attachListeners()
    }
  }

  updateConfig(config: Partial<ShortcutConfig>): void {
    if (config.shortcuts) {
      this.config.shortcuts = { ...this.config.shortcuts, ...config.shortcuts }
    }
    if (config.enabled !== undefined) {
      this.config.enabled = config.enabled
    }
    if (config.preventDefault !== undefined) {
      this.config.preventDefault = config.preventDefault
    }

    // 重新设置快捷键
    this.setupShortcuts()
  }

  private setupShortcuts(): void {
    this.shortcuts.clear()

    // 播放/暂停
    this.addShortcut('togglePlay', this.config.shortcuts.togglePlay!,
      'Toggle play/pause', (ctx) => {
        if (ctx.lottie.state === 'playing') {
          ctx.lottie.pause()
        } else {
          ctx.lottie.play()
        }
      })

    // 播放
    this.addShortcut('play', this.config.shortcuts.play!,
      'Play animation', (ctx) => ctx.lottie.play())

    // 暂停
    this.addShortcut('pause', this.config.shortcuts.pause!,
      'Pause animation', (ctx) => ctx.lottie.pause())

    // 停止
    this.addShortcut('stop', this.config.shortcuts.stop!,
      'Stop animation', (ctx) => ctx.lottie.stop())

    // 加速
    this.addShortcut('speedUp', this.config.shortcuts.speedUp!,
      'Increase speed', (ctx) => {
        const currentSpeed = ctx.lottie.config.speed || 1
        ctx.lottie.setSpeed(Math.min(currentSpeed + 0.25, 5))
        ctx.logger.info(`Speed: ${ctx.lottie.config.speed}x`)
      })

    // 减速
    this.addShortcut('speedDown', this.config.shortcuts.speedDown!,
      'Decrease speed', (ctx) => {
        const currentSpeed = ctx.lottie.config.speed || 1
        ctx.lottie.setSpeed(Math.max(currentSpeed - 0.25, 0.25))
        ctx.logger.info(`Speed: ${ctx.lottie.config.speed}x`)
      })

    // 下一帧
    this.addShortcut('nextFrame', this.config.shortcuts.nextFrame!,
      'Next frame', (ctx) => {
        const currentFrame = ctx.utils.getCurrentFrame()
        const totalFrames = ctx.utils.getTotalFrames()
        const nextFrame = Math.min(currentFrame + 1, totalFrames - 1)
        ctx.utils.goToFrame(nextFrame)
      })

    // 上一帧
    this.addShortcut('prevFrame', this.config.shortcuts.prevFrame!,
      'Previous frame', (ctx) => {
        const currentFrame = ctx.utils.getCurrentFrame()
        const prevFrame = Math.max(currentFrame - 1, 0)
        ctx.utils.goToFrame(prevFrame)
      })

    // 第一帧
    this.addShortcut('firstFrame', this.config.shortcuts.firstFrame!,
      'Go to first frame', (ctx) => ctx.utils.goToFrame(0))

    // 最后一帧
    this.addShortcut('lastFrame', this.config.shortcuts.lastFrame!,
      'Go to last frame', (ctx) => {
        const totalFrames = ctx.utils.getTotalFrames()
        ctx.utils.goToFrame(totalFrames - 1)
      })

    // 切换循环
    this.addShortcut('toggleLoop', this.config.shortcuts.toggleLoop!,
      'Toggle loop', (ctx) => {
        const currentLoop = ctx.lottie.config.loop
        ctx.lottie.setLoop(!currentLoop)
        ctx.logger.info(`Loop: ${!currentLoop ? 'ON' : 'OFF'}`)
      })

    // 切换静音
    this.addShortcut('toggleMute', this.config.shortcuts.toggleMute!,
      'Toggle mute', (ctx) => {
        // 如果动画有音频
        if ((ctx.lottie.animation as any)?.audioController) {
          const audio = (ctx.lottie.animation as any).audioController
          audio.muted = !audio.muted
          ctx.logger.info(`Audio: ${audio.muted ? 'MUTED' : 'UNMUTED'}`)
        }
      })

    // 全屏
    this.addShortcut('fullscreen', this.config.shortcuts.fullscreen!,
      'Toggle fullscreen', (ctx) => {
        const container = ctx.lottie.container as HTMLElement
        if (!document.fullscreenElement) {
          container.requestFullscreen?.()
        } else {
          document.exitFullscreen?.()
        }
      })
  }

  private addShortcut(id: string, keys: string[], description: string, action: (context: PluginContext) => void): void {
    if (!keys || keys.length === 0) return

    this.shortcuts.set(id, {
      keys,
      action,
      description
    })
  }

  private attachListeners(): void {
    document.addEventListener('keydown', this.handleKeyDown)
    document.addEventListener('keyup', this.handleKeyUp)
  }

  private detachListeners(): void {
    document.removeEventListener('keydown', this.handleKeyDown)
    document.removeEventListener('keyup', this.handleKeyUp)
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.config.enabled || !this.context) return

    // 忽略输入框中的按键
    if (this.isInputElement(e.target as HTMLElement)) return

    const key = this.normalizeKey(e)
    this.pressedKeys.add(key)

    // 检查是否匹配快捷键
    for (const shortcut of this.shortcuts.values()) {
      if (this.matchesShortcut(shortcut.keys)) {
        if (this.config.preventDefault) {
          e.preventDefault()
          e.stopPropagation()
        }

        shortcut.action(this.context)
        break
      }
    }
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    const key = this.normalizeKey(e)
    this.pressedKeys.delete(key)
  }

  private normalizeKey(e: KeyboardEvent): string {
    let key = e.key

    // 组合键
    if (e.ctrlKey && key !== 'Control') key = `Ctrl+${key}`
    if (e.altKey && key !== 'Alt') key = `Alt+${key}`
    if (e.shiftKey && key !== 'Shift') key = `Shift+${key}`
    if (e.metaKey && key !== 'Meta') key = `Meta+${key}`

    return key
  }

  private matchesShortcut(keys: string[]): boolean {
    for (const key of keys) {
      if (this.pressedKeys.has(key)) {
        return true
      }
    }
    return false
  }

  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase()
    return tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element.contentEditable === 'true'
  }

  getShortcuts(): Map<string, Shortcut> {
    return new Map(this.shortcuts)
  }

  enable(): void {
    this.config.enabled = true
    this.attachListeners()
  }

  disable(): void {
    this.config.enabled = false
    this.detachListeners()
  }

  destroy(): void {
    this.detachListeners()
    this.shortcuts.clear()
    this.pressedKeys.clear()
    this.context = null
  }
}

// 创建插件
export const KeyboardShortcutsPlugin = createPlugin({
  metadata: {
    name: 'keyboard-shortcuts',
    version: '1.0.0',
    author: 'LDesign Team',
    description: 'Add keyboard shortcuts for Lottie animation control',
    keywords: ['keyboard', 'shortcuts', 'hotkeys', 'controls']
  },

  hooks: {
    onInstall(context: PluginContext): void {
      const manager = new KeyboardManager()
      context.storage.set('manager', manager)

      const config = context.storage.get('config') as ShortcutConfig
      manager.initialize(context, config)

      context.logger.info('Keyboard shortcuts installed')
    },

    onActivate(context: PluginContext): void {
      const manager = context.storage.get('manager') as KeyboardManager
      if (manager) {
        manager.enable()
        context.logger.info('Keyboard shortcuts activated')
      }
    },

    onDeactivate(context: PluginContext): void {
      const manager = context.storage.get('manager') as KeyboardManager
      if (manager) {
        manager.disable()
        context.logger.info('Keyboard shortcuts deactivated')
      }
    },

    onUninstall(context: PluginContext): void {
      const manager = context.storage.get('manager') as KeyboardManager
      if (manager) {
        manager.destroy()
      }
      context.storage.clear()
      context.logger.info('Keyboard shortcuts uninstalled')
    }
  },

  ui: {
    render(container: HTMLElement): void {
      const manager = (this as any).context?.storage.get('manager') as KeyboardManager
      if (!manager) return

      // 创建快捷键帮助面板
      const helpPanel = document.createElement('div')
      helpPanel.className = 'lottie-shortcuts-help'
      helpPanel.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px;
        border-radius: 5px;
        font-size: 12px;
        display: none;
        z-index: 10000;
        max-width: 300px;
      `

      // 添加快捷键列表
      const shortcuts = manager.getShortcuts()
      let html = '<h4 style="margin: 0 0 10px 0;">Keyboard Shortcuts</h4><ul style="list-style: none; padding: 0; margin: 0;">'

      shortcuts.forEach((shortcut, id) => {
        html += `<li style="margin: 5px 0;"><strong>${shortcut.keys.join(' / ')}</strong>: ${shortcut.description}</li>`
      })

      html += '</ul>'
      helpPanel.innerHTML = html

      // 添加帮助按钮
      const helpButton = document.createElement('button')
      helpButton.textContent = '?'
      helpButton.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        cursor: pointer;
        font-size: 16px;
        z-index: 9999;
      `

      helpButton.addEventListener('click', () => {
        helpPanel.style.display = helpPanel.style.display === 'none' ? 'block' : 'none'
      })

      container.appendChild(helpButton)
      container.appendChild(helpPanel)

      // 保存引用
      const context = (this as any).context
      if (context) {
        context.storage.set('helpPanel', helpPanel)
        context.storage.set('helpButton', helpButton)
      }
    },

    destroy(): void {
      const context = (this as any).context
      if (!context) return

      const helpPanel = context.storage.get('helpPanel')
      const helpButton = context.storage.get('helpButton')

      helpPanel?.remove()
      helpButton?.remove()
    }
  },

  config: {
    get(): ShortcutConfig {
      const storage = (this as any).context?.storage
      return storage?.get('config') || {}
    },

    set(config: ShortcutConfig): void {
      const context = (this as any).context
      if (!context) return

      context.storage.set('config', config)

      const manager = context.storage.get('manager') as KeyboardManager
      if (manager) {
        manager.updateConfig(config)
      }
    },

    validate(config: ShortcutConfig): boolean {
      if (!config) return true

      // 验证快捷键格式
      if (config.shortcuts) {
        for (const keys of Object.values(config.shortcuts)) {
          if (keys && !Array.isArray(keys)) {
            return false
          }
        }
      }

      return true
    }
  }
})

