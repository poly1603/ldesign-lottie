import '@ldesign/lottie-lit'

// 初始化示例
document.addEventListener('DOMContentLoaded', () => {
  // 基础示例事件监听
  const basicLottie = document.getElementById('basic-lottie')
  basicLottie?.addEventListener('ready', () => {
    const info = document.getElementById('basic-info')
    if (info) {
      info.textContent = '动画已加载 ✅'
    }
  })

  basicLottie?.addEventListener('error', (e: any) => {
    const info = document.getElementById('basic-info')
    if (info) {
      info.textContent = `加载失败: ${e.detail.error.message}`
    }
  })

  // 交互式示例
  const interactiveLottie = document.getElementById('interactive-lottie')
  const interactiveInfo = document.getElementById('interactive-info')
  
  interactiveLottie?.addEventListener('mouseenter', () => {
    (interactiveLottie as any).play()
    if (interactiveInfo) {
      interactiveInfo.textContent = '播放中...'
    }
  })

  interactiveLottie?.addEventListener('mouseleave', () => {
    (interactiveLottie as any).pause()
    if (interactiveInfo) {
      interactiveInfo.textContent = '悬停播放'
    }
  })

  console.log('✅ Lottie Lit Demo initialized')
})

