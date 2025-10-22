# Lottie 库 API 参考文档

## 核心 API

### createLottie(config)

创建 Lottie 动画实例的简化函数。

```typescript
const instance = createLottie({
  container: '#lottie',
  path: 'animation.json',
  loop: true,
  autoplay: true,
  renderer: 'svg',
  advanced: {
    enableSmartFrameSkip: true,
    targetFPS: 60
  }
})
```

**参数:**
- `config: LottieConfig` - 动画配置对象

**返回:**
- `ILottieInstance` - 动画实例

---

### LottieManager

全局动画管理器单例。

```typescript
import { lottieManager } from '@ldesign/lottie'

// 创建实例
const instance = lottieManager.create({ /* config */ })

// 全局控制
lottieManager.playAll()
lottieManager.pauseAll()
lottieManager.stopAll()

// 性能统计
const stats = lottieManager.getGlobalStats()
```

**方法:**
- `create(config)` - 创建新实例
- `get(id)` - 根据 ID 获取实例
- `destroy(id)` - 销毁实例
- `playAll()` - 播放所有实例
- `pauseAll()` - 暂停所有实例
- `stopAll()` - 停止所有实例
- `preload(path)` - 预加载动画
- `getGlobalStats()` - 获取全局统计
- `optimize()` - 优化性能

---

## 性能优化 API

### ResourceCompressor

资源压缩和优化。

```typescript
import { resourceCompressor } from '@ldesign/lottie'

// 分析动画
const analysis = resourceCompressor.analyze(animationData)

// 压缩动画
const result = await resourceCompressor.compress(animationData, {
  compressPaths: true,
  removeRedundant: true,
  precision: 2
})

// 获取建议
const suggestions = resourceCompressor.getCompressionSuggestions(animationData)
```

**方法:**
- `compress(data, options)` - 压缩动画数据
- `analyze(data)` - 分析动画复杂度
- `getCompressionSuggestions(data)` - 获取优化建议
- `simplifyPath(path, tolerance)` - 简化路径数据

---

### WorkerManager

Web Worker 管理。

```typescript
import { workerManager } from '@ldesign/lottie'

// 解析动画
const parsed = await workerManager.parseAnimation(data)

// 压缩数据
const compressed = await workerManager.compressAnimation(data)

// 查看统计
const stats = workerManager.getStats()
```

**配置:**
- `workerCount` - Worker 数量
- `useSharedWorker` - 使用共享 Worker
- `maxRetries` - 最大重试次数
- `enablePriority` - 启用优先级队列

**方法:**
- `parseAnimation(data, options)` - 解析动画
- `compressAnimation(data)` - 压缩动画
- `decompressAnimation(buffer)` - 解压动画
- `optimizeAnimation(data)` - 优化动画
- `getStats()` - 获取统计信息

---

### MemoryManager

内存管理。

```typescript
import { memoryManager } from '@ldesign/lottie'

// 开始监控
memoryManager.startMonitoring()

// 监听内存压力
memoryManager.onMemoryPressure((event) => {
  console.log('内存状态:', event.stats.status)
  if (event.action === 'emergency') {
    // 采取紧急措施
  }
})

// 手动清理
memoryManager.forceCleanup()
```

**方法:**
- `startMonitoring()` - 开始监控
- `stopMonitoring()` - 停止监控
- `getStats()` - 获取内存统计
- `onMemoryPressure(callback)` - 监听内存压力
- `forceCleanup()` - 强制清理

---

## 高级功能 API

### TimelineController

时间线编辑和控制。

```typescript
import { TimelineController } from '@ldesign/lottie'

const timeline = new TimelineController(instance, {
  duration: 5,
  fps: 60
})

// 添加轨道
const track = timeline.addTrack('position')

// 添加关键帧
timeline.addKeyframe(track, {
  time: 0,
  value: { x: 0, y: 0 },
  easing: 'easeInOut'
})

// 播放控制
timeline.play()
timeline.pause()
timeline.seekTo(2.5)
```

**方法:**
- `addTrack(name)` - 添加轨道
- `removeTrack(id)` - 移除轨道
- `addKeyframe(trackId, keyframe)` - 添加关键帧
- `removeKeyframe(trackId, keyframeId)` - 移除关键帧
- `play()` - 播放
- `pause()` - 暂停
- `seekTo(time)` - 跳转
- `addMarker(label, time)` - 添加标记点
- `export()` - 导出时间线数据

---

### DragController

拖拽交互控制。

```typescript
import { DragController } from '@ldesign/lottie'

const drag = new DragController(instance, {
  axis: 'x',
  bounds: { left: 0, right: 500 },
  grid: 10,
  inertia: true,
  mapToProgress: true
})

drag.on('dragStart', (e) => {
  console.log('开始拖拽')
})

drag.on('drag', (e) => {
  console.log('拖拽进度:', e.progress)
})
```

**配置:**
- `axis` - 拖拽轴向 ('x' | 'y' | 'both')
- `bounds` - 边界约束
- `grid` - 网格大小
- `inertia` - 启用惯性
- `mapToProgress` - 映射到动画进度

**事件:**
- `dragStart` - 开始拖拽
- `drag` - 拖拽中
- `dragEnd` - 结束拖拽
- `inertiaEnd` - 惯性结束

---

### DebugPanel

可视化调试面板。

