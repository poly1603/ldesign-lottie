# @ldesign/lottie-angular

Angular components, directives, and services for high-performance Lottie animations.

## Features

- 🎨 **Standalone Components** - Works with Angular 14+ standalone APIs
- 🎯 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- ⚡ **Performance Optimized** - Runs outside Angular's zone for better performance
- 🎭 **Multiple APIs** - Component, directive, and service-based usage
- 🔧 **Highly Configurable** - Extensive configuration options
- 📱 **Responsive** - Automatic device detection and optimization

## Installation

```bash
pnpm add @ldesign/lottie-angular
# or
npm install @ldesign/lottie-angular
# or
yarn add @ldesign/lottie-angular
```

## Usage

### Component API

```typescript
import { Component } from '@angular/core'
import { LottieComponent } from '@ldesign/lottie-angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LottieComponent],
  template: `
    <lottie-animation
      [path]="'assets/animation.json'"
      [autoplay]="true"
      [loop]="true"
      (animationCreated)="onAnimationCreated($event)"
      (complete)="onComplete()"
    ></lottie-animation>
  `
})
export class AppComponent {
  onAnimationCreated(instance: any) {
    console.log('Animation created:', instance)
  }

  onComplete() {
    console.log('Animation complete')
  }
}
```

### Directive API

```typescript
import { Component } from '@angular/core'
import { LottieDirective } from '@ldesign/lottie-angular'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LottieDirective],
  template: `
    <div
      lottieAnimation
      [lottiePath]="'assets/animation.json'"
      [lottieAutoplay]="true"
      [lottieLoop]="true"
      (lottieAnimationCreated)="onCreated($event)"
    ></div>
  `
})
export class AppComponent {
  onCreated(instance: any) {
    console.log('Animation created:', instance)
  }
}
```

### Service API

```typescript
import { Component, OnInit, ElementRef, ViewChild } from '@angular/core'
import { LottieService } from '@ldesign/lottie-angular'

@Component({
  selector: 'app-root',
  standalone: true,
  template: `<div #lottieContainer></div>`
})
export class AppComponent implements OnInit {
  @ViewChild('lottieContainer') container!: ElementRef

  constructor(private lottieService: LottieService) {}

  ngOnInit() {
    const animation = this.lottieService.create({
      container: this.container.nativeElement,
      path: 'assets/animation.json',
      autoplay: true,
      loop: true
    })
  }
}
```

## API Reference

### Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `path` | `string` | - | Path to animation JSON file |
| `animationData` | `any` | - | Animation data object |
| `renderer` | `'svg' \| 'canvas' \| 'html' \| 'webgl'` | `'svg'` | Renderer type |
| `loop` | `boolean \| number` | `true` | Loop animation |
| `autoplay` | `boolean` | `true` | Auto-play animation |
| `speed` | `number` | `1` | Animation speed |
| `name` | `string` | - | Animation name |
| `config` | `Partial<LottieConfig>` | - | Advanced configuration |

### Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `animationCreated` | `EventEmitter<ILottieInstance>` | Emitted when animation is created |
| `stateChange` | `EventEmitter<AnimationState>` | Emitted on state change |
| `complete` | `EventEmitter<void>` | Emitted when animation completes |
| `loopComplete` | `EventEmitter<void>` | Emitted on each loop completion |
| `dataReady` | `EventEmitter<void>` | Emitted when data is loaded |
| `dataFailed` | `EventEmitter<Error>` | Emitted on load error |
| `performanceWarning` | `EventEmitter<PerformanceMetrics>` | Emitted on performance issues |

## Advanced Examples

### With Performance Monitoring

```typescript
<lottie-animation
  [path]="'assets/complex-animation.json'"
  [config]="{
    advanced: {
      enablePerformanceMonitor: true,
      targetFPS: 60,
      enableAutoDegradation: true
    }
  }"
  (performanceWarning)="onPerformanceWarning($event)"
></lottie-animation>
```

### Interactive Animation

```typescript
<lottie-animation
  #lottieRef
  [path]="'assets/interactive.json'"
  [autoplay]="false"
></lottie-animation>

<button (click)="lottieRef.play()">Play</button>
<button (click)="lottieRef.pause()">Pause</button>
<button (click)="lottieRef.stop()">Stop</button>
```

## License

MIT © LDesign Team
