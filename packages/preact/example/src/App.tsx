import { useState } from 'preact/hooks';
import { LottiePlayer, useLottie } from '@ldesign/lottie-preact';
import './App.css';

interface Log {
  message: string;
  isError: boolean;
  time: string;
}

export default function App() {
  const [speed, setSpeed] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selectedRenderer, setSelectedRenderer] = useState<'svg' | 'canvas'>('svg');
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [logs, setLogs] = useState<Log[]>([]);

  const animationUrl = 'https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.json';

  const { containerRef, play, pause, stop, goToAndStop, goToAndPlay } = useLottie({
    path: animationUrl,
    autoplay: false,
    loop: true,
  });

  const logMessage = (message: string, isError = false) => {
    const time = new Date().toLocaleTimeString();
    setLogs(prev => [{ message, isError, time }, ...prev].slice(0, 10));
  };

  return (
    <div className="app">
      <header className="header">
        <h1>馃挕 Preact Lottie Example</h1>
        <p>Comprehensive demonstration of all features</p>
      </header>

      <div className="container">
        {/* Basic Animation */}
        <section className="demo-section">
          <h2>1. Basic Animation</h2>
          <p>Simple autoplay animation with default settings</p>
          <div className="animation-container">
            <LottiePlayer path={animationUrl} autoplay loop className="lottie-player" />
          </div>
        </section>

        {/* Controlled Animation */}
        <section className="demo-section">
          <h2>2. Controlled Animation (useLottie Hook)</h2>
          <p>Full control with play, pause, stop</p>
          <div className="animation-container">
            <div ref={containerRef} className="lottie-player" />
          </div>
          <div className="controls">
            <button onClick={play} className="btn btn-primary">鈻讹笍 Play</button>
            <button onClick={pause} className="btn btn-secondary">鈴革笍 Pause</button>
            <button onClick={stop} className="btn btn-danger">鈴癸笍 Stop</button>
          </div>
        </section>

        {/* Speed Control */}
        <section className="demo-section">
          <h2>3. Speed Control</h2>
          <p>Adjust animation playback speed dynamically</p>
          <div className="animation-container">
            <LottiePlayer path={animationUrl} autoplay loop speed={speed} className="lottie-player" />
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
                onInput={(e) => setSpeed(parseFloat((e.target as HTMLInputElement).value))}
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
            <LottiePlayer
              path={animationUrl}
              autoplay={autoplay}
              loop={loop}
              direction={direction}
              className="lottie-player"
            />
          </div>
          <div className="controls">
            <button onClick={() => setDirection(d => d === 1 ? -1 : 1)} className="btn btn-primary">
              {direction === 1 ? '鈴?Reverse' : '鈴?Forward'}
            </button>
            <label className="checkbox-label">
              <input type="checkbox" checked={autoplay} onChange={(e) => setAutoplay((e.target as HTMLInputElement).checked)} />
              Autoplay
            </label>
            <label className="checkbox-label">
              <input type="checkbox" checked={loop} onChange={(e) => setLoop((e.target as HTMLInputElement).checked)} />
              Loop
            </label>
          </div>
        </section>

        {/* Frame Navigation */}
        <section className="demo-section">
          <h2>5. Frame Navigation</h2>
          <p>Jump to specific frames</p>
          <div className="animation-container">
            <div ref={containerRef} className="lottie-player" />
          </div>
          <div className="controls">
            <label className="control-label">
              Frame: {currentFrame}
              <input
                type="number"
                value={currentFrame}
                onInput={(e) => setCurrentFrame(Number((e.target as HTMLInputElement).value))}
                min="0"
                max="180"
                className="input-number"
              />
            </label>
            <button onClick={() => { goToAndStop(currentFrame, true); logMessage(`鈴笍 Frame ${currentFrame}`); }} className="btn btn-secondary">
              鈴笍 Go to Frame
            </button>
            <button onClick={() => { goToAndPlay(currentFrame, true); logMessage(`鈻讹笍 Play from ${currentFrame}`); }} className="btn btn-primary">
              鈻讹笍 Play from Frame
            </button>
          </div>
        </section>

        {/* Renderer Selection */}
        <section className="demo-section">
          <h2>6. Renderer Selection</h2>
          <p>Choose between SVG and Canvas renderers</p>
          <div className="animation-container">
            <LottiePlayer path={animationUrl} autoplay loop renderer={selectedRenderer} className="lottie-player" />
          </div>
          <div className="controls">
            <label className="radio-label">
              <input type="radio" value="svg" checked={selectedRenderer === 'svg'} onChange={() => setSelectedRenderer('svg')} />
              SVG Renderer
            </label>
            <label className="radio-label">
              <input type="radio" value="canvas" checked={selectedRenderer === 'canvas'} onChange={() => setSelectedRenderer('canvas')} />
              Canvas Renderer
            </label>
          </div>
        </section>

        {/* Event Handling */}
        <section className="demo-section">
          <h2>7. Event Handling</h2>
          <p>Listen to animation events</p>
          <div className="animation-container">
            <LottiePlayer
              path={animationUrl}
              autoplay
              loop={false}
              className="lottie-player"
              onComplete={() => logMessage('鉁?Completed')}
              onLoopComplete={() => logMessage('馃攧 Loop complete')}
              onEnterFrame={(e: any) => e.currentTime && setCurrentFrame(Math.round(e.currentTime))}
              onDataReady={() => logMessage('馃摝 Data ready')}
            />
          </div>
          <div className="logs-container">
            <div className="logs-header">
              <h3>Event Logs</h3>
              <button onClick={() => setLogs([])} className="btn btn-small">Clear</button>
            </div>
            <div className="logs">
              {logs.length === 0 ? (
                <div className="log-empty">No events yet</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className={`log-item ${log.isError ? 'log-error' : ''}`}>
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
          <p>Animations with custom dimensions</p>
          <div className="animation-container">
            <LottiePlayer path={animationUrl} autoplay loop style={{ width: '200px', height: '200px' }} />
            <LottiePlayer path={animationUrl} autoplay loop style={{ width: '400px', height: '400px' }} />
          </div>
        </section>
      </div>

      <footer className="footer">
        <p>Built with @ldesign/lottie-preact 鈥?Preact 10 (3KB Alternative to React)</p>
      </footer>
    </div>
  );
}