```typescript
import { DebugPanel } from '@ldesign/lottie'

const debug = new DebugPanel(instance, {
  position: 'top-right',
  showChart: true
})

debug.show()
debug.log('info', '动画已加载')
```

**方法:**
- `show()` - 显示面板
- `hide()` - 隐藏面板
- `toggle()` - 切换显示
- `log(level, message)` - 添加日志
- `clearLogs()` - 清空日志
- `exportLogs()` - 导出日志

---

### Profiler

性能分析器。

```typescript
import { Profiler } from '@ldesign/lottie'

const profiler = new Profiler(instance, {
  duration: 5000,
  sampleInterval: 100
})

const report = await profiler.start()

console.log('性能评分:', report.score)
console.log('瓶颈:', report.bottlenecks)
console.log('建议:', report.suggestions)
```

**返回报告包含:**
- `avgFps` - 平均 FPS
- `minFps` - 最低 FPS
- `peakMemory` - 内存峰值
- `bottlenecks` - 性能瓶颈列表
- `suggestions` - 优化建议
- `score` - 性能评分 (0-100)

---

## 数据绑定 API

### DataBinding

数据驱动动画。

```typescript
import { DataBinding, Validators, Pipes } from '@ldesign/lottie'

const binding = new DataBinding(instance)

binding.bind({
  path: 'user.score',
  target: 'scoreText',
  property: 'text',
  validators: [
    Validators.required(),
    Validators.range(0, 100)
  ],
  pipes: [
    Pipes.round(0),
    Pipes.toString()
  ]
})

// 更新数据
binding.update('user.score', 85)
```

**验证器 (Validators):**
- `required()` - 必填
- `number()` - 数字
- `range(min, max)` - 范围
- `email()` - 邮箱
- `pattern(regex)` - 正则

**转换管道 (Pipes):**
- `toNumber()` - 转数字
- `round(decimals)` - 四舍五入
- `clamp(min, max)` - 限制范围
- `percentage()` - 百分比
- `currency(currency)` - 货币格式
- `uppercase()` - 大写
- `default(value)` - 默认值

---

### DataSource

多数据源支持。

```typescript
import { DataSourceFactory } from '@ldesign/lottie'

// API 数据源
const apiSource = DataSourceFactory.create({
  type: 'api',
  url: 'https://api.example.com/data'
})

// WebSocket 数据源
const wsSource = DataSourceFactory.create({
  type: 'websocket',
  url: 'wss://api.example.com/ws',
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 1000
  }
})

wsSource.on('data', (data) => {
  binding.update('liveData', data)
})

await wsSource.connect()
```

**支持的数据源:**
- `api` - REST API
- `websocket` - WebSocket
- `sse` - Server-Sent Events
- `polling` - 定时轮询

---

## 类型定义

### LottieConfig

```typescript
interface LottieConfig {
  container?: HTMLElement | string
  renderer?: 'svg' | 'canvas' | 'html'
  loop?: boolean | number
  autoplay?: boolean
  animationData?: any
  path?: string
  name?: string
  speed?: number
  quality?: 'low' | 'medium' | 'high' | 'auto'
  loadStrategy?: 'eager' | 'lazy' | 'intersection'
  advanced?: AdvancedOptions
  events?: LottieEvents
  style?: Partial<CSSStyleDeclaration>
}
```

### AdvancedOptions

```typescript
interface AdvancedOptions {
  enablePerformanceMonitor?: boolean
  enableSmartFrameSkip?: boolean
  useOffscreenCanvas?: boolean
  targetFPS?: number
  minFps?: number
  maxMemory?: number
  enableAutoDegradation?: boolean
  enableCache?: boolean
  intersectionOptions?: IntersectionObserverInit
}
```

### PerformanceMetrics

```typescript
interface PerformanceMetrics {
  loadTime: number      // 加载时间 (ms)
  fps: number           // 当前 FPS
  memory: number        // 内存使用 (MB)
  duration: number      // 动画时长 (ms)
  totalFrames: number   // 总帧数
}
```

---

## 最佳实践

### 高性能场景

```typescript
const instance = createLottie({
  container: '#lottie',
  path: 'animation.json',
  renderer: 'canvas',
  advanced: {
    useOffscreenCanvas: true,
    enablePerformanceMonitor: true,
    targetFPS: 60
  }
})
```

### 低性能/移动端场景

```typescript
const instance = createLottie({
  container: '#lottie',
  path: 'animation.json',
  renderer: 'canvas',
  quality: 'medium',
  advanced: {
    enableSmartFrameSkip: true,
    enableAutoDegradation: true,
    targetFPS: 30,
    maxMemory: 50
  }
})
```

### 内存敏感场景

```typescript
import { resourceCompressor } from '@ldesign/lottie'

const compressed = await resourceCompressor.compress(data, {
  compressPaths: true,
  removeRedundant: true,
  removeHiddenLayers: true
})

const instance = createLottie({
  animationData: compressed.data,
  advanced: {
    enableCache: true
  }
})
```

---

## 事件系统

所有实例支持的事件：

```typescript
instance.on('data_ready', () => {})
instance.on('complete', () => {})
instance.on('loopComplete', () => {})
instance.on('enterFrame', (e) => {})
instance.on('performanceWarning', (metrics) => {})
instance.on('stateChange', (state) => {})
```

---

更多信息请参考：
- [优化总结](./OPTIMIZATION_SUMMARY.md)
- [示例代码](./examples/)
- [GitHub](https://github.com/ldesign/lottie)

