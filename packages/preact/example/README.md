# Preact Lottie Example

Comprehensive example showcasing `@ldesign/lottie-preact` - the 3KB React alternative.

## Features

1. **Basic Animation** - Simple autoplay
2. **Controlled Animation** - useLottie hook
3. **Speed Control** - Dynamic speed adjustment
4. **Direction Control** - Forward/Reverse
5. **Frame Navigation** - Jump to frames
6. **Renderer Selection** - SVG/Canvas
7. **Event Handling** - All events
8. **Custom Size** - Different sizes

## Run Example

```bash
cd packages/preact/example
pnpm install
pnpm dev
```

Open http://localhost:3106

## Why Preact?

- **3KB** bundle size (React is ~40KB)
- **Same API** as React
- **Faster** performance
- **Compatible** with most React libraries

## Usage

```tsx
import { Lottie, useLottie } from '@ldesign/lottie-preact';

// Component
<Lottie path="/animation.json" autoplay loop />

// Hook
const { containerRef, play, pause } = useLottie({
  path: '/animation.json',
});
```

## Learn More

- [Preact Documentation](https://preactjs.com)
- [@ldesign/lottie-preact README](../../README.md)
