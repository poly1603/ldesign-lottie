# 演示项目创建指南

## 📁 建议的演示项目结构

```
examples/
├── angular-demo/          # Angular 演示
├── solid-demo/            # Solid.js 演示
├── svelte-demo/           # Svelte 演示
└── qwik-demo/             # Qwik 演示
```

## 🚀 使用 @ldesign/launcher 创建演示项目

### Angular 演示

```bash
cd examples
mkdir angular-demo
cd angular-demo

# 初始化 Angular 项目
pnpm create @ldesign/launcher --framework angular --name lottie-angular-demo

# 安装依赖
pnpm add @ldesign/lottie-angular

# 创建演示组件
# src/app/app.component.ts
```

**示例代码：**

```typescript
// app.component.ts
import { Component } from '@angular/core'
import { LottieComponent } from '@ldesign/lottie-angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LottieComponent],
  template: `
    <div class="demo-container">
      <h1>Lottie Angular 演示</h1>
      
      <div class="animation-wrapper">
        <lottie-animation
          [path]="'assets/animations/loading.json'"
          [autoplay]="true"
          [loop]="true"
          (animationCreated)="onAnimationCreated($event)"
        ></lottie-animation>
      </div>
      
      <div class="controls">
        <button (click)="play()">播放</button>
        <button (click)="pause()">暂停</button>
        <button (click)="stop()">停止</button>
      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    .animation-wrapper {
      width: 400px;
      height: 400px;
      margin: 2rem auto;
    }
    .controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
  `]
})
export class AppComponent {
  private lottieInstance: any

  onAnimationCreated(instance: any) {
    this.lottieInstance = instance
    console.log('Animation created:', instance)
  }

  play() {
    this.lottieInstance?.play()
  }

  pause() {
    this.lottieInstance?.pause()
  }

  stop() {
    this.lottieInstance?.stop()
  }
}
```

### Solid.js 演示

```bash
cd examples
mkdir solid-demo
cd solid-demo

# 初始化 Solid 项目
pnpm create solid

# 安装依赖
pnpm add @ldesign/lottie-solid

# 创建演示组件
# src/App.tsx
```

**示例代码：**

```tsx
// App.tsx
import { createSignal } from 'solid-js'
import { Lottie, useLottie } from '@ldesign/lottie-solid'

function App() {
  let containerRef: HTMLDivElement | undefined
  
  const lottie = useLottie({
    container: () => containerRef,
    path: '/animations/loading.json',
    autoplay: false,
    loop: true
  })

  return (
    <div class="demo-container">
      <h1>Lottie Solid.js 演示</h1>
      
      <div class="animation-wrapper" ref={containerRef} />
      
      <div class="controls">
        <button onClick={() => lottie.play()}>播放</button>
        <button onClick={() => lottie.pause()}>暂停</button>
        <button onClick={() => lottie.stop()}>停止</button>
      </div>
      
      <div class="info">
        <p>状态: {lottie.state()}</p>
      </div>
    </div>
  )
}

export default App
```

### Svelte 演示

```bash
cd examples
mkdir svelte-demo
cd svelte-demo

# 初始化 Svelte 项目
pnpm create vite svelte-demo --template svelte-ts

# 安装依赖
pnpm add @ldesign/lottie-svelte

# 创建演示组件
# src/App.svelte
```

**示例代码：**

```svelte
<!-- App.svelte -->
<script lang="ts">
  import { Lottie } from '@ldesign/lottie-svelte'
  
  let lottie: any
  
  function play() {
    lottie?.play()
  }
  
  function pause() {
    lottie?.pause()
  }
  
  function stop() {
    lottie?.stop()
  }
</script>

<div class="demo-container">
  <h1>Lottie Svelte 演示</h1>
  
  <div class="animation-wrapper">
    <Lottie
      bind:this={lottie}
      path="/animations/loading.json"
      autoplay={true}
      loop={true}
    />
  </div>
  
  <div class="controls">
    <button on:click={play}>播放</button>
    <button on:click={pause}>暂停</button>
    <button on:click={stop}停止</button>
  </div>
</div>

<style>
  .demo-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
  }
  .animation-wrapper {
    width: 400px;
    height: 400px;
    margin: 2rem auto;
  }
  .controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }
</style>
```

### Qwik 演示

```bash
cd examples
mkdir qwik-demo
cd qwik-demo

# 初始化 Qwik 项目
pnpm create qwik

# 安装依赖
pnpm add @ldesign/lottie-qwik

# 创建演示组件
# src/routes/index.tsx
```

**示例代码：**

```tsx
// routes/index.tsx
import { component$, useSignal } from '@builder.io/qwik'
import { Lottie, useLottie } from '@ldesign/lottie-qwik'

export default component$(() => {
  const containerRef = useSignal<HTMLDivElement>()
  const lottie = useLottie({
    container: containerRef,
    path: '/animations/loading.json',
    autoplay: false,
    loop: true
  })

  return (
    <div class="demo-container">
      <h1>Lottie Qwik 演示</h1>
      
      <div class="animation-wrapper" ref={containerRef} />
      
      <div class="controls">
        <button onClick$={lottie.play}>播放</button>
        <button onClick$={lottie.pause}>暂停</button>
        <button onClick$={lottie.stop}>停止</button>
      </div>
    </div>
  )
})
```

## 📦 通用演示动画文件

在每个演示项目的 `public/animations/` 目录下放置 Lottie JSON 文件：

```bash
# 从已有的 examples/assets 复制动画文件
cp ../../assets/*.json public/animations/
```

可用的动画文件：
- `loading.json` - 加载动画
- `success.json` - 成功动画
- `heart-beat.json` - 心跳动画
- `confetti.json` - 彩纸动画

## 🎨 通用样式

建议的 CSS 样式（所有演示项目共用）：

```css
/* demo-styles.css */
.demo-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

.animation-wrapper {
  width: 400px;
  height: 400px;
  margin: 2rem auto;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
}

.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

.controls button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  background: #007bff;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.controls button:hover {
  background: #0056b3;
}

.controls button:active {
  transform: scale(0.98);
}

.info {
  margin-top: 2rem;
  text-align: center;
  color: #666;
}
```

## 🚀 运行演示

更新根目录 `package.json` 中的脚本（已完成）：

```json
{
  "scripts": {
    "example:angular": "pnpm --filter @examples/lottie-angular-demo dev",
    "example:solid": "pnpm --filter @examples/lottie-solid-demo dev",
    "example:svelte": "pnpm --filter @examples/lottie-svelte-demo dev",
    "example:qwik": "pnpm --filter @examples/lottie-qwik-demo dev"
  }
}
```

## 📝 下一步

1. 创建每个演示项目的目录结构
2. 使用上述代码创建演示组件
3. 复制动画文件到 `public/animations/`
4. 测试每个演示项目
5. 添加更多交互式示例（速度控制、片段播放等）

## 🎯 高级演示功能建议

每个演示项目可以包含以下功能：

- ✅ 基础播放控制（播放、暂停、停止）
- ✅ 速度控制
- ✅ 循环控制
- ✅ 方向控制（正向/反向）
- ✅ 跳转到特定帧
- ✅ 片段播放
- ✅ 性能监控显示
- ✅ 多动画切换
- ✅ 交互式动画（悬停、点击）

---

**状态：** 📋 指南完成，等待实施  
**优先级：** 中  
**预计时间：** 2-4 小时（所有演示项目）
