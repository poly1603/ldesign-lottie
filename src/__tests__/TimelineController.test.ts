/**
 * TimelineController 单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TimelineController } from '../core/TimelineController'
import type { ILottieInstance } from '../types'

describe('TimelineController', () => {
  let mockInstance: ILottieInstance
  let timeline: TimelineController

  beforeEach(() => {
    mockInstance = {
      id: 'test',
      name: 'test',
      state: 'loaded',
      animation: null,
      config: {},
      container: null,
      load: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      stop: vi.fn(),
      destroy: vi.fn(),
      setSpeed: vi.fn(),
      setDirection: vi.fn(),
      goToAndStop: vi.fn(),
      goToAndPlay: vi.fn(),
      playSegments: vi.fn(),
      reset: vi.fn(),
      resize: vi.fn(),
      getMetrics: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    } as any

    timeline = new TimelineController(mockInstance, {
      duration: 5,
      fps: 60
    })
  })

  afterEach(() => {
    timeline.destroy()
  })

  describe('轨道管理', () => {
    it('应该能够添加轨道', () => {
      const trackId = timeline.addTrack('opacity')
      expect(trackId).toBeTruthy()

      const track = timeline.getTrack(trackId)
      expect(track).toBeDefined()
      expect(track?.name).toBe('opacity')
    })

    it('应该能够移除轨道', () => {
      const trackId = timeline.addTrack('position')
      const removed = timeline.removeTrack(trackId)

      expect(removed).toBe(true)
      expect(timeline.getTrack(trackId)).toBeUndefined()
    })

    it('应该能够获取所有轨道', () => {
      timeline.addTrack('track1')
      timeline.addTrack('track2')

      const tracks = timeline.getAllTracks()
      expect(tracks.length).toBe(2)
    })
  })

  describe('关键帧管理', () => {
    it('应该能够添加关键帧', () => {
      const trackId = timeline.addTrack('opacity')
      const keyframeId = timeline.addKeyframe(trackId, {
        time: 0,
        value: 0
      })

      expect(keyframeId).toBeTruthy()

      const track = timeline.getTrack(trackId)
      expect(track?.keyframes.length).toBe(1)
    })

    it('关键帧应该按时间排序', () => {
      const trackId = timeline.addTrack('opacity')

      timeline.addKeyframe(trackId, { time: 2, value: 0.5 })
      timeline.addKeyframe(trackId, { time: 0, value: 0 })
      timeline.addKeyframe(trackId, { time: 1, value: 1 })

      const track = timeline.getTrack(trackId)
      expect(track?.keyframes[0].time).toBe(0)
      expect(track?.keyframes[1].time).toBe(1)
      expect(track?.keyframes[2].time).toBe(2)
    })

    it('应该能够移除关键帧', () => {
      const trackId = timeline.addTrack('opacity')
      const keyframeId = timeline.addKeyframe(trackId, { time: 0, value: 0 })

      const removed = timeline.removeKeyframe(trackId, keyframeId)
      expect(removed).toBe(true)

      const track = timeline.getTrack(trackId)
      expect(track?.keyframes.length).toBe(0)
    })

    it('应该能够更新关键帧', () => {
      const trackId = timeline.addTrack('opacity')
      const keyframeId = timeline.addKeyframe(trackId, { time: 0, value: 0 })

      const updated = timeline.updateKeyframe(trackId, keyframeId, { value: 1 })
      expect(updated).toBe(true)

      const track = timeline.getTrack(trackId)
      expect(track?.keyframes[0].value).toBe(1)
    })
  })

  describe('插值计算', () => {
    it('应该正确插值数字', () => {
      const trackId = timeline.addTrack('opacity')
      timeline.addKeyframe(trackId, { time: 0, value: 0 })
      timeline.addKeyframe(trackId, { time: 2, value: 100 })

      const value = timeline.getValueAtTime(trackId, 1)
      expect(value).toBe(50)
    })

    it('应该支持缓动函数', () => {
      const trackId = timeline.addTrack('position')
      timeline.addKeyframe(trackId, { time: 0, value: 0, easing: 'linear' })
      timeline.addKeyframe(trackId, { time: 2, value: 100 })

      const value = timeline.getValueAtTime(trackId, 1)
      expect(value).toBe(50)
    })
  })

  describe('播放控制', () => {
    it('应该能够播放', () => {
      const playSpy = vi.fn()
      timeline.on('play', playSpy)

      timeline.play()
      expect(playSpy).toHaveBeenCalled()
    })

    it('应该能够暂停', () => {
      const pauseSpy = vi.fn()
      timeline.on('pause', pauseSpy)

      timeline.play()
      timeline.pause()

      expect(pauseSpy).toHaveBeenCalled()
    })

    it('应该能够跳转', () => {
      const seekSpy = vi.fn()
      timeline.on('seek', seekSpy)

      timeline.seekTo(2.5)
      expect(timeline.getCurrentTime()).toBe(2.5)
      expect(seekSpy).toHaveBeenCalled()
    })
  })

  describe('标记点', () => {
    it('应该能够添加标记点', () => {
      const markerSpy = vi.fn()
      timeline.on('markerAdded', markerSpy)

      timeline.addMarker('highlight', 2.5)
      expect(markerSpy).toHaveBeenCalled()
    })

    it('应该能够跳转到标记点', () => {
      timeline.addMarker('start', 1.0)
      timeline.addMarker('end', 4.0)

      const result = timeline.seekToMarker('start')
      expect(result).toBe(true)
      expect(timeline.getCurrentTime()).toBe(1.0)
    })
  })

  describe('导入导出', () => {
    it('应该能够导出时间线数据', () => {
      const trackId = timeline.addTrack('opacity')
      timeline.addKeyframe(trackId, { time: 0, value: 0 })
      timeline.addMarker('test', 1.0)

      const exported = timeline.export()

      expect(exported.config).toBeDefined()
      expect(exported.tracks.length).toBe(1)
      expect(exported.markers).toHaveProperty('test')
    })

    it('应该能够导入时间线数据', () => {
      const data = {
        config: { duration: 10, fps: 30, loop: true, autoplay: false },
        tracks: [
          {
            id: 'track1',
            name: 'opacity',
            keyframes: [],
            enabled: true,
            locked: false
          }
        ],
        markers: { test: 2.5 }
      }

      timeline.import(data)

      const tracks = timeline.getAllTracks()
      expect(tracks.length).toBe(1)
    })
  })
})

