import { useEffect, useRef, useState } from 'preact/hooks';
import { LottieManager, type LottieConfig } from '@ldesign/lottie-core';
import type { AnimationItem } from 'lottie-web';

export interface UseLottieOptions extends LottieConfig {
  /**
   * Callback when animation is loaded
   */
  onLoad?: (animation: AnimationItem) => void;
  
  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
  
  /**
   * Callback when animation loops
   */
  onLoopComplete?: () => void;
  
  /**
   * Callback when animation segment starts
   */
  onEnterFrame?: () => void;
  
  /**
   * Callback on animation data ready
   */
  onDataReady?: () => void;
  
  /**
   * Callback on animation data failed
   */
  onDataFailed?: () => void;
}

export interface UseLottieReturn {
  /**
   * Ref to attach to the container element
   */
  containerRef: (node: HTMLElement | null) => void;
  
  /**
   * The animation instance
   */
  animation: AnimationItem | null;
  
  /**
   * Whether the animation is loaded
   */
  isLoaded: boolean;
  
  /**
   * Play the animation
   */
  play: () => void;
  
  /**
   * Pause the animation
   */
  pause: () => void;
  
  /**
   * Stop the animation
   */
  stop: () => void;
  
  /**
   * Set animation speed
   */
  setSpeed: (speed: number) => void;
  
  /**
   * Set animation direction
   */
  setDirection: (direction: 1 | -1) => void;
  
  /**
   * Go to a specific frame
   */
  goToAndStop: (frame: number, isFrame?: boolean) => void;
  
  /**
   * Go to a specific frame and play
   */
  goToAndPlay: (frame: number, isFrame?: boolean) => void;
  
  /**
   * Play specific segments
   */
  playSegments: (segments: [number, number] | [number, number][], forceFlag?: boolean) => void;
  
  /**
   * Destroy the animation instance
   */
  destroy: () => void;
}

export function useLottie(options: UseLottieOptions): UseLottieReturn {
  const {
    onLoad,
    onComplete,
    onLoopComplete,
    onEnterFrame,
    onDataReady,
    onDataFailed,
    ...lottieOptions
  } = options;

  const containerRef = useRef<HTMLElement | null>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const managerRef = useRef<LottieManager | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize manager
    managerRef.current = LottieManager.getInstance();

    // Create animation
    const animation = managerRef.current.createAnimation({
      ...lottieOptions,
      container: containerRef.current,
    });

    animationRef.current = animation;

    // Setup event listeners
    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.(animation);
    };

    animation.addEventListener('DOMLoaded', handleLoad);
    if (onComplete) animation.addEventListener('complete', onComplete);
    if (onLoopComplete) animation.addEventListener('loopComplete', onLoopComplete);
    if (onEnterFrame) animation.addEventListener('enterFrame', onEnterFrame);
    if (onDataReady) animation.addEventListener('data_ready', onDataReady);
    if (onDataFailed) animation.addEventListener('data_failed', onDataFailed);

    // Cleanup
    return () => {
      if (animationRef.current) {
        managerRef.current?.destroyAnimation(animationRef.current);
        animationRef.current = null;
        setIsLoaded(false);
      }
    };
  }, [lottieOptions.path, lottieOptions.animationData]);

  // Update animation properties
  useEffect(() => {
    if (!animationRef.current) return;

    if (lottieOptions.loop !== undefined) {
      animationRef.current.loop = lottieOptions.loop;
    }
    if (lottieOptions.autoplay !== undefined) {
      if (lottieOptions.autoplay) {
        animationRef.current.play();
      } else {
        animationRef.current.pause();
      }
    }
  }, [lottieOptions.loop, lottieOptions.autoplay]);

  return {
    containerRef: (node: HTMLElement | null) => {
      containerRef.current = node;
    },
    animation: animationRef.current,
    isLoaded,
    play: () => animationRef.current?.play(),
    pause: () => animationRef.current?.pause(),
    stop: () => animationRef.current?.stop(),
    setSpeed: (speed: number) => animationRef.current?.setSpeed(speed),
    setDirection: (direction: 1 | -1) => animationRef.current?.setDirection(direction),
    goToAndStop: (frame: number, isFrame?: boolean) => animationRef.current?.goToAndStop(frame, isFrame),
    goToAndPlay: (frame: number, isFrame?: boolean) => animationRef.current?.goToAndPlay(frame, isFrame),
    playSegments: (segments: [number, number] | [number, number][], forceFlag?: boolean) =>
      animationRef.current?.playSegments(segments, forceFlag),
    destroy: () => {
      if (animationRef.current) {
        managerRef.current?.destroyAnimation(animationRef.current);
        animationRef.current = null;
        setIsLoaded(false);
      }
    },
  };
}
