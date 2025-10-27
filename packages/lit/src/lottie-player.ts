import { html, css } from 'lit'
import { property } from 'lit/decorators.js'
import { LottieElement } from './lottie-element'

/**
 * Enhanced Lottie Player with Controls
 * @element lottie-player
 */
export class LottiePlayer extends LottieElement {
  static styles = [
    LottieElement.styles,
    css`
      .player-controls {
        display: flex;
        gap: 8px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        margin-top: 8px;
      }
      
      .player-controls button {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        background: #007bff;
        color: white;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }
      
      .player-controls button:hover {
        background: #0056b3;
      }
      
      .player-controls button:disabled {
        background: #6c757d;
        cursor: not-allowed;
      }
      
      .progress-bar {
        width: 100%;
        height: 4px;
        background: #e0e0e0;
        border-radius: 2px;
        overflow: hidden;
        cursor: pointer;
        margin: 8px 0;
      }
      
      .progress-fill {
        height: 100%;
        background: #007bff;
        transition: width 0.1s;
      }
      
      .info-bar {
        display: flex;
        justify-content: space-between;
        font-size: 12px;
        color: #666;
        padding: 4px 0;
      }
    `
  ]

  @property({ type: Boolean }) showControls = true
  @property({ type: Boolean }) showProgress = true
  @property({ type: Boolean }) showInfo = true

  render() {
    return html`
      ${super.render()}
      
      ${this.showProgress ? html`
        <div class="progress-bar" @click="${this.handleProgressClick}">
          <div class="progress-fill" style="width: ${this.getProgress()}%"></div>
        </div>
      ` : ''}
      
      ${this.showControls ? html`
        <div class="player-controls">
          <button @click="${this.play}" ?disabled="${this.isPlaying}">▶️ 播放</button>
          <button @click="${this.pause}" ?disabled="${!this.isPlaying}">⏸️ 暂停</button>
          <button @click="${this.stop}">⏹️ 停止</button>
          <button @click="${this.toggleLoop}">${this.loop ? '🔁' : '➡️'} 循环</button>
        </div>
      ` : ''}
      
      ${this.showInfo ? html`
        <div class="info-bar">
          <span>帧: ${this.currentFrame} / ${this.totalFrames}</span>
          <span>速度: ${this.speed}x</span>
        </div>
      ` : ''}
    `
  }

  private getProgress(): number {
    if (!this.totalFrames) return 0
    return (this.currentFrame / this.totalFrames) * 100
  }

  private handleProgressClick(e: MouseEvent) {
    const target = e.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percent = x / rect.width
    const frame = Math.floor(percent * this.totalFrames)
    this.goToAndStop(frame, true)
  }

  private toggleLoop() {
    this.loop = !this.loop
    this.requestUpdate()
  }
}
