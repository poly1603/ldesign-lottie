import { createSignal } from 'solid-js';
import { Lottie, useLottie } from '@ldesign/lottie-solid';
import './App.css';

export default function App() {
  const [speed, setSpeed] = createSignal(1);
  
  const { containerRef, play, pause, stop } = useLottie({
    path: 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json',
    autoplay: false,
    loop: true,
  });

  return (
    <div class="container">
      <h1>Solid.js Lottie Demo</h1>
      
      <div class="demo-section">
        <h2>Basic Animation</h2>
        <Lottie
          path="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json"
          autoplay
          loop
          style={{ width: '300px', height: '300px', margin: '0 auto' }}
        />
      </div>

      <div class="demo-section">
        <h2>Controlled Animation (useLottie Hook)</h2>
        <div ref={containerRef} style={{ width: '300px', height: '300px', margin: '0 auto' }} />
        <div class="controls">
          <button onClick={play}>Play</button>
          <button onClick={pause}>Pause</button>
          <button onClick={stop}>Stop</button>
        </div>
      </div>

      <div class="demo-section">
        <h2>Speed Control</h2>
        <Lottie
          path="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json"
          autoplay
          loop
          speed={speed()}
          style={{ width: '300px', height: '300px', margin: '0 auto' }}
        />
        <div class="controls">
          <label>
            Speed: {speed()}x
            <input 
              type="range" 
              min="0.1" 
              max="3" 
              step="0.1" 
              value={speed()}
              onInput={(e) => setSpeed(parseFloat(e.currentTarget.value))}
            />
          </label>
        </div>
      </div>

      <div class="demo-section">
        <h2>Event Handling</h2>
        <Lottie
          path="https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json"
          autoplay
          loop={false}
          style={{ width: '300px', height: '300px', margin: '0 auto' }}
          onComplete={() => console.log('Animation completed!')}
          onLoopComplete={() => console.log('Loop completed!')}
        />
        <p style="text-align: center; color: #666;">Check console for events</p>
      </div>
    </div>
  );
}
