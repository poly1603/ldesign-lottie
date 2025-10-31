import {
  Directive,
  ElementRef,
  Input,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  NgZone,
} from '@angular/core'
import type {
  LottieConfig,
  ILottieInstance,
  AnimationState,
  PerformanceMetrics,
} from '@ldesign/lottie-core'
import { lottieManager } from '@ldesign/lottie-core'

/**
 * Angular directive for adding Lottie animations to any element
 * 
 * @example
 * ```html
 * <div
 *   lottieAnimation
 *   [lottiePath]="'assets/animation.json'"
 *   [lottieAutoplay]="true"
 *   (lottieAnimationCreated)="onAnimationCreated($event)"
 * ></div>
 * ```
 */
@Directive({
  selector: '[lottieAnimation]',
  standalone: true,
  exportAs: 'lottieAnimation',
})
export class LottieDirective implements OnInit, OnDestroy {
  @Input() lottiePath?: string
  @Input() lottieAnimationData?: any
  @Input() lottieRenderer: 'svg' | 'canvas' | 'html' | 'webgl' = 'svg'
  @Input() lottieLoop: boolean | number = true
  @Input() lottieAutoplay = true
  @Input() lottieSpeed = 1
  @Input() lottieName?: string
  @Input() lottieConfig?: Partial<LottieConfig>

  @Output() lottieAnimationCreated = new EventEmitter<ILottieInstance>()
  @Output() lottieStateChange = new EventEmitter<AnimationState>()
  @Output() lottieComplete = new EventEmitter<void>()
  @Output() lottieLoopComplete = new EventEmitter<void>()
  @Output() lottieDataReady = new EventEmitter<void>()
  @Output() lottieDataFailed = new EventEmitter<Error>()
  @Output() lottiePerformanceWarning = new EventEmitter<PerformanceMetrics>()

  private instance: ILottieInstance | null = null
  private destroyed = false

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private ngZone: NgZone,
  ) {}

  ngOnInit(): void {
    this.initializeAnimation()
  }

  ngOnDestroy(): void {
    this.destroyed = true
    this.cleanup()
  }

  private initializeAnimation(): void {
    this.ngZone.runOutsideAngular(() => {
      try {
        const config: LottieConfig = {
          container: this.elementRef.nativeElement,
          renderer: this.lottieRenderer as any,
          loop: this.lottieLoop,
          autoplay: this.lottieAutoplay,
          speed: this.lottieSpeed,
          name: this.lottieName,
          path: this.lottiePath,
          animationData: this.lottieAnimationData,
          ...this.lottieConfig,
          events: {
            ...this.lottieConfig?.events,
            stateChange: (state) => {
              this.ngZone.run(() => {
                this.lottieStateChange.emit(state)
                this.lottieConfig?.events?.stateChange?.(state)
              })
            },
            complete: () => {
              this.ngZone.run(() => {
                this.lottieComplete.emit()
                this.lottieConfig?.events?.complete?.()
              })
            },
            loopComplete: () => {
              this.ngZone.run(() => {
                this.lottieLoopComplete.emit()
                this.lottieConfig?.events?.loopComplete?.()
              })
            },
            data_ready: () => {
              this.ngZone.run(() => {
                this.lottieDataReady.emit()
                this.lottieConfig?.events?.data_ready?.()
              })
            },
            data_failed: (error) => {
              this.ngZone.run(() => {
                this.lottieDataFailed.emit(error)
                this.lottieConfig?.events?.data_failed?.(error)
              })
            },
            performanceWarning: (metrics) => {
              this.ngZone.run(() => {
                this.lottiePerformanceWarning.emit(metrics)
                this.lottieConfig?.events?.performanceWarning?.(metrics)
              })
            },
          },
        }

        this.instance = lottieManager.create(config)

        this.instance.load().then(() => {
          if (!this.destroyed) {
            this.ngZone.run(() => {
              this.lottieAnimationCreated.emit(this.instance!)
            })
          }
        }).catch((error) => {
          console.error('[Lottie Directive] Failed to load animation:', error)
          this.ngZone.run(() => {
            this.lottieDataFailed.emit(error)
          })
        })
      }
      catch (error) {
        console.error('[Lottie Directive] Failed to create animation:', error)
      }
    })
  }

  // Public API
  play(): void {
    this.instance?.play()
  }

  pause(): void {
    this.instance?.pause()
  }

  stop(): void {
    this.instance?.stop()
  }

  getInstance(): ILottieInstance | null {
    return this.instance
  }

  private cleanup(): void {
    if (this.instance) {
      try {
        this.instance.destroy()
      }
      catch (error) {
        console.error('[Lottie Directive] Error destroying instance:', error)
      }
      this.instance = null
    }
  }
}
