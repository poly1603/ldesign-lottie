import {
  createLottie,
  initWASM,
  AIOptimizer,
  pluginManager,
  WatermarkPlugin,
  type ILottieInstance
} from '@ldesign/lottie-core'

// 示例动画 URL
const ANIMATION_URL = '/simple-animation.json'

// 初始化 WASM
async function initializeWASM() {
  try {
    await initWASM()
    console.log('✅ WASM 模块已加载')
  } catch (error) {
    console.warn('⚠️ WASM 加载失败，使用 JS 后备方案', error)
  }
}

// 创建基础示例
function createBasicDemo() {
  const container = document.getElementById('basic-lottie')!
  const info = document.getElementById('basic-info')!

  const instance = createLottie({
    container,
    path: ANIMATION_URL,
    renderer: 'svg',
    loop: true,
    autoplay: true,
  })

  instance.on('ready', () => {
    container.querySelector('.loading')?.remove()
    updateInfo()
  })

  instance.on('error', (error) => {
    container.innerHTML = `<div class="error">加载失败: ${error.message}</div>`
  })

  // 控制按钮
  document.getElementById('basic-play')?.addEventListener('click', () => {
    instance.play()
    updateInfo()
  })

  document.getElementById('basic-pause')?.addEventListener('click', () => {
    instance.pause()
    updateInfo()
  })

  document.getElementById('basic-stop')?.addEventListener('click', () => {
    instance.stop()
    updateInfo()
  })

  function updateInfo() {
    info.textContent = `状态: ${instance.state} | 帧: ${Math.round(instance.animation?.currentFrame || 0)}/${instance.animation?.totalFrames || 0}`
  }

  // 定期更新信息
  setInterval(updateInfo, 100)
}

// 创建 Canvas 示例
function createCanvasDemo() {
  const container = document.getElementById('canvas-lottie')!
  const info = document.getElementById('canvas-info')!
  let speed = 1
  let direction = 1

  const instance = createLottie({
    container,
    path: ANIMATION_URL,
    renderer: 'canvas',
    loop: true,
    autoplay: true,
  })

  instance.on('ready', () => {
    container.querySelector('.loading')?.remove()
  })

  // 速度控制
  document.getElementById('canvas-speed-up')?.addEventListener('click', () => {
    speed = Math.min(speed + 0.5, 5)
    instance.setSpeed(speed)
    updateInfo()
  })

  document.getElementById('canvas-speed-down')?.addEventListener('click', () => {
    speed = Math.max(speed - 0.5, 0.1)
    instance.setSpeed(speed)
    updateInfo()
  })

  document.getElementById('canvas-reverse')?.addEventListener('click', () => {
    direction *= -1
    instance.setDirection(direction as 1 | -1)
    updateInfo()
  })

  function updateInfo() {
    info.textContent = `速度: ${speed}x | 方向: ${direction > 0 ? '正向' : '反向'}`
  }
}

// 创建 WebGL 示例
function createWebGLDemo() {
  const container = document.getElementById('webgl-lottie')!
  const info = document.getElementById('webgl-info')!

  // 检测 WebGL 支持
  const canvas = document.createElement('canvas')
  const hasWebGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))

  if (!hasWebGL) {
    info.textContent = 'WebGL: 不支持，回退到 Canvas'
  } else {
    info.textContent = 'WebGL: 支持 ✅'
  }

  const instance = createLottie({
    container,
    path: ANIMATION_URL,
    renderer: hasWebGL ? 'canvas' : 'canvas', // 暂时使用 canvas，因为 WebGL 渲染器需要额外实现
    loop: true,
    autoplay: true,
  })

  instance.on('ready', () => {
    container.querySelector('.loading')?.remove()
  })

  // 特效控制
  document.getElementById('webgl-effect')?.addEventListener('click', () => {
    instance.effects.addFilter('blur', { radius: 5 })
    instance.effects.addFilter('brightness', { value: 1.2 })
    info.textContent = 'WebGL: 特效已添加'
  })

  document.getElementById('webgl-particle')?.addEventListener('click', () => {
    instance.effects.addParticleSystem('stars', {
      count: 100,
      speed: { min: 1, max: 3 },
      size: { min: 2, max: 5 },
      color: ['#FFD700', '#FFA500', '#FF6347'],
      behavior: 'fall'
    })
    info.textContent = 'WebGL: 粒子效果已添加'
  })

  document.getElementById('webgl-clear')?.addEventListener('click', () => {
    instance.effects.clearFilters()
    instance.effects.clearParticles()
    info.textContent = 'WebGL: 特效已清除'
  })
}

