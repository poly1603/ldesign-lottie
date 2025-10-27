# @ldesign/lottie-vue

> Vue 3 组件封装的 Lottie 动画库

## 安装

```bash
npm install @ldesign/lottie-vue
```

## 使用

### 组件方式

```vue
<template>
  <Lottie
    :animation-data="animationData"
    :loop="true"
    :autoplay="true"
    style="width: 400px; height: 400px"
  />
</template>

<script setup>
import { Lottie } from '@ldesign/lottie-vue'
import animationData from './animation.json'
</script>
```

### Composition API

```vue
<template>
  <div>
    <div ref="containerRef" style="height: 400px" />
    <button @click="play">播放</button>
    <button @click="pause">暂停</button>
  </div>
</template>

<script setup>
import { useLottie } from '@ldesign/lottie-vue'
import animationData from './animation.json'

const { containerRef, play, pause } = useLottie({
  animationData,
  loop: true,
  autoplay: false
})
</script>
```

## API

查看 [完整文档](../../docs/README.md)

## 许可证

MIT

