# @ldesign/lottie-react

> React 组件封装的 Lottie 动画库

## 安装

```bash
npm install @ldesign/lottie-react
```

## 使用

### 组件方式

```tsx
import { Lottie } from '@ldesign/lottie-react'
import animationData from './animation.json'

function App() {
  return (
    <Lottie
      animationData={animationData}
      loop
      autoplay
      style={{ width: 400, height: 400 }}
    />
  )
}
```

### Hook 方式

```tsx
import { useLottie } from '@ldesign/lottie-react'

function App() {
  const { containerRef, play, pause } = useLottie({
    animationData,
    loop: true,
    autoplay: false
  })
  
  return (
    <div>
      <div ref={containerRef} style={{ height: 400 }} />
      <button onClick={play}>播放</button>
      <button onClick={pause}>暂停</button>
    </div>
  )
}
```

## API

查看 [完整文档](../../docs/README.md)

## 许可证

MIT

