/**
 * ScrollyMotion Types
 * All TypeScript interfaces and type definitions
 */

export interface ScrollAnimatorConfig {
  selector?: string;
  breakpoints?: Record<string, string>;
  presets?: Record<string, TimelineStep[]>;
  defaultEnter?: string;
}

export interface AnimationConfig {
  from: Record<string, any>;
  to: Record<string, any>;
  timeline?: TimelineStep[];
  breakpoint?: string;
  transitionDuration?: number;
  transitionEasing?: string;
}

export interface StaggerConfig {
  selector: string;
  from: Record<string, any>;
  to: Record<string, any>;
  staggerDelay: number;
  timeline?: TimelineStep[];
  breakpoint?: string;
  transitionDuration?: number;
  transitionEasing?: string;
}

export interface MultiBreakpointStaggerConfig {
  [breakpoint: string]: StaggerConfig;
}

export interface BreakpointAnimationConfig {
  [breakpoint: string]: AnimationConfig;
}

export interface TimelineStep {
  at: number; // Progress point (0-1) when this step should happen
  properties: Record<string, any>;
  duration?: number;
}

export interface TimelinePreset {
  name: string;
  steps: TimelineStep[];
}

export interface ScrollElement extends HTMLElement {
  _enterAt: number;
  _distance: number;
  _exitAt: number;
  _once: boolean;
  _enterClassNames: string[];
  _leaveClassNames: string[];
  _theme: string | null;
  _wcElements: HTMLElement[];
  _lastProg: number | null;
  _animationConfig: AnimationConfig | null;
  _animeInstance: any | null;
  _damping: number;
  _targetProgress: number;
  _currentProgress: number;
  _friction: number;
  _velocity: number;
  _lastTargetProgress: number;
  _isScrolling: boolean;
  _staggerConfig: StaggerConfig | null;
  _multiStaggerConfig: MultiBreakpointStaggerConfig | null;
  _staggerChildren: HTMLElement[];
  _hasEnteredOnce: boolean;
  _hasStartedAnimating: boolean;
}

export type DebouncedFunction<T extends (...args: any[]) => void> = (
  ...args: Parameters<T>
) => void;

export interface ScrollyMotionMetrics {
  fps: number;
  activeElements: number;
  memoryUsage: number;
  gpuAccelerated: boolean;
}
