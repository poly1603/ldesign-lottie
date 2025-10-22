/**
 * 测试环境设置
 */

import { vi } from 'vitest'

// Mock lottie-web
vi.mock('lottie-web', () => ({
  default: {
    loadAnimation: vi.fn(() => ({
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
      setSpeed: vi.fn(),
      setDirection: vi.fn(),
      goToAndStop: vi.fn(),
      goToAndPlay: vi.fn(),
      playSegments: vi.fn(),
      resize: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getDuration: vi.fn(() => 2),
      totalFrames: 60,
      currentFrame: 0,
      frameRate: 30
    }))
  }
}))

// Mock performance.memory（在某些浏览器中不可用）
if (!('memory' in performance)) {
  Object.defineProperty(performance, 'memory', {
    value: {
      usedJSHeapSize: 50000000,
      totalJSHeapSize: 100000000,
      jsHeapSizeLimit: 200000000
    },
    configurable: true
  })
}

// Mock requestIdleCallback（在某些浏览器中不可用）
if (typeof requestIdleCallback === 'undefined') {
  global.requestIdleCallback = (callback: IdleRequestCallback) => {
    return setTimeout(() => callback({
      didTimeout: false,
      timeRemaining: () => 50
    } as IdleDeadline), 0)
  }

  global.cancelIdleCallback = (id: number) => {
    clearTimeout(id)
  }
}

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(public callback: IntersectionObserverCallback) { }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
} as any

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor(public callback: ResizeObserverCallback) { }
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
} as any

