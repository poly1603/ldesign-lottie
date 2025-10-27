import React, { useRef, useState } from 'react'
import { Lottie, useLottie, LottieProvider, type LottieRef } from '@ldesign/lottie-react'
import animationData from './animation.json'
import './App.css'

function App() {
  return (
    <LottieProvider>
      <div className="app">
        <h1>🚀 Lottie React Demo</h1>

        <div className="demo-grid">
          <BasicDemo />
          <HookDemo />
          <InteractiveDemo />
          <RefDemo />
        </div>
      </div>
    </LottieProvider>
  )
}

// 基础组件示例
function BasicDemo() {
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed, setSpeed] = useState(1)

  return (
    <div className="demo-card">
      <h2>基础组件示例</h2>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={isPlaying}
        speed={speed}
        className="lottie-container"
        style={{ height: 250 }}
        onComplete={() => console.log('Animation completed')}
        onLoopComplete={() => console.log('Loop completed')}
      />
      <div className="controls">
        <button onClick={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? '暂停' : '播放'}
        </button>
        <button onClick={() => setSpeed(speed + 0.5)}>
          加速 ({speed}x)
        </button>
        <button onClick={() => setSpeed(Math.max(0.5, speed - 0.5))}>
          减速
        </button>
      </div>
    </div>
  )
}

// Hook 示例
function HookDemo() {
  const {
    containerRef,
    instance,
    isReady,
    isPlaying,
    play,
    pause,
    stop,
    setSpeed,
    setDirection
  } = useLottie({
    animationData,
    loop: true,
    autoplay: false,
    renderer: 'canvas'
  })

  const [direction, setLocalDirection] = useState<1 | -1>(1)

  return (
    <div className="demo-card">
      <h2>useLottie Hook 示例</h2>
      <div ref={containerRef} className="lottie-container" style={{ height: 250 }} />
      <div className="info">
        状态: {isReady ? (isPlaying ? '播放中' : '已暂停') : '加载中'}
      </div>
      <div className="controls">
        <button onClick={play}>播放</button>
        <button onClick={pause}>暂停</button>
        <button onClick={stop}>停止</button>
        <button onClick={() => {
          const newDirection = direction === 1 ? -1 : 1
          setLocalDirection(newDirection)
          setDirection(newDirection)
        }}>
          反向 ({direction > 0 ? '正向' : '反向'})
        </button>
      </div>
    </div>
  )
}

// 交互式示例
function InteractiveDemo() {
  const [hoverPlay, setHoverPlay] = useState(false)
  const lottieRef = useRef<LottieRef>(null)

  return (
    <div className="demo-card">
      <h2>交互式动画</h2>
      <div
        onMouseEnter={() => hoverPlay && lottieRef.current?.play()}
        onMouseLeave={() => hoverPlay && lottieRef.current?.pause()}
      >
        <Lottie
          ref={lottieRef}
          animationData={animationData}
          loop={true}
          autoplay={false}
          className="lottie-container"
          style={{ height: 250, cursor: hoverPlay ? 'pointer' : 'default' }}
        />
      </div>
      <div className="controls">
        <button onClick={() => setHoverPlay(!hoverPlay)}>
          悬停播放: {hoverPlay ? '开启' : '关闭'}
        </button>
        <button onClick={() => {
          const frame = prompt('跳转到帧数:')
          if (frame) {
            lottieRef.current?.goToAndStop(parseInt(frame), true)
          }
        }}>
          跳转帧
        </button>
        <button onClick={() => {
          const totalFrames = lottieRef.current?.getTotalFrames() || 0
          lottieRef.current?.goToAndPlay(totalFrames * 0.5, true)
        }}>
          播放后半段
        </button>
      </div>
    </div>
  )
}

// Ref 控制示例
function RefDemo() {
  const lottieRef = useRef<LottieRef>(null)
  const [info, setInfo] = useState('准备就绪')

  const updateInfo = () => {
    if (lottieRef.current) {
      const current = lottieRef.current.getCurrentFrame()
      const total = lottieRef.current.getTotalFrames()
      const duration = lottieRef.current.getDuration()
      setInfo(`帧: ${current}/${total} | 时长: ${duration?.toFixed(2)}s`)
    }
  }

  return (
    <div className="demo-card">
      <h2>Ref 控制示例</h2>
      <Lottie
        ref={lottieRef}
        animationData={animationData}
        loop={true}
        autoplay={true}
        className="lottie-container"
        style={{ height: 250 }}
        onEnterFrame={updateInfo}
        onReady={() => setInfo('动画已加载')}
      />
      <div className="info">{info}</div>
      <div className="controls">
        <button onClick={() => lottieRef.current?.setSpeed(0.5)}>
          0.5x 速度
        </button>
        <button onClick={() => lottieRef.current?.setSpeed(1)}>
          1x 速度
        </button>
        <button onClick={() => lottieRef.current?.setSpeed(2)}>
          2x 速度
        </button>
        <button onClick={() => {
          lottieRef.current?.destroy()
          setInfo('动画已销毁')
        }}>
          销毁
        </button>
      </div>
    </div>
  )
}

export default App


