<script lang="ts">
  import { Lottie } from '@ldesign/lottie-svelte';

  interface Log {
    message: string;
    isError: boolean;
    time: string;
  }

  // State using Svelte 5 Runes
  let speed = $state(1);
  let direction = $state<1 | -1>(1);
  let currentFrame = $state(0);
  let selectedRenderer = $state<'svg' | 'canvas'>('svg');
  let autoplay = $state(true);
  let loop = $state(true);
  let logs = $state<Log[]>([]);

  const animationUrl = 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json';

  // Lottie refs for controlled animation
  let lottieRef1: any;
  let lottieRef2: any;

  function logMessage(message: string, isError = false) {
    const time = new Date().toLocaleTimeString();
    logs = [{ message, isError, time }, ...logs].slice(0, 10);
  }

  function toggleDirection() {
    direction = direction === 1 ? -1 : 1;
  }

  function handleGoToFrame() {
    if (lottieRef1) {
      lottieRef1.goToAndStop(currentFrame, true);
      logMessage(`⏭️ Jumped to frame ${currentFrame}`);
    }
  }

  function handleGoToAndPlay() {
    if (lottieRef1) {
      lottieRef1.goToAndPlay(currentFrame, true);
      logMessage(`▶️ Playing from frame ${currentFrame}`);
    }
  }

  function clearLogs() {
    logs = [];
  }

  // Event handlers
  function onComplete() {
    logMessage('✅ Animation completed');
  }

  function onLoopComplete() {
    logMessage('🔄 Loop completed');
  }

  function onEnterFrame(event: any) {
    if (event.detail?.currentTime) {
      currentFrame = Math.round(event.detail.currentTime);
    }
  }

  function onDataReady() {
    logMessage('📦 Data ready');
  }
</script>

