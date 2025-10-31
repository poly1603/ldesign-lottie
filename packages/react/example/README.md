# React Lottie Example

Comprehensive example showcasing all features of `@ldesign/lottie-react`.

## Features Demonstrated

1. **Basic Animation** - Simple autoplay with default settings
2. **Controlled Animation** - Using `useLottie` hook for full control
3. **Speed Control** - Dynamic speed adjustment
4. **Direction Control** - Forward and reverse playback
5. **Frame Navigation** - Jump to specific frames
6. **Renderer Selection** - Switch between SVG and Canvas
7. **Event Handling** - Complete, loop, enter frame, etc.
8. **Custom Size** - Different animation sizes

## Run Example

```bash
cd packages/react/example
pnpm install
pnpm dev
```

Open http://localhost:3101

## Features Used

- React 18 with Hooks
- TypeScript
- useState for state management
- useLottie composable
- Event handling
- All Lottie component props
- Real-time event logging

## Code Structure

```
src/
  ├── App.tsx        # Main component with all demos
  ├── App.css        # Component styles
  ├── main.tsx       # React app entry
  └── index.css      # Global styles
```

## Key Concepts

### Using the Component

```tsx
<Lottie
  path="/animation.json"
  autoplay={true}
  loop={true}
  speed={1}
  onComplete={() => console.log('Done!')}
/>
```

### Using the Hook

```tsx
const { containerRef, play, pause, stop } = useLottie({
  path: '/animation.json',
  autoplay: false,
  loop: true,
});

return <div ref={containerRef} />;
```

## Learn More

- [React Documentation](https://react.dev)
- [Lottie Documentation](https://airbnb.io/lottie/)
- [@ldesign/lottie-react README](../../README.md)
