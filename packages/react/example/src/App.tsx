import { useState } from 'react';
import { Lottie, useLottie } from '@ldesign/lottie-react';
import './App.css';

interface Log {
  message: string;
  isError: boolean;
  time: string;
}

export default function App() {
  // State
  const [speed, setSpeed] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedRenderer, setSelectedRenderer] = useState<'svg' | 'canvas'>('svg');
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);

  // Animation URL
  const animationUrl = 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json';

  // useLottie hook for controlled animation
  const { containerRef, play, pause, stop, goToAndStop, goToAndPlay } = useLottie({
    path: animationUrl,
    autoplay: false,
    loop: true,
  });

  // Event handlers
  const logMessage = (message: string, isError = false) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => {
      const newLogs = [{ message, isError, time }, ...prev];
      return newLogs.slice(0, 10);
    });
  };

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
      setCurrentFrame(Math.round(event.currentTime));
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

  const toggleDirection = () => {
    setDirection(prev => prev === 1 ? -1 : 1);
  };

  const handleGoToFrame = () => {
    goToAndStop(currentFrame, true);
    logMessage(`⏭️ Jumped to frame ${currentFrame}`);
  };

  const handleGoToAndPlay = () => {
    goToAndPlay(currentFrame, true);
    logMessage(`▶️ Playing from frame ${currentFrame}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>⚛️ React Lottie Example</h1>
        <p>Comprehensive demonstration of all features</p>
      </header>

      <div className="container">
        {/* Basic Animation */}
        <section className="demo-section">
          <h2>1. Basic Animation</h2>
          <p>Simple autoplay animation with default settings</p>
          <div className="animation-container">
            <Lottie
              path={animationUrl}
              autoplay={true}
              loop={true}
              className="lottie-player"
            />
          </div>
        </section>

        {/* Controlled Animation */}
        <section className="demo-section">
          <h2>2. Controlled Animation (useLottie Hook)</h2>
          <p>Full control with play, pause, stop, and frame navigation</p>
          <div className="animation-container">
            <div ref={containerRef} className="lottie-player" />
          </div>
          <div className="controls">
            <button onClick={play} className="btn btn-primary">▶️ Play</button>
            <button onClick={pause} className="btn btn-secondary">⏸️ Pause</button>
            <button onClick={stop} className="btn btn-danger">⏹️ Stop</button>
          </div>
        </section>

        {/* Speed Control */}
        <section className="demo-section">
          <h2>3. Speed Control</h2>
          <p>Adjust animation playback speed dynamically</p>
          <div className="animation-container">
            <Lottie
              path={animationUrl}
              autoplay={true}
              loop={true}
              speed={speed}
              className="lottie-player"
            />
          </div>
          <div className="controls">
            <label className="control-label">
              Speed: {speed.toFixed(1)}x
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="slider"
              />
            </label>
          </div>
        </section>

        {/* Direction Control */}
        <section className="demo-section">
          <h2>4. Direction Control</h2>
          <p>Play animation forward or backward</p>
          <div className="animation-container">
            <Lottie
              path={animationUrl}
              autoplay={autoplay}
              loop={loop}
              direction={direction}
              className="lottie-player"
            />
          </div>
          <div className="controls">
            <button onClick={toggleDirection} className="btn btn-primary">
              {direction === 1 ? '⏪ Reverse' : '⏩ Forward'}
            </button>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoplay}
                onChange={(e) => setAutoplay(e.target.checked)}
              />
              Autoplay
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={loop}
                onChange={(e) => setLoop(e.target.checked)}
              />
              Loop
            </label>
          </div>
        </section>

        {/* Frame Navigation */}
        <section className="demo-section">
          <h2>5. Frame Navigation</h2>
          <p>Jump to specific frames or play from a specific frame</p>
          <div className="animation-container">
            <div ref={containerRef} className="lottie-player" />
          </div>
          <div className="controls">
            <label className="control-label">
              Frame: {currentFrame}
              <input
                type="number"
                value={currentFrame}
                onChange={(e) => setCurrentFrame(Number(e.target.value))}
                min="0"
                max="180"
                className="input-number"
              />
            </label>
            <button onClick={handleGoToFrame} className="btn btn-secondary">
              ⏭️ Go to Frame
            </button>
            <button onClick={handleGoToAndPlay} className="btn btn-primary">
              ▶️ Play from Frame
            </button>
          </div>
        </section>

        {/* Renderer Selection */}
        <section className="demo-section">
          <h2>6. Renderer Selection</h2>
          <p>Choose between SVG and Canvas renderers</p>
          <div className="animation-container">
            <Lottie
              path={animationUrl}
              autoplay={true}
              loop={true}
              renderer={selectedRenderer}
              className="lottie-player"
            />
          </div>
          <div className="controls">
            <label className="radio-label">
              <input
                type="radio"
                value="svg"
                checked={selectedRenderer === 'svg'}
                onChange={() => setSelectedRenderer('svg')}
              />
              SVG Renderer
            </label>
            <label className="radio-label">
              <input
                type="radio"
                value="canvas"
                checked={selectedRenderer === 'canvas'}
                onChange={() => setSelectedRenderer('canvas')}
              />
              Canvas Renderer
            </label>
          </div>
        </section>

        {/* Event Handling */}
        <section className="demo-section">
          <h2>7. Event Handling</h2>
          <p>Listen to animation events</p>
          <div className="animation-container">
            <Lottie
              path={animationUrl}
              autoplay={true}
              loop={false}
              className="lottie-player"
              onComplete={onComplete}
              onLoopComplete={onLoopComplete}
              onEnterFrame={onEnterFrame}
              onSegmentStart={onSegmentStart}
              onDataReady={onDataReady}
              onDataFailed={onDataFailed}
            />
          </div>
          <div className="logs-container">
            <div className="logs-header">
              <h3>Event Logs</h3>
              <button onClick={clearLogs} className="btn btn-small">Clear</button>
            </div>
            <div className="logs">
              {logs.length === 0 ? (
                <div className="log-empty">
                  No events yet. Interact with the animation to see logs.
                </div>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`log-item ${log.isError ? 'log-error' : ''}`}
                  >
                    <span className="log-time">{log.time}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Custom Size */}
        <section className="demo-section">
          <h2>8. Custom Size</h2>
          <p>Animation with custom width and height</p>
          <div className="animation-container">
            <Lottie
              path={animationUrl}
              autoplay={true}
              loop={true}
              style={{ width: '200px', height: '200px' }}
            />
            <Lottie
              path={animationUrl}
              autoplay={true}
              loop={true}
              style={{ width: '400px', height: '400px' }}
            />
          </div>
        </section>
      </div>

      <footer className="footer">
        <p>Built with @ldesign/lottie-react • React 18 Hooks</p>
      </footer>
    </div>
  );
}