<div class="app">
  <header class="header">
    <h1>🧡 Svelte Lottie Example</h1>
    <p>Comprehensive demonstration with Svelte 5 Runes</p>
  </header>

  <div class="container">
    <!-- Basic Animation -->
    <section class="demo-section">
      <h2>1. Basic Animation</h2>
      <p>Simple autoplay animation with default settings</p>
      <div class="animation-container">
        <Lottie path={animationUrl} autoplay loop class="lottie-player" />
      </div>
    </section>

    <!-- Controlled Animation -->
    <section class="demo-section">
      <h2>2. Controlled Animation</h2>
      <p>Full control with play, pause, stop</p>
      <div class="animation-container">
        <Lottie
          bind:this={lottieRef1}
          path={animationUrl}
          autoplay={false}
          loop
          class="lottie-player"
        />
      </div>
      <div class="controls">
        <button onclick={() => lottieRef1?.play()} class="btn btn-primary">▶️ Play</button>
        <button onclick={() => lottieRef1?.pause()} class="btn btn-secondary">⏸️ Pause</button>
        <button onclick={() => lottieRef1?.stop()} class="btn btn-danger">⏹️ Stop</button>
      </div>
    </section>

    <!-- Speed Control -->
    <section class="demo-section">
      <h2>3. Speed Control</h2>
      <p>Adjust animation playback speed dynamically</p>
      <div class="animation-container">
        <Lottie path={animationUrl} autoplay loop {speed} class="lottie-player" />
      </div>
      <div class="controls">
        <label class="control-label">
          Speed: {speed.toFixed(1)}x
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            bind:value={speed}
            class="slider"
          />
        </label>
      </div>
    </section>

    <!-- Direction Control -->
    <section class="demo-section">
      <h2>4. Direction Control</h2>
      <p>Play animation forward or backward</p>
      <div class="animation-container">
        <Lottie path={animationUrl} {autoplay} {loop} {direction} class="lottie-player" />
      </div>
      <div class="controls">
        <button onclick={toggleDirection} class="btn btn-primary">
          {direction === 1 ? '⏪ Reverse' : '⏩ Forward'}
        </button>
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={autoplay} />
          Autoplay
        </label>
        <label class="checkbox-label">
          <input type="checkbox" bind:checked={loop} />
          Loop
        </label>
      </div>
    </section>

    <!-- Frame Navigation -->
    <section class="demo-section">
      <h2>5. Frame Navigation</h2>
      <p>Jump to specific frames</p>
      <div class="animation-container">
        <Lottie
          bind:this={lottieRef2}
          path={animationUrl}
          autoplay={false}
          loop
          class="lottie-player"
        />
      </div>
      <div class="controls">
        <label class="control-label">
          Frame: {currentFrame}
          <input type="number" bind:value={currentFrame} min="0" max="180" class="input-number" />
        </label>
        <button onclick={handleGoToFrame} class="btn btn-secondary">⏭️ Go to Frame</button>
        <button onclick={handleGoToAndPlay} class="btn btn-primary">▶️ Play from Frame</button>
      </div>
    </section>

    <!-- Renderer Selection -->
    <section class="demo-section">
      <h2>6. Renderer Selection</h2>
      <p>Choose between SVG and Canvas renderers</p>
      <div class="animation-container">
        <Lottie
          path={animationUrl}
          autoplay
          loop
          renderer={selectedRenderer}
          class="lottie-player"
        />
      </div>
      <div class="controls">
        <label class="radio-label">
          <input type="radio" value="svg" bind:group={selectedRenderer} />
          SVG Renderer
        </label>
        <label class="radio-label">
          <input type="radio" value="canvas" bind:group={selectedRenderer} />
          Canvas Renderer
        </label>
      </div>
    </section>

    <!-- Event Handling -->
    <section class="demo-section">
      <h2>7. Event Handling</h2>
      <p>Listen to animation events</p>
      <div class="animation-container">
        <Lottie
          path={animationUrl}
          autoplay
          loop={false}
          class="lottie-player"
          oncomplete={onComplete}
          onloopcomplete={onLoopComplete}
          onenterframe={onEnterFrame}
          ondataready={onDataReady}
        />
      </div>
      <div class="logs-container">
        <div class="logs-header">
          <h3>Event Logs</h3>
          <button onclick={clearLogs} class="btn btn-small">Clear</button>
        </div>
        <div class="logs">
          {#if logs.length === 0}
            <div class="log-empty">No events yet</div>
          {:else}
            {#each logs as log}
              <div class="log-item" class:log-error={log.isError}>
                <span class="log-time">{log.time}</span>
                <span class="log-message">{log.message}</span>
              </div>
            {/each}
          {/if}
        </div>
      </div>
    </section>

    <!-- Custom Size -->
    <section class="demo-section">
      <h2>8. Custom Size</h2>
      <p>Animations with custom dimensions</p>
      <div class="animation-container">
        <Lottie path={animationUrl} autoplay loop style="width: 200px; height: 200px" />
        <Lottie path={animationUrl} autoplay loop style="width: 400px; height: 400px" />
      </div>
    </section>
  </div>

  <footer class="footer">
    <p>Built with @ldesign/lottie-svelte • Svelte 5 Runes</p>
  </footer>
</div>

<style>
  :global(*) {
    box-sizing: border-box;
  }

  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
      'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  }

  .app {
    min-height: 100vh;
    background: linear-gradient(135deg, #ff3e00 0%, #ff1744 100%);
    color: #fff;
  }

  .header {
    text-align: center;
    padding: 3rem 1rem;
    background: rgba(0, 0, 0, 0.2);
  }

  .header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2.5rem;
  }

  .header p {
    margin: 0;
    opacity: 0.9;
    font-size: 1.1rem;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  .demo-section {
    background: rgba(255, 255, 255, 0.95);
    color: #333;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .demo-section h2 {
    margin: 0 0 0.5rem 0;
    color: #ff3e00;
  }

  .demo-section p {
    margin: 0 0 1.5rem 0;
    color: #666;
  }

  .animation-container {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    padding: 2rem;
    background: #f8f9fa;
    border-radius: 8px;
  }

  :global(.lottie-player) {
    width: 300px;
    height: 300px;
  }

  .controls {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    align-items: center;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.3s;
  }

  .btn-primary {
    background: #ff3e00;
    color: white;
  }

  .btn-primary:hover {
    background: #e63900;
    transform: translateY(-2px);
  }

  .btn-secondary {
    background: #48bb78;
    color: white;
  }

  .btn-secondary:hover {
    background: #38a169;
    transform: translateY(-2px);
  }

  .btn-danger {
    background: #f56565;
    color: white;
  }

  .btn-danger:hover {
    background: #e53e3e;
    transform: translateY(-2px);
  }

  .btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .control-label {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-weight: 500;
  }

  .slider {
    width: 200px;
  }

  .input-number {
    width: 80px;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }

  .checkbox-label,
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  .logs-container {
    background: #1a202c;
    color: #fff;
    border-radius: 8px;
    overflow: hidden;
  }

  .logs-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #2d3748;
  }

  .logs-header h3 {
    margin: 0;
    font-size: 1rem;
  }

  .logs {
    max-height: 300px;
    overflow-y: auto;
    padding: 1rem;
  }

  .log-item {
    display: flex;
    gap: 1rem;
    padding: 0.5rem;
    border-bottom: 1px solid #2d3748;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.875rem;
  }

  .log-error {
    background: rgba(245, 101, 101, 0.1);
    border-left: 3px solid #f56565;
  }

  .log-time {
    opacity: 0.6;
    min-width: 80px;
  }

  .log-message {
    flex: 1;
  }

  .log-empty {
    text-align: center;
    opacity: 0.5;
    padding: 2rem;
  }

  .footer {
    text-align: center;
    padding: 2rem;
    background: rgba(0, 0, 0, 0.2);
  }

  .footer p {
    margin: 0;
    opacity: 0.8;
  }

  :global(::-webkit-scrollbar) {
    width: 8px;
    height: 8px;
  }

  :global(::-webkit-scrollbar-track) {
    background: #2d3748;
  }

  :global(::-webkit-scrollbar-thumb) {
    background: #4a5568;
    border-radius: 4px;
  }

  :global(::-webkit-scrollbar-thumb:hover) {
    background: #ff3e00;
  }
</style>
