# @ldesign/lottie-solid

Solid.js components and primitives for high-performance Lottie animations with fine-grained reactivity.

## Features

- ⚡ **Fine-Grained Reactivity** - Leverages Solid's reactive primitives
- 🎯 **Type-Safe** - Full TypeScript support
- 🪝 **Composable** - Includes `useLottie` composable
- 🎨 **Zero Runtime Overhead** - Compiles to efficient vanilla JS
- 🔧 **Fully Configurable** - Extensive options

## Installation

```bash
pnpm add @ldesign/lottie-solid solid-js
```

## Usage

### Component

```tsx
import { Lottie } from '@ldesign/lottie-solid'

function App() {
  return (
    <Lottie
      path="/animations/loading.json"
      autoplay
      loop
      onAnimationCreated={(instance) => console.log('Created:', instance)}
    />
  )
}
```

### Composable

```tsx
import { useLottie } from '@ldesign/lottie-solid'

function App() {
  let containerRef: HTMLDivElement | undefined
  const lottie = useLottie({
    container: () => containerRef,
    path: '/animation.json',
    autoplay: true
  })

  return (
    <div>
      <div ref={containerRef} />
      <button onClick={() => lottie.play()}>Play</button>
      <button onClick={() => lottie.pause()}>Pause</button>
      <p>State: {lottie.state()}</p>
    </div>
  )
}
```

## License

MIT © LDesign Team
