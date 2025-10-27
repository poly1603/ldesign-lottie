# 🏗️ Lottie Monorepo 架构指南

## 📁 项目结构

```
lottie/
├── packages/                    # 核心包
│   ├── core/                   # @ldesign/lottie-core (核心库)
│   │   ├── src/               # 源代码
│   │   ├── dist/              # 构建产物
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   ├── react/                  # @ldesign/lottie-react (React组件)
│   │   ├── src/
│   │   ├── dist/
│   │   └── package.json
│   ├── vue/                    # @ldesign/lottie-vue (Vue组件)
│   │   ├── src/
│   │   ├── dist/
│   │   └── package.json
│   └── lit/                    # @ldesign/lottie-lit (Lit组件)
│       ├── src/
│       ├── dist/
│       └── package.json
│
├── examples/                    # 示例应用
│   ├── core-demo/              # 核心库演示
│   ├── react-demo/             # React 演示
│   ├── vue-demo/               # Vue 演示
│   └── lit-demo/               # Lit 演示
│
├── package.json                 # 根 package.json
├── pnpm-workspace.yaml          # pnpm 工作空间配置
└── README.md
```

## 📦 包说明

### @ldesign/lottie-core
核心库，包含所有基础功能和高级特性：
- ✅ WebGL 渲染器
- ✅ WebAssembly 加速
- ✅ AI 智能优化
- ✅ 插件系统
- ✅ 导出和录制
- ✅ 特效管理器

### @ldesign/lottie-react
React 组件包：
- `<Lottie />` 组件
- `useLottie()` Hook
- `useLottieInteractive()` Hook
- `LottieProvider` 上下文

### @ldesign/lottie-vue
Vue 3 组件包：
- `<Lottie />` 组件
- `useLottie()` Composable
- `useLottieInteractive()` Composable
- Vue 插件

### @ldesign/lottie-lit
Lit Web Component 包：
- `<lottie-element>` 自定义元素
- `<lottie-player>` 带控制器的播放器
- 原生 Web Component API

## 🚀 快速开始

### 安装依赖

```bash
# 安装根依赖和所有包的依赖
pnpm install
```

### 构建所有包

```bash
# 构建所有包
pnpm build

# 或单独构建
pnpm build:core
pnpm build:react
pnpm build:vue
pnpm build:lit
```

### 运行示例

```bash
# Core 示例 (http://localhost:3000)
pnpm example:core

# React 示例 (http://localhost:3001)
pnpm example:react

# Vue 示例 (http://localhost:3002)
pnpm example:vue

# Lit 示例 (http://localhost:3003)
pnpm example:lit

# 同时运行所有示例
pnpm dev
```

## 🔧 开发工作流

### 1. 修改核心包

```bash
cd packages/core
pnpm dev  # 监听模式构建
```

### 2. 修改 React 包

```bash
cd packages/react
pnpm dev
```

### 3. 运行示例进行测试

```bash
cd examples/react-demo
pnpm dev
```

## 📝 包依赖关系

```
@ldesign/lottie-core (核心包)
    ↓
    ├── @ldesign/lottie-react
    ├── @ldesign/lottie-vue
    └── @ldesign/lottie-lit
```

所有框架包都依赖于 `@ldesign/lottie-core`。

## 🧪 测试

```bash
# 运行所有测试
pnpm test

# 测试特定包
pnpm --filter @ldesign/lottie-core test
pnpm --filter @ldesign/lottie-react test
```

## 📦 发布流程

### 使用 Changesets

```bash
# 1. 添加变更记录
pnpm changeset

# 2. 更新版本
pnpm version

# 3. 发布
pnpm release
```

### 手动发布

```bash
# 1. 构建所有包
pnpm build

# 2. 发布单个包
cd packages/core
npm publish

cd packages/react
npm publish

# ...依此类推
```

## 🎯 各包功能特性

### Core 功能

```typescript
import { 
  createLottie,
  initWASM,
  AIOptimizer,
  WebGLRenderer,
  ExportManager,
  RecordingController,
  pluginManager
} from '@ldesign/lottie-core'
```

### React 功能

```tsx
import { Lottie, useLottie } from '@ldesign/lottie-react'

// 组件
<Lottie animationData={data} />

// Hook
const { containerRef, play, pause } = useLottie({ path: '/anim.json' })
```

### Vue 功能

```vue
<template>
  <Lottie :animation-data="data" />
</template>

<script setup>
import { Lottie, useLottie } from '@ldesign/lottie-vue'

// Composable
const { containerRef, play, pause } = useLottie({ path: '/anim.json' })
</script>
```

### Lit 功能

```html
<!-- 基础元素 -->
<lottie-element path="/anim.json" loop autoplay></lottie-element>

<!-- 带控制器的播放器 -->
<lottie-player path="/anim.json" show-controls></lottie-player>
```

## 🔍 故障排除

### 构建失败

```bash
# 清理所有包
pnpm clean

# 重新安装依赖
pnpm install

# 重新构建
pnpm build
```

### 类型错误

```bash
# 运行类型检查
pnpm type-check
```

### 示例无法运行

1. 确保先构建核心包：`pnpm build:core`
2. 清理并重新安装：`pnpm clean && pnpm install`
3. 检查端口是否被占用

## 📚 相关文档

- [优化完成报告](./PROJECT_COMPLETE.md)
- [优化实施阶段一](./OPTIMIZATION_IMPLEMENTATION_PHASE1.md)
- [最终优化报告](./docs/OPTIMIZATION_FINAL_REPORT.md)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交代码到对应的包
4. 添加测试
5. 更新文档
6. 提交 PR

## 📄 许可证

MIT © LDesign Team

