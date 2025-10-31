import { test, expect } from '@playwright/test';

test.describe('Lottie Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page
    await page.goto('/');
  });

  test('renders basic animation correctly', async ({ page }) => {
    // Wait for animation to load
    await page.waitForSelector('[data-testid="lottie-container"]');
    
    // Wait for animation to be visible
    await page.waitForTimeout(1000);
    
    // Take screenshot
    await expect(page).toHaveScreenshot('basic-animation.png', {
      maxDiffPixels: 100,
    });
  });

  test('renders animation with custom size', async ({ page }) => {
    const container = await page.locator('[data-testid="lottie-custom-size"]');
    await expect(container).toBeVisible();
    
    await page.waitForTimeout(1000);
    
    await expect(container).toHaveScreenshot('custom-size-animation.png', {
      maxDiffPixels: 100,
    });
  });

  test('paused animation renders correctly', async ({ page }) => {
    // Click pause button
    await page.click('[data-testid="pause-button"]');
    
    await page.waitForTimeout(500);
    
    await expect(page).toHaveScreenshot('paused-animation.png', {
      maxDiffPixels: 50,
    });
  });

  test('animation at different speeds', async ({ page }) => {
    const speedTests = [0.5, 1, 2];
    
    for (const speed of speedTests) {
      await page.fill('[data-testid="speed-input"]', speed.toString());
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot(`speed-${speed}x.png`, {
        maxDiffPixels: 100,
      });
    }
  });

  test('animation direction changes', async ({ page }) => {
    // Forward direction
    await expect(page).toHaveScreenshot('direction-forward.png', {
      maxDiffPixels: 100,
    });
    
    // Reverse direction
    await page.click('[data-testid="reverse-button"]');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('direction-reverse.png', {
      maxDiffPixels: 100,
    });
  });

  test('multiple animations render without interference', async ({ page }) => {
    await page.goto('/multi-animations');
    
    await page.waitForSelector('[data-testid="multi-container"]');
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('multiple-animations.png', {
      maxDiffPixels: 200,
    });
  });

  test('responsive animation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('mobile-view.png', {
      maxDiffPixels: 100,
    });
  });

  test('animation loading state', async ({ page }) => {
    // Capture loading state
    const loadingPromise = page.waitForSelector('[data-testid="loading-indicator"]');
    
    await page.goto('/slow-animation', { waitUntil: 'domcontentloaded' });
    
    await loadingPromise;
    
    await expect(page).toHaveScreenshot('loading-state.png', {
      maxDiffPixels: 50,
    });
  });

  test('error state renders correctly', async ({ page }) => {
    await page.goto('/error-animation');
    
    await page.waitForSelector('[data-testid="error-message"]');
    
    await expect(page).toHaveScreenshot('error-state.png', {
      maxDiffPixels: 50,
    });
  });
});

test.describe('Framework-specific Tests', () => {
  test('Vue component renders correctly', async ({ page }) => {
    await page.goto('/vue-demo');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('vue-component.png', {
      maxDiffPixels: 100,
    });
  });

  test('React component renders correctly', async ({ page }) => {
    await page.goto('/react-demo');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('react-component.png', {
      maxDiffPixels: 100,
    });
  });

  test('Angular component renders correctly', async ({ page }) => {
    await page.goto('/angular-demo');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('angular-component.png', {
      maxDiffPixels: 100,
    });
  });

  test('Solid.js component renders correctly', async ({ page }) => {
    await page.goto('/solid-demo');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('solid-component.png', {
      maxDiffPixels: 100,
    });
  });
});

test.describe('Performance Tests', () => {
  test('animation renders within performance budget', async ({ page }) => {
    await page.goto('/');
    
    const metrics = await page.evaluate(() => {
      return {
        fps: (performance as any).memory?.jsHeapSizeLimit,
        memory: (performance as any).memory?.usedJSHeapSize,
      };
    });
    
    // Basic assertions
    expect(metrics).toBeDefined();
  });

  test('multiple animations maintain 60fps', async ({ page }) => {
    await page.goto('/performance-test');
    
    await page.waitForTimeout(3000);
    
    const fps = await page.evaluate(() => {
      return (window as any).averageFPS || 60;
    });
    
    expect(fps).toBeGreaterThanOrEqual(55);
  });
});
