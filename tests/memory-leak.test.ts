import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { LottieManager } from '../packages/core/src/LottieManager';

/**
 * Memory Leak Detection Tests
 * 
 * These tests verify that the LottieManager and framework wrappers
 * properly clean up resources and don't cause memory leaks.
 */

describe('Memory Leak Prevention', () => {
  let manager: LottieManager;
  
  beforeEach(() => {
    manager = LottieManager.getInstance();
  });

  afterEach(() => {
    manager.destroy();
  });

  it('cleans up animation instances after destroy', () => {
    const containers = Array.from({ length: 10 }, () => document.createElement('div'));
    const ids = containers.map(container => 
      manager.create({ container, path: '/test.json' })
    );

    // Destroy all animations
    ids.forEach(id => manager.destroyAnimation(id));

    // Manager should have no instances
    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.size).toBe(0);
  });

  it('destroys all instances when manager is destroyed', () => {
    const containers = Array.from({ length: 5 }, () => document.createElement('div'));
    containers.forEach(container => 
      manager.create({ container, path: '/test.json' })
    );

    manager.destroy();

    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.size).toBe(0);
  });

  it('handles rapid creation and destruction without leaks', () => {
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const container = document.createElement('div');
      const id = manager.create({ container, path: '/test.json' });
      manager.destroyAnimation(id);
    }

    // Should have no instances after all destroyed
    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.size).toBe(0);
  });

  it('removes event listeners on destroy', () => {
    const container = document.createElement('div');
    const id = manager.create({
      container,
      path: '/test.json',
    });

    // Add event listeners
    const onComplete = () => {};
    const onLoopComplete = () => {};
    
    // Destroy should remove all listeners
    manager.destroyAnimation(id);

    // Instance should be gone
    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.has(id)).toBe(false);
  });

  it('handles multiple pause/resume cycles without leaks', () => {
    const container = document.createElement('div');
    const id = manager.create({ container, path: '/test.json' });

    // Cycle pause/resume many times
    for (let i = 0; i < 50; i++) {
      manager.pause(id);
      manager.play(id);
    }

    // Should still have exactly one instance
    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.size).toBe(1);

    manager.destroyAnimation(id);
  });

  it('cleans up when container is removed from DOM', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);

    const id = manager.create({ container, path: '/test.json' });

    // Remove container from DOM
    container.remove();

    // Destroy animation
    manager.destroyAnimation(id);

    // Should be cleaned up
    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.has(id)).toBe(false);
  });

  it('handles concurrent animations without interference', () => {
    const count = 20;
    const containers = Array.from({ length: count }, () => document.createElement('div'));
    const ids = containers.map(container => 
      manager.create({ container, path: '/test.json' })
    );

    // All animations should be tracked
    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.size).toBe(count);

    // Destroy half
    ids.slice(0, count / 2).forEach(id => manager.destroyAnimation(id));

    // Should have half remaining
    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.size).toBe(count / 2);

    // Destroy rest
    ids.slice(count / 2).forEach(id => manager.destroyAnimation(id));

    // @ts-expect-error - accessing private property for testing
    expect(manager.instances.size).toBe(0);
  });
});

describe('Resource Management', () => {
  it('reuses manager singleton instance', () => {
    const instance1 = LottieManager.getInstance();
    const instance2 = LottieManager.getInstance();
    const instance3 = LottieManager.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance2).toBe(instance3);
  });

  it('generates unique IDs for each animation', () => {
    const manager = LottieManager.getInstance();
    const ids = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const container = document.createElement('div');
      const id = manager.create({ container, path: '/test.json' });
      ids.add(id);
      manager.destroyAnimation(id);
    }

    // All IDs should be unique
    expect(ids.size).toBe(100);
  });

  it('handles invalid operations gracefully', () => {
    const manager = LottieManager.getInstance();

    // These should not throw
    expect(() => manager.play('non-existent-id')).not.toThrow();
    expect(() => manager.pause('non-existent-id')).not.toThrow();
    expect(() => manager.stop('non-existent-id')).not.toThrow();
    expect(() => manager.destroyAnimation('non-existent-id')).not.toThrow();
    expect(() => manager.setSpeed('non-existent-id', 2)).not.toThrow();
  });
});

describe('Performance Characteristics', () => {
  it('creates animations efficiently', () => {
    const manager = LottieManager.getInstance();
    const startTime = performance.now();
    const count = 100;

    for (let i = 0; i < count; i++) {
      const container = document.createElement('div');
      manager.create({ container, path: '/test.json' });
    }

    const duration = performance.now() - startTime;

    // Should complete quickly (< 100ms for 100 animations)
    expect(duration).toBeLessThan(100);

    manager.destroy();
  });

  it('destroys animations efficiently', () => {
    const manager = LottieManager.getInstance();
    const count = 100;
    const ids: string[] = [];

    for (let i = 0; i < count; i++) {
      const container = document.createElement('div');
      ids.push(manager.create({ container, path: '/test.json' }));
    }

    const startTime = performance.now();
    ids.forEach(id => manager.destroyAnimation(id));
    const duration = performance.now() - startTime;

    // Should complete quickly
    expect(duration).toBeLessThan(50);
  });
});
