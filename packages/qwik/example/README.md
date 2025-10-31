# Qwik Lottie Example

Comprehensive example showcasing `@ldesign/lottie-qwik` with Resumability.

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
cd packages/qwik/example
pnpm install
pnpm dev
```

Open http://localhost:3105

## Qwik Features

- **Resumability** - Zero hydration cost
- **Lazy loading** - Load code as needed
- **Signals** - Fine-grained reactivity
- **QRL** - Serializable functions
- **Optimal performance** - Instant interactivity

## Usage

```tsx
import { component$, useSignal } from '@builder.io/qwik';
import { Lottie } from '@ldesign/lottie-qwik';

export default component$(() => {
  const speed = useSignal(1);
  
  return (
    <Lottie 
      path="/animation.json" 
      autoplay 
      loop 
      speed={speed.value}
    />
  );
});
```

## Learn More

- [Qwik Documentation](https://qwik.builder.io)
- [Qwik Resumability](https://qwik.builder.io/docs/concepts/resumable/)
- [@ldesign/lottie-qwik README](../../README.md)
