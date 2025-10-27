/**
 * 插件系统
 * 提供标准化的插件接口和生命周期管理
 */

import type { ILottieInstance, LottieConfig } from '../types'
import { EventEmitter } from 'eventemitter3'

export interface PluginMetadata {
  name: string
  version: string
  author?: string
  description?: string
  homepage?: string
  keywords?: string[]
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
}

export interface PluginContext {
  lottie: ILottieInstance
  config: LottieConfig
  utils: PluginUtils
  storage: PluginStorage
  logger: PluginLogger
}

export interface PluginUtils {
  // DOM 操作
  createElement(tag: string, attrs?: Record<string, any>): HTMLElement
  appendChild(parent: HTMLElement, child: HTMLElement): void
  removeElement(element: HTMLElement): void

  // 动画控制
  getCurrentFrame(): number
  getTotalFrames(): number
  goToFrame(frame: number): void

  // 事件
  emit(event: string, data?: any): void
  on(event: string, handler: Function): void
  off(event: string, handler: Function): void

  // 工具函数
  debounce(fn: Function, delay: number): Function
  throttle(fn: Function, delay: number): Function
  deepClone<T>(obj: T): T
  uuid(): string
}

export interface PluginStorage {
  get(key: string): any
  set(key: string, value: any): void
  remove(key: string): void
  clear(): void
  keys(): string[]
}

export interface PluginLogger {
  log(...args: any[]): void
  info(...args: any[]): void
  warn(...args: any[]): void
  error(...args: any[]): void
  debug(...args: any[]): void
}

export interface PluginHooks {
  // 生命周期钩子
  onInstall?(context: PluginContext): void | Promise<void>
  onUninstall?(context: PluginContext): void | Promise<void>
  onActivate?(context: PluginContext): void | Promise<void>
  onDeactivate?(context: PluginContext): void | Promise<void>

  // 动画钩子
  beforeLoad?(context: PluginContext): void | Promise<void>
  afterLoad?(context: PluginContext): void | Promise<void>
  beforePlay?(context: PluginContext): boolean | Promise<boolean>
  afterPlay?(context: PluginContext): void | Promise<void>
  beforePause?(context: PluginContext): boolean | Promise<boolean>
  afterPause?(context: PluginContext): void | Promise<void>
  beforeStop?(context: PluginContext): boolean | Promise<boolean>
  afterStop?(context: PluginContext): void | Promise<void>
  onFrame?(context: PluginContext, frame: number): void
  onLoop?(context: PluginContext, loopCount: number): void

  // 渲染钩子
  beforeRender?(context: PluginContext): void | Promise<void>
  afterRender?(context: PluginContext): void | Promise<void>

  // 错误处理
  onError?(context: PluginContext, error: Error): void
}

export interface Plugin extends PluginHooks {
  metadata: PluginMetadata

  // 可选的 UI 组件
  renderUI?(container: HTMLElement): void
  updateUI?(state: any): void
  destroyUI?(): void

  // 可选的配置
  getConfig?(): any
  setConfig?(config: any): void
  validateConfig?(config: any): boolean

  // 可选的 API 扩展
  extend?(api: any): void
}

/**
 * 插件加载器
 */
export class PluginLoader {
  private plugins = new Map<string, Plugin>()
  private loadedPlugins = new Set<string>()
  private pluginOrder: string[] = []

  /**
   * 注册插件
   */
  register(plugin: Plugin): void {
    const { name } = plugin.metadata

    if (this.plugins.has(name)) {
      console.warn(`[PluginLoader] Plugin "${name}" already registered`)
      return
    }

    this.validatePlugin(plugin)
    this.plugins.set(name, plugin)
    this.pluginOrder.push(name)

    console.log(`[PluginLoader] Registered plugin: ${name}`)
  }

