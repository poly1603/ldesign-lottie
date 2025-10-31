import { describe, it, expect, vi } from 'vitest';
import { createDOM } from '@builder.io/qwik/testing';
import { Lottie } from './lottie';

describe('Lottie Qwik Component', () => {
  it('renders with basic props', async () => {
    const { screen, render } = await createDOM();
    
    await render(
      <Lottie 
        path="https://example.com/animation.json"
        autoplay
        loop
      />
    );
    
    const container = screen.querySelector('[data-lottie-container]');
    expect(container).toBeTruthy();
  });

  it('applies custom class', async () => {
    const { screen, render } = await createDOM();
    
    await render(
      <Lottie 
        path="https://example.com/animation.json"
        class="custom-lottie"
      />
    );
    
    const element = screen.querySelector('.custom-lottie');
    expect(element).toBeTruthy();
  });

  it('accepts style prop', async () => {
    const { screen, render } = await createDOM();
    
    await render(
      <Lottie 
        path="https://example.com/animation.json"
        style={{ width: '400px', height: '400px' }}
      />
    );
    
    expect(screen.querySelector('[data-lottie-container]')).toBeTruthy();
  });

  it('handles autoplay false', async () => {
    const { screen, render } = await createDOM();
    
    await render(
      <Lottie 
        path="https://example.com/animation.json"
        autoplay={false}
      />
    );
    
    expect(screen.querySelector('[data-lottie-container]')).toBeTruthy();
  });

  it('handles loop prop', async () => {
    const { screen, render } = await createDOM();
    
    await render(
      <Lottie 
        path="https://example.com/animation.json"
        loop={false}
      />
    );
    
    expect(screen.querySelector('[data-lottie-container]')).toBeTruthy();
  });

  it('handles speed prop', async () => {
    const { screen, render } = await createDOM();
    
    await render(
      <Lottie 
        path="https://example.com/animation.json"
        speed={2}
      />
    );
    
    expect(screen.querySelector('[data-lottie-container]')).toBeTruthy();
  });

  it('handles direction prop', async () => {
    const { screen, render } = await createDOM();
    
    await render(
      <Lottie 
        path="https://example.com/animation.json"
        direction={-1}
      />
    );
    
    expect(screen.querySelector('[data-lottie-container]')).toBeTruthy();
  });
});
