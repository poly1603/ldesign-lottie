# 🚀 Lottie 库快速开始指南

## 📦 安装

```bash
npm install @ldesign/lottie
```

## 🎯 5分钟上手

### 1. 基础使用

```typescript
import { createLottie } from '@ldesign/lottie'

// 创建动画
const animation = createLottie({
  container: '#lottie',      // 容器选择器或元素
  path: 'animation.json',     // 动画文件路径
  loop: true,                 // 循环播放
  autoplay: true              // 自动播放
})

// 控制动画
animation.play()
animation.pause()
animation.stop()
```

### 2. 响应式配置（自动适配设备）

```typescript
const animation = createLottie({
  container: '#lottie',
  path: 'animation.json',
  advanced: {
    enableSmartFrameSkip: true,    // 智能跳帧
    enableAutoDegradation: true,    // 自动降级
    targetFPS: 30                   // 目标帧率
  }
})
```

### 3. 性能监控

```typescript
const animation = createLottie({
  container: '#lottie',
  path: 'animation.json',
  advanced: {
    enablePerformanceMonitor: true
  },
  events: {
    performanceWarning: (metrics) => {
      console.log('FPS:', metrics.fps)
      console.log('内存:', metrics.memory, 'MB')
    }
  }
})
```

## 🎨 高级功能

### 时间线控制

```typescript
import { TimelineController } from '@ldesign/lottie'

const timeline = new TimelineController(animation, {
  duration: 5,
  fps: 60
})

// 添加关键帧
const track = timeline.addTrack('opacity')
timeline.addKeyframe(track, { time: 0, value: 0, easing: 'easeIn' })
timeline.addKeyframe(track, { time: 2, value: 1, easing: 'easeOut' })

timeline.play()
```

### 拖拽交互

```typescript
import { DragController } from '@ldesign/lottie'

const drag = new DragController(animation, {
  axis: 'x',                  // 拖拽方向
  mapToProgress: true         // 映射到动画进度
})

drag.on('drag', (e) => {
  console.log('进度:', e.progress)
})
```

### 数据绑定

```typescript
import { DataBinding, Validators, Pipes } from '@ldesign/lottie'

const binding = new DataBinding(animation)

binding.bind({
  path: 'count',
  target: 'counterText',
  property: 'text',
  pipes: [Pipes.toNumber(), Pipes.round(0)]
})

// 更新数据自动更新动画
binding.update('count', 42)
```

### 实时数据源

```typescript
import { DataSourceFactory } from '@ldesign/lottie'

// WebSocket 实时数据
const ws = DataSourceFactory.create({
  type: 'websocket',
  url: 'wss://api.example.com/live'
})

ws.on('data', (data) => {
  binding.update('liveData', data)
})

await ws.connect()
```

## 🔧 调试工具

### 调试面板

```typescript
import { DebugPanel } from '@ldesign/lottie'

const debug = new DebugPanel(animation, {
  position: 'top-right',
  showChart: true
})

debug.show()  // 显示调试面板
```

### 性能分析

```typescript
import { Profiler } from '@ldesign/lottie'

const profiler = new Profiler(animation, {
  duration: 5000  // 分析5秒
})

const report = await profiler.start()

console.log('性能评分:', report.score)      // 0-100
console.log('平均FPS:', report.avgFps)
console.log('内存峰值:', report.peakMemory)
console.log('优化建议:', report.suggestions)
```

## ⚡ 性能优化

### 资源压缩

```typescript
import { resourceCompressor } from '@ldesign/lottie'

// 加载原始动画数据
const response = await fetch('animation.json')
const data = await response.json()

// 压缩优化
const result = await resourceCompressor.compress(data, {
  compressPaths: true,        // 压缩路径
  removeRedundant: true,      // 移除冗余
  precision: 2                // 精度
})

console.log('压缩率:', result.compressionRatio)  // 例如: 0.35 (35%)

// 使用压缩后的数据
const animation = createLottie({
  container: '#lottie',
  animationData: result.data  // 使用压缩数据
})
```

### Worker 加速

```typescript
import { workerManager } from '@ldesign/lottie'

// 在 Worker 中解析动画（不阻塞主线程）
const parsed = await workerManager.parseAnimation(data)

// 在 Worker 中压缩
const compressed = await workerManager.compressAnimation(data)
```

## 📱 框架集成

### Vue 3

```vue
<script setup>
import { useLottie } from '@ldesign/lottie/vue'

const { containerRef, play, pause, stop } = useLottie({
  path: 'animation.json',
  loop: true
})
</script>

<template>
  <div>
    <div ref="containerRef"></div>
    <button @click="play">播放</button>
    <button @click="pause">暂停</button>
  </div>
</template>
```

