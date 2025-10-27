/**
 * 高级功能集合
 * 包含音效同步、过渡效果、主题系统、数据绑定、无障碍支持等
 * 
 * 注意：这个文件已弃用，所有高级功能都在各自的模块中实现
 * 此文件仅保留用于向后兼容的导出
 */

// 重新导出所有高级功能
export { AudioSync } from './AudioSync'
export type { AudioSyncConfig, AudioMarker } from './AudioSync'

export { TransitionManager } from './TransitionManager'
export type { TransitionConfig, TransitionType, TransitionDirection, EasingFunction } from './TransitionManager'

export { ThemeManager } from './ThemeManager'
export type { ThemeConfig, ColorMap, ColorReplaceOptions } from './ThemeManager'

export { DataBinding } from './DataBinding'
export type { DataBindingConfig, Validator, TransformPipe } from './DataBinding'

export { AccessibilityManager } from './AccessibilityManager'
export type { AccessibilityConfig } from './AccessibilityManager'

export { PreloadQueue } from './PreloadQueue'
export type { PreloadItem, PreloadProgress, PreloadOptions } from './PreloadQueue'

export { GestureController } from './GestureController'
export type { GestureConfig, GestureType, GestureEvent } from './GestureController'