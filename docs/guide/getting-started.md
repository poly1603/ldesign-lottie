# Getting Started

Welcome to Lottie Multi-Framework! This guide will help you get started with Lottie animations in your favorite framework.

## What is Lottie?

Lottie is a library that renders After Effects animations in real time, allowing you to add beautiful animations to your web applications without sacrificing performance.

## Why Use Lottie Multi-Framework?

This package provides seamless integration with 8 major JavaScript frameworks:

- **Vue 3** - Composition API support
- **React 18+** - Hooks-based API
- **Angular 19+** - Components, Directives, and Services
- **Solid.js** - Fine-grained reactivity
- **Svelte 5** - Runes support
- **Qwik** - Resumability support
- **Preact** - Lightweight React alternative

## Installation

Choose your framework and install the corresponding package:

::: code-group

```bash [pnpm]
pnpm add @ldesign/lottie-vue
pnpm add @ldesign/lottie-react
pnpm add @ldesign/lottie-angular
pnpm add @ldesign/lottie-solid
pnpm add @ldesign/lottie-svelte
pnpm add @ldesign/lottie-qwik
pnpm add @ldesign/lottie-preact
```

```bash [npm]
npm install @ldesign/lottie-vue
npm install @ldesign/lottie-react
npm install @ldesign/lottie-angular
npm install @ldesign/lottie-solid
npm install @ldesign/lottie-svelte
npm install @ldesign/lottie-qwik
npm install @ldesign/lottie-preact
```

```bash [yarn]
yarn add @ldesign/lottie-vue
yarn add @ldesign/lottie-react
yarn add @ldesign/lottie-angular
yarn add @ldesign/lottie-solid
yarn add @ldesign/lottie-svelte
yarn add @ldesign/lottie-qwik
yarn add @ldesign/lottie-preact
```

:::

## Basic Usage

### Vue Example

```vue
<script setup>
import { Lottie } from '@ldesign/lottie-vue';
import { ref } from 'vue';

const speed = ref(1);
</script>

<template>
  <div>
    <Lottie 
      path="https://assets.lottiefiles.com/packages/lf20_UJNc2t.json"
      :autoplay="true"
      :loop="true"
      :speed="speed"
      @complete="() => console.log('Animation complete!')"
    />
    
    <input v-model="speed" type="range" min="0.1" max="3" step="0.1" />
    <p>Speed: {{ speed }}x</p>
  </div>
</template>
```

### React Example

```tsx
import { Lottie } from '@ldesign/lottie-react';
import { useState } from 'react';

export default function App() {
  const [speed, setSpeed] = useState(1);

  return (
    <div>
      <Lottie
        path="https://assets.lottiefiles.com/packages/lf20_UJNc2t.json"
        autoplay
        loop
        speed={speed}
        onComplete={() => console.log('Animation complete!')}
      />
      
      <input
        type="range"
        min="0.1"
        max="3"
        step="0.1"
        value={speed}
        onChange={(e) => setSpeed(Number(e.target.value))}
      />
      <p>Speed: {speed}x</p>
    </div>
  );
}
```

## Key Features

### 🎯 Unified API

All framework packages share a similar API, making it easy to switch between frameworks or maintain multiple projects.

### ⚡ Performance Optimized

- Tree-shaking support
- Minimal bundle size
- Framework-specific optimizations
- Lazy loading support

### 🔧 Full Control

- Play, pause, stop controls
- Speed adjustment
- Direction control
- Frame-by-frame navigation
- Event handling

### 📦 Multiple Renderers

- **SVG** - Best for simple animations
- **Canvas** - Best for complex shapes
- **WebGL** - Best for effects and 3D (optional)

## Next Steps

- [Choose your framework](/guide/frameworks)
- [Learn about API options](/api/configuration)
- [Explore examples](/examples/basic)
- [Performance optimization](/guide/performance)

## Need Help?

- Check the [framework-specific guides](/guide/frameworks)
- Browse [examples](/examples/)
- Join our [Discord community](https://discord.gg/ldesign)
- Open an issue on [GitHub](https://github.com/ldesign/lottie)
