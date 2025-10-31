# @ldesign/lottie-svelte

Svelte 5 components for high-performance Lottie animations with runes.

## Features

- 🔮 **Svelte 5 Runes** - Uses modern Svelte 5 reactivity
- 🎯 **Type-Safe** - Full TypeScript support
- ⚡ **Optimized** - Minimal runtime overhead
- 🎨 **Simple API** - Easy to use component

## Installation

```bash
pnpm add @ldesign/lottie-svelte svelte
```

## Usage

### Basic

```svelte
<script>
  import { Lottie } from '@ldesign/lottie-svelte'
</script>

<Lottie
  path="/animations/loading.json"
  autoplay
  loop
  onAnimationCreated={(instance) => console.log('Created:', instance)}
/>
```

### With Control

```svelte
<script>
  import { Lottie } from '@ldesign/lottie-svelte'
  
  let lottie

  function play() {
    lottie?.play()
  }
</script>

<Lottie
  bind:this={lottie}
  path="/animation.json"
  autoplay={false}
/>

<button onclick={play}>Play</button>
```

### Svelte 4 Compatible

This package is primarily designed for Svelte 5 but includes compatibility for Svelte 4.

## License

MIT © LDesign Team
