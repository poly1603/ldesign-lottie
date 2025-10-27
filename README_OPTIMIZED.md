# 🚀 @ldesign/lottie - 优化版

> 高性能、功能丰富的 Lottie 动画库，支持 WebGL 渲染、WebAssembly 加速和 AI 优化

[![npm version](https://img.shields.io/npm/v/@ldesign/lottie.svg)](https://www.npmjs.com/package/@ldesign/lottie)
[![License](https://img.shields.io/npm/l/@ldesign/lottie.svg)](https://github.com/ldesign/lottie/blob/master/LICENSE)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/@ldesign/lottie)](https://bundlephobia.com/package/@ldesign/lottie)

## ✨ 特性

- 🎨 **多渲染器支持** - SVG、Canvas、WebGL 自由切换
- ⚡ **WebAssembly 加速** - 核心计算性能提升 3-5 倍
- 🤖 **AI 智能优化** - 自动性能调优和设备适配
- 🔌 **插件系统** - 可扩展的架构设计
- 🎬 **导出功能** - 支持视频、GIF、图片序列导出
- 📹 **实时录制** - 录制动画为视频文件
- 🎯 **特效系统** - WebGL 着色器和粒子特效
- 💾 **智能缓存** - 自动内存管理和资源优化
- 📱 **响应式设计** - 完美适配各种设备

## 📦 安装

```bash
npm install @ldesign/lottie
# 或
yarn add @ldesign/lottie
# 或
pnpm add @ldesign/lottie
```

## 🚀 快速开始

### 基础使用

```typescript
import { createLottie } from '@ldesign/lottie'

const animation = createLottie({
  container: document.getElementById('lottie-container'),
  path: '/path/to/animation.json',
  renderer: 'svg',
  loop: true,
  autoplay: true
})
```

### WebGL 渲染（高性能）

```typescript
import { createLottie } from '@ldesign/lottie'

const animation = createLottie({
  container: document.getElementById('lottie-container'),
  path: '/path/to/animation.json',
  renderer: 'webgl', // 使用 WebGL 渲染
  quality: 'high',
  advanced: {
    enableGPUAcceleration: true
  }
})
```

### WebAssembly 加速

```typescript
import { initWASM, createLottie } from '@ldesign/lottie'

// 初始化 WASM（只需执行一次）
await initWASM()

const animation = createLottie({
  container: document.getElementById('lottie-container'),
  path: '/path/to/animation.json',
  advanced: {
    enableWASM: true // 启用 WASM 加速
  }
})
```

### AI 自动优化

```typescript
import { createLottie, AIOptimizer } from '@ldesign/lottie'

// 创建动画
const animation = createLottie({
  container: document.getElementById('lottie-container'),
  path: '/path/to/animation.json'
})

// AI 分析和优化
const optimizer = AIOptimizer.getInstance()
const result = await optimizer.analyzeAnimation(animation)

// 自动应用优化建议
if (result.suggestions.length > 0) {
  const config = optimizer.generateAdaptiveConfig()
  animation.updateConfig(config)
}
```

## 🔧 高级功能

### 插件系统

```typescript
import { 
  pluginManager, 
  WatermarkPlugin,
  AutoSavePlugin,
  KeyboardShortcutsPlugin 
} from '@ldesign/lottie'

// 注册插件
pluginManager.register([
  WatermarkPlugin,
  AutoSavePlugin,
  KeyboardShortcutsPlugin
])

// 使用水印插件
await pluginManager.loadPlugin(animation, 'watermark')
WatermarkPlugin.setConfig({
  text: '© 2024 My Company',
  position: 'bottom-right',
  opacity: 0.5
})

// 使用自动保存插件
await pluginManager.loadPlugin(animation, 'auto-save')
AutoSavePlugin.setConfig({
  enabled: true,
  interval: 5000
})

// 使用键盘快捷键插件
await pluginManager.loadPlugin(animation, 'keyboard-shortcuts')
```

### 特效系统

```typescript
// CSS 滤镜
animation.effects.addFilter('blur', { radius: 5 })
animation.effects.addFilter('brightness', { value: 1.2 })

// WebGL 着色器特效
animation.effects.addShaderEffect('glitch', 'glitch', {
  intensity: 0.5,
  frequency: 0.1
})

// 粒子系统
animation.effects.addParticleSystem('snow', {
  count: 1000,
  speed: { min: 1, max: 3 },
  size: { min: 2, max: 6 },
  color: ['#ffffff', '#f0f0f0'],
  behavior: 'fall'
})
```

### 导出功能

```typescript
// 导出为视频
const videoBlob = await animation.export.exportVideo({
  format: 'webm',
  quality: 0.9,
  fps: 60,
  duration: 5000
})

// 导出为 GIF
const gifBlob = await animation.export.exportGIF({
  width: 500,
  height: 500,
  fps: 30,
  quality: 0.8
})

// 导出为图片序列
const frames = await animation.export.exportPNGSequence({
  fps: 30,
  startTime: 0,
  endTime: 3000
})
```

### 实时录制

```typescript
// 开始录制
await animation.recording.start({
  mimeType: 'video/webm',
  videoBitsPerSecond: 5000000,
  fps: 60
})

// 执行动画操作...
animation.play()

// 停止录制并获取视频
const blob = await animation.recording.stop()

// 下载录制的视频
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'animation.webm'
a.click()
```

## 🎮 控制方法

```typescript
// 基础控制
animation.play()
animation.pause()
animation.stop()
animation.goToAndPlay(1000) // 跳转到 1000ms 并播放
animation.goToAndStop(50, true) // 跳转到第 50 帧并停止

// 速度控制
animation.setSpeed(2) // 2倍速播放
animation.setDirection(-1) // 反向播放

// 循环控制
animation.setLoop(true)
animation.setLoopCount(3) // 循环 3 次

// 渲染器切换
animation.switchRenderer('webgl') // 动态切换到 WebGL

// 质量调节
animation.setQuality('low') // 'low' | 'medium' | 'high' | 'auto'
```

## 📊 性能监控

```typescript
import { PerformanceMonitor } from '@ldesign/lottie'

const monitor = PerformanceMonitor.getInstance()

// 开始监控
monitor.startMonitoring(animation)

// 获取性能指标
const metrics = monitor.getMetrics()
console.log(`FPS: ${metrics.fps}`)
console.log(`内存: ${metrics.memory} MB`)
console.log(`CPU: ${metrics.cpuUsage}%`)

// 性能报告
const report = monitor.generateReport()
console.log(report)
```

## 🎯 最佳实践

### 1. 根据设备选择渲染器

```typescript
import { getDeviceInfo, createLottie } from '@ldesign/lottie'

const deviceInfo = getDeviceInfo()
let renderer = 'svg'

if (deviceInfo.tier === 'high' && deviceInfo.gpu.includes('NVIDIA')) {
  renderer = 'webgl'
} else if (deviceInfo.tier === 'medium') {
  renderer = 'canvas'
}

const animation = createLottie({
  container: document.getElementById('lottie-container'),
  path: '/animation.json',
  renderer
})
```

### 2. 使用批量渲染

```typescript
import { batchRenderer } from '@ldesign/lottie'

// 批量创建多个动画
const animations = [
  { container: 'lottie1', path: '/anim1.json' },
  { container: 'lottie2', path: '/anim2.json' },
  { container: 'lottie3', path: '/anim3.json' }
]

animations.forEach(config => {
  batchRenderer.add({
    id: config.container,
    container: document.getElementById(config.container),
    config: { path: config.path }
  })
})

// 统一渲染
batchRenderer.render()
```

### 3. 内存优化

```typescript
import { memoryManager } from '@ldesign/lottie'

// 设置内存限制
memoryManager.setMemoryLimit(100) // 100 MB

// 监听内存压力
memoryManager.on('pressure', (event) => {
  console.log('内存压力:', event.level)
  // 降低动画质量或停止非关键动画
})

// 手动清理
memoryManager.clearCache()
```

## 📖 完整文档

查看 [完整文档](./docs/README.md) 获取更多信息：

- [API 参考](./docs/api/README.md)
- [插件开发](./docs/plugins/README.md)
- [性能优化指南](./docs/performance.md)
- [示例代码](./examples/README.md)

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT © [LDesign Team]

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ldesign/lottie&type=Date)](https://star-history.com/#ldesign/lottie&Date)

---

<p align="center">Made with ❤️ by LDesign Team</p>



