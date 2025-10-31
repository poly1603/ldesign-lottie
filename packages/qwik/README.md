# @ldesign/lottie-qwik

Qwik components for high-performance Lottie animations with resumability.

## Features

- ⚡ **Resumable** - Follows Qwik's resumability principles
- 🎯 **Type-Safe** - Full TypeScript support
- 🚀 **Zero Hydration** - No JavaScript until interaction
- 🎨 **Lazy Loading** - Uses `useVisibleTask$` for optimal performance

## Installation

```bash
pnpm add @ldesign/lottie-qwik @builder.io/qwik
```

## Usage

### Component

```tsx
import { component$ } from '@builder.io/qwik'
import { Lottie } from '@ldesign/lottie-qwik'

export default component$(() => {
  return (
    <Lottie
      path="/animations/loading.json"
      autoplay
      loop
      onAnimationCreated$={(instance) => console.log('Created:', instance)}
    />
  )
})
```

### With Controls

```tsx
import { component$, useSignal } from '@builder.io/qwik'
import { Lottie, useLottie } from '@ldesign/lottie-qwik'

export default component$(() => {
  const containerRef = useSignal<HTMLDivElement>()
  const lottie = useLottie({
    container: containerRef,
    path: '/animation.json',
    autoplay: true
  })

  return (
    <div>
      <div ref={containerRef} />
      <button onClick$={lottie.play}>Play</button>
      <button onClick$={lottie.pause}>Pause</button>
    </div>
  )
})
```

## License

MIT © LDesign Team
