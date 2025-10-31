import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/svelte';
import Lottie from './Lottie.svelte';

describe('Lottie Svelte Component', () => {
  beforeEach(() => {
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
    cleanup();
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    const { container } = render(Lottie, {
      props: {
        path: '/test.json',
      },
    });
    expect(container).toBeTruthy();
  });

  it('applies custom class', () => {
    const { container } = render(Lottie, {
      props: {
        path: '/test.json',
        class: 'custom-class',
      },
    });
    const element = container.querySelector('.custom-class');
    expect(element).toBeTruthy();
  });

  it('accepts style prop', () => {
    const { container } = render(Lottie, {
      props: {
        path: '/test.json',
        style: 'width: 500px; height: 500px;',
      },
    });
    expect(container.firstChild).toBeTruthy();
  });

  it('handles autoplay prop', () => {
    const { component } = render(Lottie, {
      props: {
        path: '/test.json',
        autoplay: false,
      },
    });
    expect(component).toBeTruthy();
  });

  it('handles loop prop', () => {
    const { component } = render(Lottie, {
      props: {
        path: '/test.json',
        loop: false,
      },
    });
    expect(component).toBeTruthy();
  });

  it('handles speed prop', () => {
    const { component } = render(Lottie, {
      props: {
        path: '/test.json',
        speed: 2,
      },
    });
    expect(component).toBeTruthy();
  });

  it('handles direction prop', () => {
    const { component } = render(Lottie, {
      props: {
        path: '/test.json',
        direction: -1,
      },
    });
    expect(component).toBeTruthy();
  });
});
