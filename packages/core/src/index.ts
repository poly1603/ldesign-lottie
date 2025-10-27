// 核心功能
export { LottieManager, lottieManager } from './core/LottieManager'
export { LottieInstance } from './core/LottieInstance'
export { InstancePool } from './core/InstancePool'
export { CacheManager } from './core/CacheManager'
export { PerformanceMonitor } from './core/PerformanceMonitor'
export { AnimationSequence } from './core/AnimationSequence'
export { InteractiveController } from './core/InteractiveController'

// 高级功能
export { AudioSync } from './core/AudioSync'
export { TransitionManager } from './core/TransitionManager'
export { ThemeManager } from './core/ThemeManager'
export { DataBinding } from './core/DataBinding'
export { DataSourceFactory, APIDataSource, WebSocketDataSource, SSEDataSource, PollingDataSource } from './core/DataSource'
export { Validators, Pipes } from './core/ValidationPipes'
export { ChartAdapter } from './core/ChartAdapter'
export { AccessibilityManager } from './core/AccessibilityManager'
export { PreloadQueue } from './core/PreloadQueue'
export { GestureController } from './core/GestureController'
export { TimelineController } from './core/TimelineController'
export { DragController } from './core/DragController'
export { DebugPanel } from './core/DebugPanel'
export { Profiler } from './core/Profiler'
export { ResourceCompressor, resourceCompressor } from './core/ResourceCompressor'
export { EffectsManager } from './core/EffectsManager'
export { FilterPipeline } from './core/FilterPipeline'
export { ExportManager } from './core/ExportManager'
export { RecordingController } from './core/RecordingController'
export { WebGLRenderer, isWebGLSupported, isWebGL2Supported } from './core/WebGLRenderer'

// 高级功能类型
export type { AudioSyncConfig, AudioMarker } from './core/AudioSync'
export type { TransitionConfig, TransitionType, TransitionDirection, EasingFunction as TransitionEasing } from './core/TransitionManager'
export type { ThemeConfig, ColorMap, ColorReplaceOptions } from './core/ThemeManager'
export type { DataBindingConfig, Validator, TransformPipe } from './core/DataBinding'
export type { DataSourceConfig, DataSourceType } from './core/DataSource'
export type { ChartType, ChartData, ChartDataset, ChartOptions, ChartConfig } from './core/ChartAdapter'
export type { AccessibilityConfig } from './core/AccessibilityManager'
export type { PreloadItem, PreloadProgress, PreloadOptions } from './core/PreloadQueue'
export type { GestureConfig, GestureType, GestureEvent } from './core/GestureController'
export type { TimelineConfig, Keyframe, Track, EasingFunction } from './core/TimelineController'
export type { DragConfig, DragEvent } from './core/DragController'
export type { DebugPanelConfig } from './core/DebugPanel'
export type { ProfilerConfig, PerformanceReport, Bottleneck, ProfileSample } from './core/Profiler'
export type { CompressionOptions, CompressionResult } from './core/ResourceCompressor'
export type { FilterType, FilterEffect, ParticleConfig, ShaderConfig, WebGLEffect } from './core/EffectsManager'
export { PRESET_SHADERS } from './core/EffectsManager'
export type { FilterPreset, PipelineConfig } from './core/FilterPipeline'
export type { ExportFormat, ExportOptions, ExportResult } from './core/ExportManager'
export type { RecordingConfig, RecordingState } from './core/RecordingController'

// 性能优化功能
export { WorkerManager, workerManager } from './core/WorkerManager'
export { VirtualRenderer } from './core/VirtualRenderer'
export { MemoryManager, memoryManager } from './core/MemoryManager'
export { BatchRenderer, batchRenderer } from './core/BatchRenderer'
export { AdaptiveFrameRate } from './core/AdaptiveFrameRate'
export { WASMCore, initWASM, WASMMatrix, WASMBezier, WASMPath, WASMColor, WASMEasing, WASMSIMD } from './core/WASMCore'
export { AIOptimizer, aiOptimizer } from './core/AIOptimizer'

// 性能优化类型
export type { WorkerManagerConfig, WorkerTask } from './core/WorkerManager'
export type { VirtualRendererConfig, VirtualStats } from './core/VirtualRenderer'
export type { MemoryManagerConfig, MemoryStats, MemoryPressureEvent } from './core/MemoryManager'
export type { BatchRendererConfig, RenderTask } from './core/BatchRenderer'
export type { AdaptiveFrameRateConfig, FrameRateStats } from './core/AdaptiveFrameRate'
export type { OptimizationSuggestion, DeviceProfile, OptimizationResult, AIOptimizerConfig } from './core/AIOptimizer'

// 导出设备检测工具
export {
  DeviceDetector,
  ResponsiveObserver,
  getDeviceInfo,
  getRecommendedConfig,
  type DeviceType,
  type PerformanceTier,
  type DeviceInfo,
} from './utils/device'

// 插件系统
export {
  PluginManager,
  pluginManager,
  PluginLoader,
  createPlugin
} from './core/PluginSystem'

export type {
  Plugin,
  PluginMetadata,
  PluginContext,
  PluginHooks,
  PluginUtils,
  PluginStorage,
  PluginLogger
} from './core/PluginSystem'

// 内置插件
export { WatermarkPlugin } from './plugins/WatermarkPlugin'
export { AutoSavePlugin } from './plugins/AutoSavePlugin'
export { KeyboardShortcutsPlugin } from './plugins/KeyboardShortcutsPlugin'

export type { WatermarkConfig } from './plugins/WatermarkPlugin'
export type { AutoSaveConfig } from './plugins/AutoSavePlugin'
export type { ShortcutConfig } from './plugins/KeyboardShortcutsPlugin'

export type * from './types'

/**
 * 简化的 API
 */
import { lottieManager } from './core/LottieManager'
import type { LottieConfig, ILottieInstance } from './types'

/**
 * 创建 Lottie 实例的简化函数
 */
export function createLottie(config: LottieConfig): ILottieInstance {
  const instance = lottieManager.create(config)

  // 自动加载
  instance.load().catch(err => {
    console.error('[Lottie] Failed to load animation:', err)
  })

  return instance
}

/**
 * 从路径快速创建并播放
 */
export async function loadLottie(
  container: HTMLElement | string,
  path: string,
  options?: Partial<LottieConfig>
): Promise<ILottieInstance> {
  const instance = lottieManager.create({
    container,
    path,
    autoplay: true,
    ...options,
  })

  await instance.load()
  return instance
}

/**
 * 从���据快速创建并播放
 */
export function loadLottieFromData(
  container: HTMLElement | string,
  animationData: any,
  options?: Partial<LottieConfig>
): ILottieInstance {
  const instance = lottieManager.create({
    container,
    animationData,
    autoplay: true,
    ...options,
  })

  instance.load().catch(err => {
    console.error('[Lottie] Failed to load animation:', err)
  })

  return instance
}

/**
 * 默认导出
 */
export default {
  manager: lottieManager,
  create: createLottie,
  loadFromPath: loadLottie,
  loadFromData: loadLottieFromData,
}
