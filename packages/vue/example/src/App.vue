<script setup lang="ts">
import { ref, computed } from 'vue';
import { Lottie, useLottie } from '@ldesign/lottie-vue';

// State
const speed = ref(1);
const direction = ref<1 | -1>(1);
const currentFrame = ref(0);
const selectedRenderer = ref<'svg' | 'canvas'>('svg');
const autoplay = ref(true);
const loop = ref(true);

// Animation URLs
const animationUrl = 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json';

// useLottie hook example
const { containerRef, play, pause, stop, goToAndStop, goToAndPlay, animationItem } = useLottie({
  path: animationUrl,
  autoplay: false,
  loop: true,
  rendererSettings: {
    preserveAspectRatio: 'xMidYMid meet',
  },
});

// Event handlers
const onComplete = () => {
  console.log('Animation completed!');
  logMessage('✅ Animation completed');
};

const onLoopComplete = () => {
  console.log('Loop completed!');
  logMessage('🔄 Loop completed');
};

const onEnterFrame = (event: any) => {
  if (event.currentTime) {
    currentFrame.value = Math.round(event.currentTime);
  }
};

const onSegmentStart = () => {
  console.log('Segment started!');
  logMessage('▶️ Segment started');
};

const onDataReady = () => {
  console.log('Data ready!');
  logMessage('📦 Data ready');
};

const onDataFailed = () => {
  console.error('Data failed to load!');
  logMessage('❌ Data failed to load', true);
};

// Control methods
const handleSpeedChange = (value: number) => {
  speed.value = value;
};

const toggleDirection = () => {
  direction.value = direction.value === 1 ? -1 : 1;
};

const handleGoToFrame = () => {
  const frame = currentFrame.value;
  goToAndStop(frame, true);
  logMessage(`⏭️ Jumped to frame ${frame}`);
};

const handleGoToAndPlay = () => {
  const frame = currentFrame.value;
  goToAndPlay(frame, true);
  logMessage(`▶️ Playing from frame ${frame}`);
};

// Logs
const logs = ref<Array<{ message: string; isError: boolean; time: string }>>([]);

const logMessage = (message: string, isError = false) => {
  const time = new Date().toLocaleTimeString();
  logs.value.unshift({ message, isError, time });
  if (logs.value.length > 10) {
    logs.value.pop();
  }
};

const clearLogs = () => {
  logs.value = [];
};
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>🎨 Vue Lottie Example</h1>
      <p>Comprehensive demonstration of all features</p>
    </header>

    <div class="container">
      <!-- Basic Animation -->
      <section class="demo-section">
        <h2>1. Basic Animation</h2>
        <p>Simple autoplay animation with default settings</p>
        <div class="animation-container">
          <Lottie
            :path="animationUrl"
            :autoplay="true"
            :loop="true"
            class="lottie-player"
          />
        </div>
      </section>

      <!-- Controlled Animation -->
      <section class="demo-section">
        <h2>2. Controlled Animation (useLottie Hook)</h2>
        <p>Full control with play, pause, stop, and frame navigation</p>
        <div class="animation-container">
          <div ref="containerRef" class="lottie-player" />
        </div>
        <div class="controls">
          <button @click="play" class="btn btn-primary">▶️ Play</button>
          <button @click="pause" class="btn btn-secondary">⏸️ Pause</button>
          <button @click="stop" class="btn btn-danger">⏹️ Stop</button>
        </div>
      </section>

      <!-- Speed Control -->
      <section class="demo-section">
        <h2>3. Speed Control</h2>
        <p>Adjust animation playback speed dynamically</p>
        <div class="animation-container">
          <Lottie
            :path="animationUrl"
            :autoplay="true"
            :loop="true"
            :speed="speed"
            class="lottie-player"
          />
        </div>
        <div class="controls">
          <label class="control-label">
            Speed: {{ speed.toFixed(1) }}x
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              :value="speed"
              @input="handleSpeedChange(parseFloat(($event.target as HTMLInputElement).value))"
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
          <Lottie
            :path="animationUrl"
            :autoplay="autoplay"
            :loop="loop"
            :direction="direction"
            class="lottie-player"
          />
        </div>
        <div class="controls">
          <button @click="toggleDirection" class="btn btn-primary">
            {{ direction === 1 ? '⏪ Reverse' : '⏩ Forward' }}
          </button>
          <label class="checkbox-label">
            <input type="checkbox" v-model="autoplay" />
            Autoplay
          </label>
          <label class="checkbox-label">
            <input type="checkbox" v-model="loop" />
            Loop
          </label>
        </div>
      </section>

      <!-- Frame Navigation -->
      <section class="demo-section">
        <h2>5. Frame Navigation</h2>
        <p>Jump to specific frames or play from a specific frame</p>
        <div class="animation-container">
          <div ref="containerRef" class="lottie-player" />
        </div>
        <div class="controls">
          <label class="control-label">
            Frame: {{ currentFrame }}
            <input
              type="number"
              v-model.number="currentFrame"
              min="0"
              max="180"
              class="input-number"
            />
          </label>
          <button @click="handleGoToFrame" class="btn btn-secondary">
            ⏭️ Go to Frame
          </button>
          <button @click="handleGoToAndPlay" class="btn btn-primary">
            ▶️ Play from Frame
          </button>
        </div>
      </section>

      <!-- Renderer Selection -->
      <section class="demo-section">
        <h2>6. Renderer Selection</h2>
        <p>Choose between SVG and Canvas renderers</p>
        <div class="animation-container">
          <Lottie
            :path="animationUrl"
            :autoplay="true"
            :loop="true"
            :renderer="selectedRenderer"
            class="lottie-player"
          />
        </div>
        <div class="controls">
          <label class="radio-label">
            <input type="radio" value="svg" v-model="selectedRenderer" />
            SVG Renderer
          </label>
          <label class="radio-label">
            <input type="radio" value="canvas" v-model="selectedRenderer" />
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
            :path="animationUrl"
            :autoplay="true"
            :loop="false"
            class="lottie-player"
            @complete="onComplete"
            @loop-complete="onLoopComplete"
            @enter-frame="onEnterFrame"
            @segment-start="onSegmentStart"
            @data-ready="onDataReady"
            @data-failed="onDataFailed"
          />
        </div>
        <div class="logs-container">
          <div class="logs-header">
            <h3>Event Logs</h3>
            <button @click="clearLogs" class="btn btn-small">Clear</button>
          </div>
          <div class="logs">
            <div
              v-for="(log, index) in logs"
              :key="index"
              :class="['log-item', { 'log-error': log.isError }]"
            >
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="logs.length === 0" class="log-empty">
              No events yet. Interact with the animation to see logs.
            </div>
          </div>
        </div>
      </section>

      <!-- Custom Size -->
      <section class="demo-section">
        <h2>8. Custom Size</h2>
        <p>Animation with custom width and height</p>
        <div class="animation-container">
          <Lottie
            :path="animationUrl"
            :autoplay="true"
            :loop="true"
            style="width: 200px; height: 200px"
          />
          <Lottie
            :path="animationUrl"
            :autoplay="true"
            :loop="true"
            style="width: 400px; height: 400px"
          />
        </div>
      </section>
    </div>

    <footer class="footer">
      <p>Built with @ldesign/lottie-vue • Vue 3 Composition API</p>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
  color: #667eea;
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

.lottie-player {
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
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
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
</style>
