import { h } from 'preact';
import { useEffect, useRef, useImperativeHandle, forwardRef } from 'preact/compat';
import type { Ref } from 'preact/compat';
import { LottieManager, type LottieConfig } from '@ldesign/lottie-core';
import type { AnimationItem } from 'lottie-web';

export interface LottiePlayerProps extends Omit<LottieConfig, 'container'> {
  /**
   * Additional class name for the container
   */
  className?: string;
  
  /**
   * Inline styles for the container
   */
  style?: h.JSX.CSSProperties;
  
  /**
   * Animation direction
   */
  direction?: 1 | -1;
  
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
  onEnterFrame?: (event: any) => void;
  
  /**
   * Callback on animation data ready
   */
  onDataReady?: () => void;
  
  /**
   * Callback on animation data failed
   */
  onDataFailed?: () => void;
}

export interface LottiePlayerRef {
  /**
   * Get the animation instance
   */
  getAnimation: () => AnimationItem | null;
  
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

const LottiePlayer = forwardRef<LottiePlayerRef, LottiePlayerProps>((props, ref: Ref<LottiePlayerRef>) => {
  const {
    className,
    style,
    onLoad,
    onComplete,
    onLoopComplete,
    onEnterFrame,
    onDataReady,
    onDataFailed,
    ...lottieOptions
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const managerRef = useRef<LottieManager | null>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    getAnimation: () => animationRef.current,
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
      }
    },
  }));

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
    if (onLoad) animation.addEventListener('DOMLoaded', () => onLoad(animation));
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

  return <div ref={containerRef} className={className} style={style} />;
});

LottiePlayer.displayName = 'LottiePlayer';

export default LottiePlayer;
