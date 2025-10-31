import { Injectable, NgZone } from '@angular/core'
import { Observable, Subject } from 'rxjs'
import type { LottieConfig, ILottieInstance } from '@ldesign/lottie-core'
import { lottieManager } from '@ldesign/lottie-core'

/**
 * Angular service for programmatically managing Lottie animations
 * 
 * @example
 * ```typescript
 * constructor(private lottieService: LottieService) {}
 * 
 * ngOnInit() {
 *   const animation = this.lottieService.create({
 *     container: document.getElementById('lottie-container'),
 *     path: 'assets/animation.json',
 *     autoplay: true
 *   })
 * }
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class LottieService {
  private animationCreated$ = new Subject<ILottieInstance>()

  constructor(private ngZone: NgZone) {}

  /**
   * Create a new Lottie animation instance
   */
  create(config: LottieConfig): ILottieInstance {
    let instance: ILottieInstance

    this.ngZone.runOutsideAngular(() => {
      instance = lottieManager.create(config)

      instance.load().then(() => {
        this.ngZone.run(() => {
          this.animationCreated$.next(instance)
        })
      }).catch((error) => {
        console.error('[LottieService] Failed to load animation:', error)
      })
    })

    return instance!
  }

  /**
   * Get an existing animation instance by ID
   */
  get(id: string): ILottieInstance | undefined {
    return lottieManager.get(id)
  }

  /**
   * Get an existing animation instance by name
   */
  getByName(name: string): ILottieInstance | undefined {
    return lottieManager.getByName(name)
  }

  /**
   * Get all animation instances
   */
  getAll(): ILottieInstance[] {
    return lottieManager.getAll()
  }

  /**
   * Destroy a specific animation instance
   */
  destroy(id: string): void {
    lottieManager.destroy(id)
  }

  /**
   * Destroy all animation instances
   */
  destroyAll(): void {
    lottieManager.destroyAll()
  }

  /**
   * Observable that emits when a new animation is created
   */
  onAnimationCreated(): Observable<ILottieInstance> {
    return this.animationCreated$.asObservable()
  }

  /**
   * Preload an animation
   */
  async preload(path: string, cacheKey?: string): Promise<any> {
    const response = await fetch(path)
    if (!response.ok) {
      throw new Error(`Failed to preload animation: ${response.statusText}`)
    }
    const data = await response.json()

    // Store in cache if manager supports it
    if (cacheKey) {
      // Cache management would be handled by core
    }

    return data
  }

  /**
   * Get global performance stats
   */
  getGlobalStats(): any {
    return lottieManager.getGlobalStats()
  }

  /**
   * Pause all animations
   */
  pauseAll(): void {
    lottieManager.pauseAll()
  }

  /**
   * Resume all animations
   */
  resumeAll(): void {
    lottieManager.resumeAll()
  }
}