// 创建交互式示例
function createInteractiveDemo() {
  const container = document.getElementById('interactive-lottie')!
  const info = document.getElementById('interactive-info')!

  const instance = createLottie({
    container,
    path: ANIMATION_URL,
    renderer: 'svg',
    loop: false,
    autoplay: false,
  })

  instance.on('ready', () => {
    container.querySelector('.loading')?.remove()
    updateInfo()
  })

  // 片段播放
  document.getElementById('interactive-segment')?.addEventListener('click', () => {
    const totalFrames = instance.animation?.totalFrames || 0
    const start = Math.floor(totalFrames * 0.25)
    const end = Math.floor(totalFrames * 0.75)
    instance.playSegments([start, end], true)
  })

  // 帧跳转
  document.getElementById('interactive-frame')?.addEventListener('click', () => {
    const frame = prompt('跳转到帧数:')
    if (frame) {
      instance.goToAndStop(parseInt(frame), true)
      updateInfo()
    }
  })

  // 悬停交互
  let isHovering = false
  document.getElementById('interactive-hover')?.addEventListener('click', () => {
    isHovering = !isHovering

    if (isHovering) {
      container.addEventListener('mouseenter', handleMouseEnter)
      container.addEventListener('mouseleave', handleMouseLeave)
      info.textContent = '悬停交互: 已启用'
    } else {
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
      info.textContent = '悬停交互: 已禁用'
    }
  })

  function handleMouseEnter() {
    instance.play()
  }

  function handleMouseLeave() {
    instance.pause()
  }

  function updateInfo() {
    const current = Math.round(instance.animation?.currentFrame || 0)
    const total = instance.animation?.totalFrames || 0
    info.textContent = `当前帧: ${current} / 总帧数: ${total}`
  }

  // 定期更新
  setInterval(updateInfo, 50)
}

// 创建导出示例
function createExportDemo() {
  const container = document.getElementById('export-lottie')!
  const info = document.getElementById('export-info')!

  const instance = createLottie({
    container,
    path: ANIMATION_URL,
    renderer: 'canvas', // 导出需要 canvas 渲染器
    loop: true,
    autoplay: true,
  })

  instance.on('ready', () => {
    container.querySelector('.loading')?.remove()

    // 添加水印
    pluginManager.register(WatermarkPlugin)
    pluginManager.loadPlugin(instance, 'watermark').then(() => {
      WatermarkPlugin.setConfig({
        text: 'Lottie Export Demo',
        position: 'bottom-right',
        opacity: 0.3,
        fontSize: 12
      })
    })
  })

  // 导出视频
  document.getElementById('export-video')?.addEventListener('click', async () => {
    info.textContent = '导出中...'
    try {
      const blob = await instance.export.exportVideo({
        format: 'webm',
        quality: 0.8,
        fps: 30,
        duration: 3000
      })
      downloadBlob(blob, 'animation.webm')
      info.textContent = '视频导出成功!'
    } catch (error) {
      info.textContent = `导出失败: ${error}`
    }
  })

  // 导出 GIF
  document.getElementById('export-gif')?.addEventListener('click', async () => {
    info.textContent = '导出中...'
    try {
      const blob = await instance.export.exportGIF({
        width: 400,
        height: 400,
        quality: 0.8,
        fps: 15
      })
      downloadBlob(blob, 'animation.gif')
      info.textContent = 'GIF导出成功!'
    } catch (error) {
      info.textContent = `导出失败: ${error}`
    }
  })

  // 导出 PNG 序列
  document.getElementById('export-png')?.addEventListener('click', async () => {
    info.textContent = '导出中...'
    try {
      const frames = await instance.export.exportPNGSequence({
        fps: 30,
        quality: 0.9
      })
      info.textContent = `导出 ${frames.length} 帧 PNG 图片成功!`
      // 下载第一帧作为示例
      if (frames.length > 0) {
        downloadBlob(frames[0], 'frame_0001.png')
      }
    } catch (error) {
      info.textContent = `导出失败: ${error}`
    }
  })
}

// 创建 AI 优化示例
function createAIDemo() {
  const container = document.getElementById('ai-lottie')!
  const info = document.getElementById('ai-info')!

  const instance = createLottie({
    container,
    path: ANIMATION_URL,
    renderer: 'svg',
    loop: true,
    autoplay: true,
  })

  instance.on('ready', () => {
    container.querySelector('.loading')?.remove()
  })

  const optimizer = AIOptimizer.getInstance()

  // 分析动画
  document.getElementById('ai-analyze')?.addEventListener('click', async () => {
    info.textContent = '分析中...'
    try {
      const result = await optimizer.analyzeAnimation(instance)
      const suggestionCount = result.suggestions.length
      info.textContent = `分析完成: 发现 ${suggestionCount} 个优化建议`
      console.log('优化建议:', result.suggestions)
    } catch (error) {
      info.textContent = `分析失败: ${error}`
    }
  })

  // 自动优化
  document.getElementById('ai-optimize')?.addEventListener('click', async () => {
    info.textContent = '优化中...'
    try {
      const config = optimizer.generateAdaptiveConfig()
      instance.updateConfig(config)
      info.textContent = '优化完成: 已应用最佳配置'
    } catch (error) {
      info.textContent = `优化失败: ${error}`
    }
  })

  // 性能报告
  document.getElementById('ai-report')?.addEventListener('click', () => {
    const report = optimizer.generateReport(instance)
    console.log(report)
    info.textContent = '性能报告已生成 (查看控制台)'
  })
}

// 辅助函数：下载 Blob
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// 初始化所有示例
async function init() {
  await initializeWASM()

  createBasicDemo()
  createCanvasDemo()
  createWebGLDemo()
  createInteractiveDemo()
  createExportDemo()
  createAIDemo()
}

// 启动
init()
