import { component$, useSignal, useVisibleTask$, $ } from '@builder.io/qwik';
import { Lottie } from '@ldesign/lottie-qwik';
import './App.css';

interface Log {
  message: string;
  isError: boolean;
  time: string;
}

export default component$(() => {
  // Signals for reactive state
  const speed = useSignal(1);
  const direction = useSignal<1 | -1>(1);
  const currentFrame = useSignal(0);
  const selectedRenderer = useSignal<'svg' | 'canvas'>('svg');
  const autoplay = useSignal(true);
  const loop = useSignal(true);
  const logs = useSignal<Log[]>([]);

  const animationUrl = 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json';

  // Lottie refs
  const lottieRef1 = useSignal<any>();
  const lottieRef2 = useSignal<any>();

  const logMessage = $((message: string, isError = false) => {
    const time = new Date().toLocaleTimeString();
    logs.value = [{ message, isError, time }, ...logs.value].slice(0, 10);
  });

  const toggleDirection = $(() => {
    direction.value = direction.value === 1 ? -1 : 1;
  });

  const handleGoToFrame = $(async () => {
    if (lottieRef1.value) {
      await lottieRef1.value.goToAndStop(currentFrame.value, true);
      logMessage(`⏭️ Frame ${currentFrame.value}`);
    }
  });

  const handleGoToAndPlay = $(async () => {
    if (lottieRef1.value) {
      await lottieRef1.value.goToAndPlay(currentFrame.value, true);
      logMessage(`▶️ Play from ${currentFrame.value}`);
    }
  });

  const clearLogs = $(() => {
    logs.value = [];
  });

  return (
    <div class="app">
      <header class="header">
        <h1>⚡ Qwik Lottie Example</h1>
        <p>Comprehensive demonstration with Resumability</p>
      </header>

      <div class="container">
        {/* Basic Animation */}
        <section class="demo-section">
          <h2>1. Basic Animation</h2>
          <p>Simple autoplay animation with default settings</p>
          <div class="animation-container">
            <Lottie path={animationUrl} autoplay loop class="lottie-player" />
          </div>
        </section>

        {/* Controlled Animation */}
        <section class="demo-section">
          <h2>2. Controlled Animation</h2>
          <p>Full control with play, pause, stop</p>
          <div class="animation-container">
            <Lottie
              ref={lottieRef1}
              path={animationUrl}
              autoplay={false}
              loop
              class="lottie-player"
            />
          </div>
          <div class="controls">
            <button onClick$={() => lottieRef1.value?.play()} class="btn btn-primary">
              ▶️ Play
            </button>
            <button onClick$={() => lottieRef1.value?.pause()} class="btn btn-secondary">
              ⏸️ Pause
            </button>
            <button onClick$={() => lottieRef1.value?.stop()} class="btn btn-danger">
              ⏹️ Stop
            </button>
          </div>
        </section>

        {/* Speed Control */}
        <section class="demo-section">
          <h2>3. Speed Control</h2>
          <p>Adjust animation playback speed dynamically</p>
          <div class="animation-container">
            <Lottie path={animationUrl} autoplay loop speed={speed.value} class="lottie-player" />
          </div>
          <div class="controls">
            <label class="control-label">
              Speed: {speed.value.toFixed(1)}x
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={speed.value}
                onInput$={(e) => (speed.value = parseFloat((e.target as HTMLInputElement).value))}
                class="slider"
              />
            </label>
          </div>
        </section>

        {/* Direction Control */}
        <section class="demo-section">
          <h2>4. Direction Control</h2>
          <p>Play animation forward or backward</p>
          <div class="animation-container">
            <Lottie
              path={animationUrl}
              autoplay={autoplay.value}
              loop={loop.value}
              direction={direction.value}
              class="lottie-player"
            />
          </div>
          <div class="controls">
            <button onClick$={toggleDirection} class="btn btn-primary">
              {direction.value === 1 ? '⏪ Reverse' : '⏩ Forward'}
            </button>
            <label class="checkbox-label">
              <input
                type="checkbox"
                checked={autoplay.value}
                onChange$={(e) => (autoplay.value = (e.target as HTMLInputElement).checked)}
              />
              Autoplay
            </label>
            <label class="checkbox-label">
              <input
                type="checkbox"
                checked={loop.value}
                onChange$={(e) => (loop.value = (e.target as HTMLInputElement).checked)}
              />
              Loop
            </label>
          </div>
        </section>

        {/* Frame Navigation */}
        <section class="demo-section">
          <h2>5. Frame Navigation</h2>
          <p>Jump to specific frames</p>
          <div class="animation-container">
            <Lottie
              ref={lottieRef2}
              path={animationUrl}
              autoplay={false}
              loop
              class="lottie-player"
            />
          </div>
          <div class="controls">
            <label class="control-label">
              Frame: {currentFrame.value}
              <input
                type="number"
                value={currentFrame.value}
                onInput$={(e) => (currentFrame.value = Number((e.target as HTMLInputElement).value))}
                min="0"
                max="180"
                class="input-number"
              />
            </label>
            <button onClick$={handleGoToFrame} class="btn btn-secondary">
              ⏭️ Go to Frame
            </button>
            <button onClick$={handleGoToAndPlay} class="btn btn-primary">
              ▶️ Play from Frame
            </button>
          </div>
        </section>

        {/* Renderer Selection */}
        <section class="demo-section">
          <h2>6. Renderer Selection</h2>
          <p>Choose between SVG and Canvas renderers</p>
          <div class="animation-container">
            <Lottie
              path={animationUrl}
              autoplay
              loop
              renderer={selectedRenderer.value}
              class="lottie-player"
            />
          </div>
          <div class="controls">
            <label class="radio-label">
              <input
                type="radio"
                value="svg"
                checked={selectedRenderer.value === 'svg'}
                onChange$={() => (selectedRenderer.value = 'svg')}
              />
              SVG Renderer
            </label>
            <label class="radio-label">
              <input
                type="radio"
                value="canvas"
                checked={selectedRenderer.value === 'canvas'}
                onChange$={() => (selectedRenderer.value = 'canvas')}
              />
              Canvas Renderer
            </label>
          </div>
        </section>

        {/* Event Handling */}
        <section class="demo-section">
          <h2>7. Event Handling</h2>
          <p>Listen to animation events</p>
          <div class="animation-container">
            <Lottie
              path={animationUrl}
              autoplay
              loop={false}
              class="lottie-player"
              onComplete$={() => logMessage('✅ Completed')}
              onLoopComplete$={() => logMessage('🔄 Loop')}
              onEnterFrame$={(e: any) => e.currentTime && (currentFrame.value = Math.round(e.currentTime))}
              onDataReady$={() => logMessage('📦 Data ready')}
            />
          </div>
          <div class="logs-container">
            <div class="logs-header">
              <h3>Event Logs</h3>
              <button onClick$={clearLogs} class="btn btn-small">
                Clear
              </button>
            </div>
            <div class="logs">
              {logs.value.length === 0 ? (
                <div class="log-empty">No events yet</div>
              ) : (
                logs.value.map((log, i) => (
                  <div key={i} class={`log-item ${log.isError ? 'log-error' : ''}`}>
                    <span class="log-time">{log.time}</span>
                    <span class="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Custom Size */}
        <section class="demo-section">
          <h2>8. Custom Size</h2>
          <p>Animations with custom dimensions</p>
          <div class="animation-container">
            <Lottie path={animationUrl} autoplay loop style={{ width: '200px', height: '200px' }} />
            <Lottie path={animationUrl} autoplay loop style={{ width: '400px', height: '400px' }} />
          </div>
        </section>
      </div>

      <footer class="footer">
        <p>Built with @ldesign/lottie-qwik • Qwik Resumability</p>
      </footer>
    </div>
  );
});