  /**
   * 验证插件
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.metadata) {
      throw new Error('Plugin must have metadata')
    }

    if (!plugin.metadata.name) {
      throw new Error('Plugin must have a name')
    }

    if (!plugin.metadata.version) {
      throw new Error('Plugin must have a version')
    }

    // 验证版本格式（简单的 semver 检查）
    const versionRegex = /^\d+\.\d+\.\d+/
    if (!versionRegex.test(plugin.metadata.version)) {
      throw new Error('Invalid plugin version format')
    }
  }

  /**
   * 加载插件
   */
  async load(name: string, context: PluginContext): Promise<void> {
    const plugin = this.plugins.get(name)

    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`)
    }

    if (this.loadedPlugins.has(name)) {
      console.warn(`[PluginLoader] Plugin "${name}" already loaded`)
      return
    }

    // 检查依赖
    await this.checkDependencies(plugin)

    // 安装插件
    if (plugin.onInstall) {
      await plugin.onInstall(context)
    }

    // 激活插件
    if (plugin.onActivate) {
      await plugin.onActivate(context)
    }

    this.loadedPlugins.add(name)
    console.log(`[PluginLoader] Loaded plugin: ${name}`)
  }

  /**
   * 卸载插件
   */
  async unload(name: string, context: PluginContext): Promise<void> {
    const plugin = this.plugins.get(name)

    if (!plugin) {
      throw new Error(`Plugin "${name}" not found`)
    }

    if (!this.loadedPlugins.has(name)) {
      console.warn(`[PluginLoader] Plugin "${name}" not loaded`)
      return
    }

    // 停用插件
    if (plugin.onDeactivate) {
      await plugin.onDeactivate(context)
    }

    // 卸载插件
    if (plugin.onUninstall) {
      await plugin.onUninstall(context)
    }

    // 销毁 UI
    if (plugin.destroyUI) {
      plugin.destroyUI()
    }

    this.loadedPlugins.delete(name)
    console.log(`[PluginLoader] Unloaded plugin: ${name}`)
  }

  /**
   * 检查依赖
   */
  private async checkDependencies(plugin: Plugin): Promise<void> {
    if (!plugin.metadata.dependencies) return

    for (const [dep, version] of Object.entries(plugin.metadata.dependencies)) {
      const depPlugin = this.plugins.get(dep)

      if (!depPlugin) {
        throw new Error(`Missing dependency: ${dep}`)
      }

      if (!this.loadedPlugins.has(dep)) {
        throw new Error(`Dependency not loaded: ${dep}`)
      }

      // 简单的版本检查
      if (!this.checkVersion(depPlugin.metadata.version, version)) {
        throw new Error(`Incompatible version for ${dep}: required ${version}, found ${depPlugin.metadata.version}`)
      }
    }
  }

  /**
   * 检查版本兼容性
   */
  private checkVersion(current: string, required: string): boolean {
    // 简化的版本检查，实际应该使用 semver
    const currentParts = current.split('.').map(Number)
    const requiredParts = required.replace(/[\^~]/, '').split('.').map(Number)

    // 主版本必须相同
    if (currentParts[0] !== requiredParts[0]) return false

    // 次版本必须大于等于
    if (currentParts[1] < requiredParts[1]) return false

    return true
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取已加载的插件
   */
  getLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedPlugins).map(name => this.plugins.get(name)!).filter(Boolean)
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name)
  }

  /**
   * 清空所有插件
   */
  async clear(context: PluginContext): Promise<void> {
    for (const name of this.loadedPlugins) {
      await this.unload(name, context)
    }

    this.plugins.clear()
    this.loadedPlugins.clear()
    this.pluginOrder = []
  }
}

/**
 * 插件管理器
 */
export class PluginManager extends EventEmitter {
  private static instance: PluginManager | null = null
  private loader = new PluginLoader()
  private contexts = new Map<string, PluginContext>()
  private hooks = new Map<string, Set<Function>>()

  private constructor() {
    super()
  }

  /**
   * 获取单例实例
   */
  static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager()
    }
    return PluginManager.instance
  }

  /**
   * 注册插件
   */
  register(plugin: Plugin | Plugin[]): void {
    const plugins = Array.isArray(plugin) ? plugin : [plugin]

    for (const p of plugins) {
      this.loader.register(p)
      this.bindHooks(p)
    }
  }

  /**
   * 绑定钩子
   */
  private bindHooks(plugin: Plugin): void {
    const hookNames = [
      'beforeLoad', 'afterLoad',
      'beforePlay', 'afterPlay',
      'beforePause', 'afterPause',
      'beforeStop', 'afterStop',
      'beforeRender', 'afterRender',
      'onFrame', 'onLoop', 'onError'
    ]

    for (const hookName of hookNames) {
      const hook = plugin[hookName as keyof PluginHooks]
      if (hook) {
        if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, new Set())
        }
        this.hooks.get(hookName)!.add(hook.bind(plugin))
      }
    }
  }

  /**
   * 执行钩子
   */
  async executeHook(hookName: string, context: PluginContext, ...args: any[]): Promise<any> {
    const hooks = this.hooks.get(hookName)
    if (!hooks || hooks.size === 0) return

    const results = []

    for (const hook of hooks) {
      try {
        const result = await hook(context, ...args)
        results.push(result)

        // 如果是 before* 钩子返回 false，停止执行
        if (hookName.startsWith('before') && result === false) {
          return false
        }
      } catch (error) {
        console.error(`[PluginManager] Error in hook ${hookName}:`, error)
        this.emit('hookError', { hookName, error })
      }
    }

    return results
  }

  /**
   * 创建插件上下文
   */
  createContext(instance: ILottieInstance): PluginContext {
    const contextId = instance.id

    if (this.contexts.has(contextId)) {
      return this.contexts.get(contextId)!
    }

    const context: PluginContext = {
      lottie: instance,
      config: instance.config,
      utils: this.createUtils(instance),
      storage: this.createStorage(contextId),
      logger: this.createLogger(contextId)
    }

    this.contexts.set(contextId, context)
    return context
  }

  /**
   * 创建工具函数
   */
  private createUtils(instance: ILottieInstance): PluginUtils {
    return {
      createElement(tag: string, attrs?: Record<string, any>): HTMLElement {
        const element = document.createElement(tag)
        if (attrs) {
          Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'style' && typeof value === 'object') {
              Object.assign(element.style, value)
            } else if (key === 'class') {
              element.className = value
            } else {
              element.setAttribute(key, value)
            }
          })
        }
        return element
      },

      appendChild(parent: HTMLElement, child: HTMLElement): void {
        parent.appendChild(child)
      },

      removeElement(element: HTMLElement): void {
        element.remove()
      },

      getCurrentFrame(): number {
        return instance.animation?.currentFrame || 0
      },

      getTotalFrames(): number {
        return instance.animation?.totalFrames || 0
      },

      goToFrame(frame: number): void {
        instance.animation?.goToAndStop(frame, true)
      },

      emit: (event: string, data?: any) => {
        instance.emit(event, data)
      },

      on: (event: string, handler: Function) => {
        instance.on(event, handler)
      },

      off: (event: string, handler: Function) => {
        instance.off(event, handler)
      },

      debounce(fn: Function, delay: number): Function {
        let timeoutId: NodeJS.Timeout
        return function (...args: any[]) {
          clearTimeout(timeoutId)
          timeoutId = setTimeout(() => fn.apply(this, args), delay)
        }
      },

      throttle(fn: Function, delay: number): Function {
        let lastCall = 0
        return function (...args: any[]) {
          const now = Date.now()
          if (now - lastCall >= delay) {
            lastCall = now
            return fn.apply(this, args)
          }
        }
      },

      deepClone<T>(obj: T): T {
        return JSON.parse(JSON.stringify(obj))
      },

      uuid(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0
          const v = c === 'x' ? r : (r & 0x3 | 0x8)
          return v.toString(16)
        })
      }
    }
  }

  /**
   * 创建存储
   */
  private createStorage(contextId: string): PluginStorage {
    const storageKey = `lottie-plugin-${contextId}`

    return {
      get(key: string): any {
        const data = localStorage.getItem(`${storageKey}-${key}`)
        return data ? JSON.parse(data) : null
      },

      set(key: string, value: any): void {
        localStorage.setItem(`${storageKey}-${key}`, JSON.stringify(value))
      },

      remove(key: string): void {
        localStorage.removeItem(`${storageKey}-${key}`)
      },

      clear(): void {
        const keys = this.keys()
        keys.forEach(key => this.remove(key))
      },

      keys(): string[] {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(storageKey)) {
            keys.push(key.replace(`${storageKey}-`, ''))
          }
        }
        return keys
      }
    }
  }

  /**
   * 创建日志记录器
   */
  private createLogger(contextId: string): PluginLogger {
    const prefix = `[Plugin:${contextId}]`

    return {
      log(...args: any[]): void {
        console.log(prefix, ...args)
      },

      info(...args: any[]): void {
        console.info(prefix, ...args)
      },

      warn(...args: any[]): void {
        console.warn(prefix, ...args)
      },

      error(...args: any[]): void {
        console.error(prefix, ...args)
      },

      debug(...args: any[]): void {
        if (process.env.NODE_ENV === 'development') {
          console.debug(prefix, ...args)
        }
      }
    }
  }

  /**
   * 加载插件到实例
   */
  async loadPlugin(instance: ILottieInstance, pluginName: string): Promise<void> {
    const context = this.createContext(instance)
    await this.loader.load(pluginName, context)
  }

  /**
   * 卸载插件
   */
  async unloadPlugin(instance: ILottieInstance, pluginName: string): Promise<void> {
    const context = this.createContext(instance)
    await this.loader.unload(pluginName, context)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): Plugin[] {
    return this.loader.getAllPlugins()
  }

  /**
   * 获取已加载的插件
   */
  getLoadedPlugins(): Plugin[] {
    return this.loader.getLoadedPlugins()
  }

  /**
   * 销毁
   */
  async destroy(): void {
    for (const context of this.contexts.values()) {
      await this.loader.clear(context)
    }

    this.contexts.clear()
    this.hooks.clear()
    this.removeAllListeners()

    PluginManager.instance = null
  }
}

// 导出便捷函数
export const pluginManager = PluginManager.getInstance()

/**
 * 创建插件的辅助函数
 */
export function createPlugin(options: {
  metadata: PluginMetadata
  hooks?: Partial<PluginHooks>
  ui?: {
    render?: (container: HTMLElement) => void
    update?: (state: any) => void
    destroy?: () => void
  }
  config?: {
    get?: () => any
    set?: (config: any) => void
    validate?: (config: any) => boolean
  }
  extend?: (api: any) => void
}): Plugin {
  return {
    metadata: options.metadata,
    ...options.hooks,
    renderUI: options.ui?.render,
    updateUI: options.ui?.update,
    destroyUI: options.ui?.destroy,
    getConfig: options.config?.get,
    setConfig: options.config?.set,
    validateConfig: options.config?.validate,
    extend: options.extend
  }
}