### React

```tsx
import { useLottie } from '@ldesign/lottie/react'

function MyComponent() {
  const { containerRef, play, pause } = useLottie({
    path: 'animation.json',
    loop: true
  })

  return (
    <div>
      <div ref={containerRef} />
      <button onClick={play}>播放</button>
      <button onClick={pause}>暂停</button>
    </div>
  )
}
```

### Web Components

```html
<!-- 任何框架都可以使用 -->
<lottie-animation 
  src="animation.json" 
  loop="true" 
  autoplay="true">
</lottie-animation>

<script>
  const lottie = document.querySelector('lottie-animation')
  lottie.play()
</script>
```

## 💡 实用技巧

### 1. 预加载动画

```typescript
import { lottieManager } from '@ldesign/lottie'

// 提前加载，提升用户体验
await lottieManager.preload('animation1.json')
await lottieManager.preload('animation2.json')

// 批量预加载
await lottieManager.preloadBatch([
  'anim1.json',
  'anim2.json',
  'anim3.json'
])
```

### 2. 内存管理

```typescript
import { memoryManager } from '@ldesign/lottie'

// 监控内存
memoryManager.startMonitoring()

memoryManager.onMemoryPressure((event) => {
  if (event.stats.status === 'critical') {
    // 暂停不重要的动画
    lottieManager.pauseAll()
  }
})
```

### 3. 批量控制

```typescript
import { lottieManager } from '@ldesign/lottie'

// 创建多个实例
const anim1 = lottieManager.create({ /* ... */ })
const anim2 = lottieManager.create({ /* ... */ })

// 统一控制
lottieManager.playAll()
lottieManager.pauseAll()
lottieManager.setGlobalSpeed(0.5)

// 查看统计
const stats = lottieManager.getGlobalStats()
console.log('活动实例:', stats.activeInstances)
console.log('平均FPS:', stats.averageFps)
```

### 4. 验证和转换

```typescript
import { DataBinding, Validators, Pipes } from '@ldesign/lottie'

const binding = new DataBinding(animation)

binding.bind({
  path: 'price',
  target: 'priceText',
  property: 'text',
  validators: [
    Validators.required(),
    Validators.number(),
    Validators.min(0)
  ],
  pipes: [
    Pipes.round(2),
    Pipes.currency('USD')
  ]
})

binding.update('price', 99.99)  // 显示: $99.99
```

## 📊 场景示例

### 加载动画

```typescript
// 页面加载动画
const loader = createLottie({
  container: '#loader',
  path: 'loading.json',
  loop: true,
  autoplay: true
})

// 数据加载完成后
fetchData().then(() => {
  loader.stop()
  loader.destroy()
})
```

### 按钮交互

```typescript
const button = createLottie({
  container: '#button',
  path: 'button.json',
  autoplay: false
})

document.querySelector('#button').addEventListener('click', () => {
  button.play()
})
```

### 进度条

```typescript
const progress = createLottie({
  container: '#progress',
  path: 'progress.json',
  loop: false,
  autoplay: false
})

// 更新进度
function updateProgress(percent) {
  const totalFrames = progress.animation.totalFrames
  const frame = (percent / 100) * totalFrames
  progress.goToAndStop(frame, true)
}

updateProgress(75)  // 75%
```

### 数据可视化

```typescript
import { DataBinding, Pipes } from '@ldesign/lottie'

const chart = createLottie({
  container: '#chart',
  path: 'chart.json'
})

const binding = new DataBinding(chart)

// 绑定多个数据点
['jan', 'feb', 'mar', 'apr'].forEach((month, i) => {
  binding.bind({
    path: `sales.${month}`,
    target: `bar${i}`,
    property: 'scale',
    pipes: [Pipes.clamp(0, 100)]
  })
})

// 更新数据
binding.updateMany({
  'sales.jan': 45,
  'sales.feb': 67,
  'sales.mar': 89,
  'sales.apr': 72
})
```

## 🎓 下一步

- 📖 阅读完整 [API 文档](./API_REFERENCE.md)
- 🎨 查看[高级示例](./examples/advanced-features.html)
- 📊 了解[性能优化](./OPTIMIZATION_SUMMARY.md)
- 🔍 深入[实现细节](./IMPLEMENTATION_COMPLETE.md)

## 💬 获取帮助

- GitHub Issues
- 文档站点
- 社区讨论

---

**开始创建精彩的动画吧！** 🚀

