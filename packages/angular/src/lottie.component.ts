import {
  Component,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ChangeDetectionStrategy,
  ViewChild,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core'
import type {
  LottieConfig,
  ILottieInstance,
  AnimationState,
  PerformanceMetrics,
  LottieRendererType,
} from '@ldesign/lottie-core'
import { lottieManager } from '@ldesign/lottie-core'

/**
 * Angular component for Lottie animations
 * 
 * @example
 * ```html
 * <lottie-animation
 *   [path]="'assets/animation.json'"
 *   [autoplay]="true"
 *   [loop]="true"
 *   (animationCreated)="onAnimationCreated($event)"
 *   (complete)="onComplete()"
 * ></lottie-animation>
 * ```
 */
@Component({
  selector: 'lottie-animation',
  standalone: true,
  template: `<div #container class="lottie-container"></div>`,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .lottie-container {
      width: 100%;
      height: 100%;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LottieComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>

  // Configuration inputs
  @Input() path?: string
  @Input() animationData?: any
  @Input() renderer: LottieRendererType = 'svg'
  @Input() loop: boolean | number = true
  @Input() autoplay = true
  @Input() speed = 1
  @Input() name?: string
  @Input() config?: Partial<LottieConfig>

  // Output events
  @Output() animationCreated = new EventEmitter<ILottieInstance>()
  @Output() stateChange = new EventEmitter<AnimationState>()
  @Output() complete = new EventEmitter<void>()
  @Output() loopComplete = new EventEmitter<void>()
  @Output() enterFrame = new EventEmitter<{ currentTime: number; totalTime: number; direction: number }>()
  @Output() dataReady = new EventEmitter<void>()
  @Output() dataFailed = new EventEmitter<Error>()
  @Output() performanceWarning = new EventEmitter<PerformanceMetrics>()

  private instance: ILottieInstance | null = null
  private destroyed = false

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    this.initializeAnimation()
  }

  ngOnDestroy(): void {
    this.destroyed = true
    this.cleanup()
  }

  /**
   * Initialize the Lottie animation
   */
  private initializeAnimation(): void {
    if (!this.containerRef?.nativeElement) {
      console.error('[Lottie Angular] Container element not found')
      return
    }

    // Run outside Angular zone to avoid unnecessary change detection
    this.ngZone.runOutsideAngular(() => {
      try {
        const config: LottieConfig = {
          container: this.containerRef.nativeElement,
          renderer: this.renderer as any,
          loop: this.loop,
          autoplay: this.autoplay,
          speed: this.speed,
          name: this.name,
          path: this.path,
          animationData: this.animationData,
          ...this.config,
          events: {
            ...this.config?.events,
            stateChange: (state) => {
              this.ngZone.run(() => {
                this.stateChange.emit(state)
                this.config?.events?.stateChange?.(state)
              })
            },
            complete: () => {
              this.ngZone.run(() => {
                this.complete.emit()
                this.config?.events?.complete?.()
              })
            },
            loopComplete: () => {
              this.ngZone.run(() => {
                this.loopComplete.emit()
                this.config?.events?.loopComplete?.()
              })
            },
            enterFrame: (event) => {
              this.ngZone.run(() => {
                this.enterFrame.emit(event)
                this.config?.events?.enterFrame?.(event)
              })
            },
            data_ready: () => {
              this.ngZone.run(() => {
                this.dataReady.emit()
                this.config?.events?.data_ready?.()
              })
            },
            data_failed: (error) => {
              this.ngZone.run(() => {
                this.dataFailed.emit(error)
                this.config?.events?.data_failed?.(error)
              })
            },
            performanceWarning: (metrics) => {
              this.ngZone.run(() => {
                this.performanceWarning.emit(metrics)
                this.config?.events?.performanceWarning?.(metrics)
              })
            },
          },
        }

        this.instance = lottieManager.create(config)

        // Load and potentially autoplay
        this.instance.load().then(() => {
          if (!this.destroyed) {
            this.ngZone.run(() => {
              this.animationCreated.emit(this.instance!)
              this.cdr.markForCheck()
            })
          }
        }).catch((error) => {
          console.error('[Lottie Angular] Failed to load animation:', error)
          this.ngZone.run(() => {
            this.dataFailed.emit(error)
          })
        })
      }
      catch (error) {
        console.error('[Lottie Angular] Failed to create animation:', error)
        this.ngZone.run(() => {
          this.dataFailed.emit(error as Error)
        })
      }
    })
  }

  /**
   * Public API methods
   */

  play(): void {
    this.instance?.play()
  }

  pause(): void {
    this.instance?.pause()
  }

  stop(): void {
    this.instance?.stop()
  }

  setSpeed(speed: number): void {
    this.instance?.setSpeed(speed)
  }

  setDirection(direction: 1 | -1): void {
    this.instance?.setDirection(direction)
  }

  goToAndStop(frame: number, isFrame = true): void {
    this.instance?.goToAndStop(frame, isFrame)
  }

  goToAndPlay(frame: number, isFrame = true): void {
    this.instance?.goToAndPlay(frame, isFrame)
  }

  playSegments(segments: [number, number] | [number, number][], forceFlag?: boolean): void {
    this.instance?.playSegments(segments, forceFlag)
  }

  reset(): void {
    this.instance?.reset()
  }

  resize(): void {
    this.instance?.resize()
  }

  getMetrics(): PerformanceMetrics | null {
    return this.instance?.getMetrics() ?? null
  }

  getInstance(): ILottieInstance | null {
    return this.instance
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.instance) {
      try {
        this.instance.destroy()
      }
      catch (error) {
        console.error('[Lottie Angular] Error destroying instance:', error)
      }
      this.instance = null
    }
  }
}
