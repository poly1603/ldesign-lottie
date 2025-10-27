# @ldesign/lottie-core

> 核心 Lottie 动画库，支持 WebGL、WebAssembly 和 AI 优化

## 安装

```bash
npm install @ldesign/lottie-core
# 或
pnpm add @ldesign/lottie-core
```

## 快速开始

```typescript
import { createLottie } from '@ldesign/lottie-core'

const animation = createLottie({
  container: document.getElementById('lottie'),
  path: '/animation.json',
  loop: true,
  autoplay: true
})
```

## 特性

- 🎨 多渲染器支持 (SVG, Canvas, WebGL)
- ⚡ WebAssembly 加速
- 🤖 AI 智能优化
- 🔌 插件系统
- 🎬 导出功能
- 📹 实时录制

## 文档

查看 [完整文档](../../docs/README.md)

## 许可证

MIT

