# Svelte Lottie Example

Comprehensive example showcasing `@ldesign/lottie-svelte` with Svelte 5 Runes.

## Features

1. **Basic Animation** - Simple autoplay
2. **Controlled Animation** - Play/Pause/Stop
3. **Speed Control** - Dynamic speed
4. **Direction Control** - Forward/Reverse
5. **Frame Navigation** - Jump to frames
6. **Renderer Selection** - SVG/Canvas
7. **Event Handling** - All events
8. **Custom Size** - Different sizes

## Run Example

```bash
cd packages/svelte/example
pnpm install
pnpm dev
```

Open http://localhost:3104

## Svelte 5 Features

- **Runes** - `$state`, `$props`, `$effect`
- **Fine-grained reactivity** - Optimal performance
- **Compile-time optimization** - Smaller bundles
- **Simpler syntax** - Less boilerplate

## Usage

```svelte
<script>
  import Lottie from '@ldesign/lottie-svelte';
  
  let speed = $state(1);
</script>

<Lottie path="/animation.json" autoplay loop {speed} />
```

## Learn More

- [Svelte 5 Documentation](https://svelte-5-preview.vercel.app)
- [Svelte Runes](https://svelte-5-preview.vercel.app/docs/runes)
- [@ldesign/lottie-svelte README](../../README.md)
