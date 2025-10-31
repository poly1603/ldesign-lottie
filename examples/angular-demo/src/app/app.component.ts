import { Component } from '@angular/core';
import { LottieComponent } from '@ldesign/lottie-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LottieComponent],
  template: `
    <div class="container">
      <h1>Angular Lottie Demo</h1>
      
      <div class="demo-section">
        <h2>Basic Animation</h2>
        <lottie
          path="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json"
          [autoplay]="true"
          [loop]="true"
          [style.width.px]="300"
          [style.height.px]="300"
        />
      </div>

      <div class="demo-section">
        <h2>Controlled Animation</h2>
        <lottie
          #lottieAnimation
          path="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json"
          [autoplay]="false"
          [loop]="true"
          [style.width.px]="300"
          [style.height.px]="300"
          (complete)="onComplete()"
        />
        <div class="controls">
          <button (click)="lottieAnimation.play()">Play</button>
          <button (click)="lottieAnimation.pause()">Pause</button>
          <button (click)="lottieAnimation.stop()">Stop</button>
        </div>
      </div>

      <div class="demo-section">
        <h2>Speed Control</h2>
        <lottie
          #speedAnimation
          path="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json"
          [autoplay]="true"
          [loop]="true"
          [speed]="speed"
          [style.width.px]="300"
          [style.height.px]="300"
        />
        <div class="controls">
          <label>Speed: {{ speed }}x</label>
          <input 
            type="range" 
            min="0.1" 
            max="3" 
            step="0.1" 
            [value]="speed"
            (input)="onSpeedChange($event)"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
    }

    h1 {
      color: #333;
      text-align: center;
      margin-bottom: 2rem;
    }

    .demo-section {
      margin-bottom: 3rem;
      padding: 2rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      background: #f9f9f9;
    }

    h2 {
      color: #555;
      margin-bottom: 1rem;
    }

    lottie {
      display: block;
      margin: 0 auto;
    }

    .controls {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1rem;
      flex-wrap: wrap;
    }

    button {
      padding: 0.5rem 1.5rem;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: background 0.3s;
    }

    button:hover {
      background: #45a049;
    }

    input[type="range"] {
      width: 200px;
      margin-left: 1rem;
    }

    label {
      display: flex;
      align-items: center;
    }
  `]
})
export class AppComponent {
  speed = 1;

  onComplete() {
    console.log('Animation completed!');
  }

  onSpeedChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.speed = parseFloat(target.value);
  }
}
