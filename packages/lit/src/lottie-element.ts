import { LitElement, html, css, PropertyValues } from 'lit'
import { property, state, query } from 'lit/decorators.js'
import { createLottie, type ILottieInstance, type LottieConfig } from '@ldesign/lottie-core'
import type { LottieElementProps } from './types'

/**
 * Lottie Web Component using Lit
 * @element lottie-element
 */
export class LottieElement extends LitElement implements LottieElementProps {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    
    .lottie-container {
      width: 100%;
      height: 100%;
    }
  `

  @property({ type: String }) path?: string
  @property({ type: Object }) animationData?: any
  @property({ type: Boolean }) loop = true
  @property({ type: Boolean }) autoplay = true
  @property({ type: String }) renderer: 'svg' | 'canvas' | 'html' = 'svg'
  @property({ type: String }) quality: 'low' | 'medium' | 'high' = 'high'
  @property({ type: Number }) speed = 1
  @property({ type: Number }) direction: 1 | -1 = 1
  @property({ type: String }) background?: string
  @property({ type: Object }) config?: Partial<LottieConfig>

  @state() private _isReady = false
  @state() private _isPlaying = false
  @state() private _error: Error | null = null

  @query('.lottie-container') private container!: HTMLDivElement

  private instance: ILottieInstance | null = null

  render() {
    return html`
      <div class="lottie-container" style="background: ${this.background || 'transparent'}"></div>
    `
  }

  firstUpdated() {
    this.initializeLottie()
  }

  updated(changedProperties: PropertyValues) {
    if (changedProperties.has('path') || changedProperties.has('animationData')) {
      this.destroyLottie()
      this.initializeLottie()
    }

    if (this.instance) {
      if (changedProperties.has('loop')) {
        this.instance.setLoop(this.loop)
      }
      if (changedProperties.has('speed')) {
        this.instance.setSpeed(this.speed)
      }
      if (changedProperties.has('direction')) {
        this.instance.setDirection(this.direction)
      }
      if (changedProperties.has('autoplay')) {
        if (this.autoplay) {
          this.instance.play()
        } else {
          this.instance.pause()
        }
      }
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.destroyLottie()
  }

  private initializeLottie() {
    if (!this.container) return

    try {
      const config: LottieConfig = {
        container: this.container,
        path: this.path,
        animationData: this.animationData,
        loop: this.loop,
        autoplay: this.autoplay,
        renderer: this.renderer,
        quality: this.quality,
        speed: this.speed,
        direction: this.direction,
        ...this.config
      }

      this.instance = createLottie(config)

      // 事件监听
      this.instance.on('ready', () => {
        this._isReady = true
        this._error = null
        this.dispatchEvent(new CustomEvent('ready', {
          detail: { instance: this.instance },
          bubbles: true,
          composed: true
        }))
      })

      this.instance.on('error', (error: Error) => {
        this._error = error
        this.dispatchEvent(new CustomEvent('error', {
          detail: { error },
          bubbles: true,
          composed: true
        }))
      })

      this.instance.on('play', () => {
        this._isPlaying = true
        this.dispatchEvent(new Event('play', { bubbles: true, composed: true }))
      })

      this.instance.on('pause', () => {
        this._isPlaying = false
        this.dispatchEvent(new Event('pause', { bubbles: true, composed: true }))
      })

      this.instance.on('stop', () => {
        this._isPlaying = false
        this.dispatchEvent(new Event('stop', { bubbles: true, composed: true }))
      })

      this.instance.on('complete', () => {
        this.dispatchEvent(new Event('complete', { bubbles: true, composed: true }))
      })

      this.instance.on('loopComplete', () => {
        this.dispatchEvent(new Event('loopComplete', { bubbles: true, composed: true }))
      })

    } catch (error) {
      this._error = error as Error
      console.error('Failed to initialize Lottie:', error)
    }
  }

  private destroyLottie() {
    if (this.instance) {
      this.instance.destroy()
      this.instance = null
      this._isReady = false
      this._isPlaying = false
    }
  }

  // 公共方法
  play() {
    this.instance?.play()
  }

  pause() {
    this.instance?.pause()
  }

  stop() {
    this.instance?.stop()
  }

  goToAndPlay(value: number, isFrame?: boolean) {
    this.instance?.goToAndPlay(value, isFrame)
  }

  goToAndStop(value: number, isFrame?: boolean) {
    this.instance?.goToAndStop(value, isFrame)
  }

  setSpeed(speed: number) {
    this.speed = speed
    this.instance?.setSpeed(speed)
  }

  setDirection(direction: 1 | -1) {
    this.direction = direction
    this.instance?.setDirection(direction)
  }

  destroy() {
    this.destroyLottie()
  }

  get isReady() {
    return this._isReady
  }

  get isPlaying() {
    return this._isPlaying
  }

  get error() {
    return this._error
  }

  get currentFrame() {
    return this.instance?.animation?.currentFrame || 0
  }

  get totalFrames() {
    return this.instance?.animation?.totalFrames || 0
  }

  get duration() {
    return this.instance?.animation?.getDuration()
  }
}


