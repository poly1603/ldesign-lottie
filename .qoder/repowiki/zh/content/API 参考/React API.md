# React API 参考文档

<cite>
**本文档中引用的文件**
- [packages/react/src/index.ts](file://packages/react/src/index.ts)
- [packages/react/src/types.ts](file://packages/react/src/types.ts)
- [packages/react/src/hooks/useLottie.ts](file://packages/react/src/hooks/useLottie.ts)
- [packages/react/src/hooks/useLottieInteractive.ts](file://packages/react/src/hooks/useLottieInteractive.ts)
- [packages/react/src/components/Lottie.tsx](file://packages/react/src/components/Lottie.tsx)
- [packages/react/src/context/LottieContext.tsx](file://packages/react/src/context/LottieContext.tsx)
- [packages/react/README.md](file://packages/react/README.md)
- [packages/react/package.json](file://packages/react/package.json)
</cite>

## 目录
1. [简介](#简介)
2. [安装与设置](#安装与设置)
3. [核心组件](#核心组件)
4. [Hook API](#hook-api)
5. [TypeScript 类型定义](#typescript-类型定义)
6. [上下文系统](#上下文系统)
7. [错误处理与最佳实践](#错误处理与最佳实践)
8. [SSR 环境支持](#ssr-环境支持)
9. [React 严格模式兼容性](#react-严格模式兼容性)
10. [性能优化建议](#性能优化建议)

## 简介

@ldesign/lottie-react 是 Lottie 动画库的官方 React 适配器，提供了完整的动画渲染和交互功能。该适配器支持多种使用方式，包括函数组件、Hook 和上下文系统，为开发者提供了灵活且强大的动画解决方案。

### 主要特性

- **多使用方式**：支持组件、Hook 和上下文三种主要使用方式
- **TypeScript 完整支持**：提供完整的类型定义和智能提示
- **响应式状态管理**：自动跟踪动画状态变化
- **事件驱动架构**：丰富的回调函数支持
- **性能优化**：内置实例池和缓存机制

## 安装与设置

### 安装包

```bash
npm install @ldesign/lottie-react
```

### 基本配置

```typescript
// package.json 中的 peerDependencies
{
  "peerDependencies": {
    "react": ">=16.8.0",
    "react-dom": ">=16.8.0"
  }
}
```

**章节来源**
- [packages/react/package.json](file://packages/react/package.json#L28-L31)

## 核心组件

### Lottie 组件

Lottie 组件是 React 适配器的主要渲染组件，提供了声明式的动画使用方式。

#### 基本用法

```typescript
import { Lottie } from '@ldesign/lottie-react';
import animationData from './animation.json';

function App() {
  return (
    <Lottie
      animationData={animationData}
      loop={true}
      autoplay={true}
      style={{ width: 400, height: 400 }}
    />
  );
}
```

#### 组件 Props

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `animationData` | `object` | - | Lottie 动画数据对象 |
| `path` | `string` | - | 动画文件路径（与 animationData 二选一） |
| `loop` | `boolean \| number` | `true` | 循环次数，false 表示不循环 |
| `autoplay` | `boolean` | `true` | 是否自动播放 |
| `renderer` | `'svg' \| 'canvas' \| 'html'` | `'svg'` | 渲染器类型 |
| `quality` | `'high' \| 'medium' \| 'low'` | `'high'` | 渲染质量 |
| `speed` | `number` | `1` | 播放速度 |
| `direction` | `1 \| -1` | `1` | 播放方向 |
| `className` | `string` | - | 自定义 CSS 类名 |
| `style` | `CSSProperties` | - | 内联样式 |

#### 回调函数

| 回调名 | 参数 | 触发时机 |
|--------|------|----------|
| `onReady` | `(instance: ILottieInstance) => void` | 动画实例初始化完成 |
| `onError` | `(error: Error) => void` | 发生错误时 |
| `onComplete` | `() => void` | 动画播放完成 |
| `onLoopComplete` | `() => void` | 单次循环完成 |
| `onEnterFrame` | `(event: any) => void` | 每帧渲染时 |
| `onSegmentStart` | `(event: any) => void` | 片段开始时 |
| `onDataReady` | `() => void` | 动画数据加载完成 |
| `onDataFailed` | `() => void` | 动画数据加载失败 |
| `onDestroy` | `() => void` | 动画实例销毁 |

#### 引用方法

```typescript
import { Lottie, LottieRef } from '@ldesign/lottie-react';

function App() {
  const lottieRef = useRef<LottieRef>(null);
  
  return (
    <Lottie
      ref={lottieRef}
      animationData={animationData}
    />
  );
}
```

**章节来源**
- [packages/react/src/components/Lottie.tsx](file://packages/react/src/components/Lottie.tsx#L8-L142)

## Hook API

### useLottie Hook

useLottie 是核心的 Hook，提供了对 Lottie 动画的完全控制能力。

#### 基本用法

```typescript
import { useLottie } from '@ldesign/lottie-react';

function App() {
  const { 
    containerRef, 
    play, 
    pause, 
    stop, 
    isReady,
    isPlaying,
    error 
  } = useLottie({
    animationData,
    loop: true,
    autoplay: false
  });

  return (
    <div>
      <div ref={containerRef} style={{ height: 400 }} />
      <button onClick={play} disabled={!isReady}>播放</button>
      <button onClick={pause} disabled={!isReady}>暂停</button>
      <button onClick={stop} disabled={!isReady}>停止</button>
    </div>
  );
}
```

#### useLottie Options

```typescript
interface UseLottieOptions extends Omit<LottieConfig, 'container'> {
  direction?: 1 | -1;
  onReady?: (instance: ILottieInstance) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onLoopComplete?: () => void;
  onEnterFrame?: (event: any) => void;
  onSegmentStart?: (event: any) => void;
  onDataReady?: () => void;
  onDataFailed?: () => void;
  onDestroy?: () => void;
}
```

#### 返回值结构

```typescript
interface UseLottieReturn {
  containerRef: React.RefObject<HTMLDivElement>;
  instance: ILottieInstance | null;
  isReady: boolean;
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  error: Error | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  goToAndPlay: (value: number, isFrame?: boolean) => void;
  goToAndStop: (value: number, isFrame?: boolean) => void;
  setSpeed: (speed: number) => void;
  setDirection: (direction: 1 | -1) => void;
  destroy: () => void;
}
```

#### 依赖数组处理

useLottie Hook 的依赖数组只包含 `options.path` 和 `options.animationData`，这意味着：

- 当动画数据发生变化时，组件会重新创建动画实例
- 其他配置项的变化会通过 `useEffect` 监听并更新实例属性
- 这种设计避免了不必要的实例重建，提高了性能

**章节来源**
- [packages/react/src/hooks/useLottie.ts](file://packages/react/src/hooks/useLottie.ts#L8-L136)

### useLottieInteractive Hook

useLottieInteractive 是增强版的 Hook，提供了内置的交互功能。

#### 基本用法

```typescript
import { useLottieInteractive } from '@ldesign/lottie-react';

function App() {
  const { 
    containerRef, 
    play, 
    pause, 
    isHovering 
  } = useLottieInteractive({
    animationData,
    loop: true,
    playOnHover: true,
    playOnClick: true
  });

  return (
    <div>
      <div ref={containerRef} style={{ height: 400 }} />
      <p>{isHovering ? '鼠标悬停中' : '鼠标离开'}</p>
    </div>
  );
}
```

#### useLottieInteractive Options

```typescript
interface UseLottieInteractiveOptions extends UseLottieOptions {
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  playOnHover?: boolean;
  playOnClick?: boolean;
}
```

#### 交互行为

- **hover 播放**：当 `playOnHover` 为 true 时，鼠标悬停自动播放，离开时暂停
- **点击切换**：当 `playOnClick` 为 true 时，点击动画可以切换播放/暂停状态
- **状态反馈**：提供 `isHovering` 状态供组件使用

**章节来源**
- [packages/react/src/hooks/useLottieInteractive.ts](file://packages/react/src/hooks/useLottieInteractive.ts#L16-L69)

## TypeScript 类型定义

### 核心类型

#### LottieProps 接口

```typescript
export interface LottieProps extends Omit<LottieConfig, 'container'> {
  className?: string;
  style?: CSSProperties;
  direction?: 1 | -1;
  onReady?: (instance: ILottieInstance) => void;
  onError?: (error: Error) => void;
  onComplete?: () => void;
  onLoopComplete?: () => void;
  onEnterFrame?: (event: any) => void;
  onSegmentStart?: (event: any) => void;
  onDataReady?: () => void;
  onDataFailed?: () => void;
  onDestroy?: () => void;
}
```

#### LottieRef 接口

```typescript
export interface LottieRef {
  instance: ILottieInstance | null;
  play: () => void;
  pause: () => void;
  stop: () => void;
  goToAndPlay: (value: number, isFrame?: boolean) => void;
  goToAndStop: (value: number, isFrame?: boolean) => void;
  setSpeed: (speed: number) => void;
  setDirection: (direction: 1 | -1) => void;
  destroy: () => void;
  getDuration: () => number | undefined;
  getCurrentFrame: () => number;
  getTotalFrames: () => number;
}
```

#### 自定义 Props 类型扩展

```typescript
import { LottieProps } from '@ldesign/lottie-react';

interface CustomLottieProps extends LottieProps {
  customProp?: string;
  onCustomEvent?: (data: any) => void;
}

function MyComponent(props: CustomLottieProps) {
  return <Lottie {...props} />;
}
```

### 泛型支持

```typescript
// 泛型组件示例
interface TypedLottieProps<T = any> extends LottieProps {
  data?: T;
  onDataLoaded?: (data: T) => void;
}

function GenericLottie<T>({ data, ...props }: TypedLottieProps<T>) {
  return <Lottie {...props} />;
}
```

**章节来源**
- [packages/react/src/types.ts](file://packages/react/src/types.ts#L4-L76)

## 上下文系统

### LottieProvider

LottieProvider 提供了全局的动画实例管理功能。

#### 基本用法

```typescript
import { LottieProvider } from '@ldesign/lottie-react';

function App() {
  return (
    <LottieProvider>
      {/* 子组件 */}
    </LottieProvider>
  );
}
```

#### 全局控制功能

```typescript
import { useLottieContext } from '@ldesign/lottie-react';

function GlobalControls() {
  const { playAll, pauseAll, stopAll } = useLottieContext();
  
  return (
    <div>
      <button onClick={playAll}>播放全部</button>
      <button onClick={pauseAll}>暂停全部</button>
      <button onClick={stopAll}>停止全部</button>
    </div>
  );
}
```

#### 上下文值接口

```typescript
export interface LottieContextValue {
  instances: Map<string, ILottieInstance>;
  register: (id: string, instance: ILottieInstance) => void;
  unregister: (id: string) => void;
  get: (id: string) => ILottieInstance | undefined;
  playAll: () => void;
  pauseAll: () => void;
  stopAll: () => void;
}
```

### 使用场景

1. **多动画协调**：同时控制多个动画的播放状态
2. **全局状态管理**：统一管理动画实例
3. **性能优化**：批量操作减少 DOM 操作

**章节来源**
- [packages/react/src/context/LottieContext.tsx](file://packages/react/src/context/LottieContext.tsx#L7-L63)

## 错误处理与最佳实践

### 错误边界处理

```typescript
import { useState, useEffect } from 'react';
import { Lottie } from '@ldesign/lottie-react';

function ErrorBoundaryLottie({ animationData }: { animationData: any }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleError = (error: Error) => {
    console.error('Lottie Error:', error);
    setHasError(true);
    setErrorMessage(error.message);
  };

  if (hasError) {
    return <div className="error">动画加载失败: {errorMessage}</div>;
  }

  return (
    <Lottie
      animationData={animationData}
      onError={handleError}
      style={{ width: 400, height: 400 }}
    />
  );
}
```

### 状态管理最佳实践

```typescript
import { useLottie } from '@ldesign/lottie-react';

function AnimatedButton({ animationData }: { animationData: any }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const { containerRef, play, pause } = useLottie({
    animationData,
    autoplay: false,
    onReady: () => setIsLoading(false),
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false)
  });

  return (
    <div>
      {isLoading && <div>加载中...</div>}
      
      <button 
        onClick={isPlaying ? pause : play}
        disabled={isLoading}
      >
        {isPlaying ? '暂停' : '播放'}
      </button>

      <div ref={containerRef} style={{ width: 100, height: 100 }} />
    </div>
  );
}
```

### 性能监控

```typescript
import { useLottie } from '@ldesign/lottie-react';

function PerformanceMonitoringLottie({ animationData }: { animationData: any }) {
  const [stats, setStats] = useState({
    frameRate: 0,
    memoryUsage: 0,
    renderTime: 0
  });

  const { containerRef } = useLottie({
    animationData,
    onEnterFrame: (event) => {
      // 性能监控逻辑
      const now = performance.now();
      const elapsed = now - (stats.renderTime || now);
      setStats(prev => ({
        ...prev,
        frameRate: 1000 / elapsed,
        renderTime: now
      }));
    }
  });

  return (
    <div>
      <div ref={containerRef} style={{ width: 200, height: 200 }} />
      <div>帧率: {stats.frameRate.toFixed(2)} FPS</div>
    </div>
  );
}
```

## SSR 环境支持

### Next.js 支持

```typescript
import dynamic from 'next/dynamic';
import { LottieProps } from '@ldesign/lottie-react';

const Lottie = dynamic<LottieProps>(
  () => import('@ldesign/lottie-react').then(mod => mod.Lottie),
  { 
    ssr: false,
    loading: () => <div>加载动画中...</div>
  }
);

function PageWithAnimation() {
  return (
    <div>
      <Lottie 
        animationData={animationData}
        autoplay={true}
        loop={true}
        style={{ width: 300, height: 300 }}
      />
    </div>
  );
}
```

### Gatsby 支持

```typescript
import React from 'react';
import { Lottie } from '@ldesign/lottie-react';

const LottieComponent = ({ animationData }: { animationData: any }) => {
  // 检查是否在浏览器环境中
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <Lottie
      animationData={animationData}
      autoplay={true}
      loop={true}
      style={{ width: 300, height: 300 }}
    />
  );
};

export default LottieComponent;
```

### 通用 SSR 解决方案

```typescript
import { useEffect, useState } from 'react';
import { Lottie } from '@ldesign/lottie-react';

function SSRSafeLottie({ animationData }: { animationData: any }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // 或者返回骨架屏
  }

  return (
    <Lottie
      animationData={animationData}
      autoplay={true}
      loop={true}
      style={{ width: 300, height: 300 }}
    />
  );
}
```

## React 严格模式兼容性

### 严格模式下的注意事项

React 严格模式会双重调用某些生命周期方法，这对 Lottie 动画有特殊影响：

```typescript
import { useLottie } from '@ldesign/lottie-react';

function StrictModeCompatible() {
  const { containerRef, play, pause } = useLottie({
    animationData,
    autoplay: false
  });

  // 在严格模式下，useEffect 会被调用两次
  // 第二次调用时，containerRef.current 可能已经存在
  useEffect(() => {
    // 确保只在必要时执行清理
    return () => {
      // 清理逻辑
    };
  }, []); // 不依赖任何变量，确保清理逻辑只执行一次

  return (
    <div>
      <div ref={containerRef} style={{ height: 400 }} />
      <button onClick={play}>播放</button>
      <button onClick={pause}>暂停</button>
    </div>
  );
}
```

### 避免副作用重复执行

```typescript
import { useLottie } from '@ldesign/lottie-react';

function SafeLottieComponent({ animationData }: { animationData: any }) {
  const { containerRef, play, pause } = useLottie({
    animationData,
    autoplay: false
  });

  // 使用 useRef 来跟踪首次渲染
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // 严格模式下的副作用处理
    return () => {
      // 清理逻辑
    };
  }, []); // 不依赖任何变量

  return <div ref={containerRef} style={{ height: 400 }} />;
}
```

### 严格模式最佳实践

1. **避免在 useEffect 中创建副作用**
2. **使用 useRef 跟踪状态变化**
3. **确保清理函数的幂等性**
4. **测试严格模式下的行为**

## 性能优化建议

### 动画数据优化

```typescript
// 使用 memoized 动画数据
import { useMemo } from 'react';
import { Lottie } from '@ldesign/lottie-react';

function OptimizedLottie({ animationData }: { animationData: any }) {
  const memoizedData = useMemo(() => animationData, []);
  
  return (
    <Lottie
      animationData={memoizedData}
      autoplay={true}
      loop={true}
      quality="medium"
    />
  );
}
```

### 条件渲染优化

```typescript
import { useLottie } from '@ldesign/lottie-react';

function ConditionalLottie({ shouldRender, animationData }: { 
  shouldRender: boolean, 
  animationData: any 
}) {
  const { containerRef, play, pause } = useLottie({
    animationData,
    autoplay: false
  });

  if (!shouldRender) {
    return null;
  }

  return (
    <div>
      <div ref={containerRef} style={{ height: 400 }} />
      <button onClick={play}>播放</button>
      <button onClick={pause}>暂停</button>
    </div>
  );
}
```

### 实例池优化

```typescript
import { LottieProvider, useLottieContext } from '@ldesign/lottie-react';

function OptimizedApp() {
  return (
    <LottieProvider>
      <OptimizedLottieGroup />
    </LottieProvider>
  );
}

function OptimizedLottieGroup() {
  const { playAll, pauseAll } = useLottieContext();

  // 使用上下文进行批量操作
  return (
    <div>
      <button onClick={playAll}>批量播放</button>
      <button onClick={pauseAll}>批量暂停</button>
    </div>
  );
}
```

### 内存管理

```typescript
import { useLottie } from '@ldesign/lottie-react';
import { useEffect } from 'react';

function MemoryEfficientLottie({ animationData }: { animationData: any }) {
  const { containerRef, destroy } = useLottie({
    animationData,
    autoplay: false
  });

  useEffect(() => {
    // 组件卸载时清理资源
    return () => {
      destroy();
    };
  }, [destroy]);

  return <div ref={containerRef} style={{ height: 400 }} />;
}
```

**章节来源**
- [packages/react/src/hooks/useLottie.ts](file://packages/react/src/hooks/useLottie.ts#L110-L114)

## 总结

@ldesign/lottie-react 提供了完整的 React 动画解决方案，支持多种使用方式和高级功能。通过合理使用组件、Hook 和上下文系统，开发者可以构建高性能、可维护的动画应用。

### 关键要点

1. **选择合适的使用方式**：根据需求选择组件、Hook 或上下文
2. **正确处理错误**：使用错误边界和回调函数处理异常
3. **SSR 兼容性**：在服务端渲染环境中谨慎使用
4. **严格模式兼容**：注意严格模式下的双重调用问题
5. **性能优化**：合理使用 memoization 和实例池

通过遵循这些最佳实践，可以充分发挥 Lottie React 适配器的强大功能，为用户提供流畅的动画体验。