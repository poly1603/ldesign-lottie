import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LottieManager } from './LottieManager';

describe('LottieManager', () => {
  let manager: LottieManager;
  let mockElement: HTMLDivElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    document.body.appendChild(mockElement);
    manager = LottieManager.getInstance();
    
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
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      },
    }));
  });

  afterEach(() => {
    manager.destroy();
    document.body.removeChild(mockElement);
    vi.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('returns the same instance', () => {
      const instance1 = LottieManager.getInstance();
      const instance2 = LottieManager.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('Instance Creation', () => {
    it('creates animation with path', () => {
      const config = {
        container: mockElement,
        path: '/animation.json',
        autoplay: true,
        loop: true,
      };
      
      const id = manager.create(config);
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('creates animation with animationData', () => {
      const animationData = { v: '5.5.7', fr: 30, ip: 0, op: 60, w: 500, h: 500, layers: [] };
      const config = {
        container: mockElement,
        animationData,
        autoplay: false,
      };
      
      const id = manager.create(config);
      expect(id).toBeTruthy();
    });

    it('generates unique IDs for each animation', () => {
      const config1 = { container: document.createElement('div'), path: '/anim1.json' };
      const config2 = { container: document.createElement('div'), path: '/anim2.json' };
      
      const id1 = manager.create(config1);
      const id2 = manager.create(config2);
      
      expect(id1).not.toBe(id2);
    });
  });

  describe('Animation Controls', () => {
    let animationId: string;

    beforeEach(() => {
      animationId = manager.create({
        container: mockElement,
        path: '/test.json',
      });
    });

    it('plays animation', () => {
      expect(() => manager.play(animationId)).not.toThrow();
    });

    it('pauses animation', () => {
      expect(() => manager.pause(animationId)).not.toThrow();
    });

    it('stops animation', () => {
      expect(() => manager.stop(animationId)).not.toThrow();
    });

    it('destroys animation', () => {
      expect(() => manager.destroyAnimation(animationId)).not.toThrow();
    });
  });

  describe('Batch Controls', () => {
    it('pauses all animations', () => {
      const id1 = manager.create({ container: document.createElement('div'), path: '/anim1.json' });
      const id2 = manager.create({ container: document.createElement('div'), path: '/anim2.json' });
      
      expect(() => manager.pauseAll()).not.toThrow();
    });

    it('resumes all animations', () => {
      const id1 = manager.create({ container: document.createElement('div'), path: '/anim1.json' });
      const id2 = manager.create({ container: document.createElement('div'), path: '/anim2.json' });
      
      expect(() => manager.resumeAll()).not.toThrow();
    });
  });

  describe('Property Updates', () => {
    let animationId: string;

    beforeEach(() => {
      animationId = manager.create({
        container: mockElement,
        path: '/test.json',
      });
    });

    it('sets speed', () => {
      expect(() => manager.setSpeed(animationId, 2)).not.toThrow();
    });

    it('sets direction', () => {
      expect(() => manager.setDirection(animationId, -1)).not.toThrow();
    });

    it('goes to frame and stops', () => {
      expect(() => manager.goToAndStop(animationId, 30)).not.toThrow();
    });

    it('goes to frame and plays', () => {
      expect(() => manager.goToAndPlay(animationId, 15)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('handles invalid animation ID gracefully', () => {
      expect(() => manager.play('invalid-id')).not.toThrow();
      expect(() => manager.pause('invalid-id')).not.toThrow();
      expect(() => manager.stop('invalid-id')).not.toThrow();
    });

    it('handles destroy of non-existent animation', () => {
      expect(() => manager.destroyAnimation('non-existent')).not.toThrow();
    });
  });

  describe('Cleanup', () => {
    it('destroys all animations on manager destroy', () => {
      manager.create({ container: document.createElement('div'), path: '/anim1.json' });
      manager.create({ container: document.createElement('div'), path: '/anim2.json' });
      
      expect(() => manager.destroy()).not.toThrow();
    });
  });
});
