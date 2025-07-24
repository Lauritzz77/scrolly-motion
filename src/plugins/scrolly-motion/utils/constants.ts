/**
 * ScrollyMotion Constants
 * Default configurations and constants
 */

export const DEFAULT_CONFIG = {
  selector: "[data-scroll], [data-animation]",
  defaultEnter: "50vh",
  breakpoints: {
    default: "(min-width: 1px)",
    mobile: "(max-width: 767px)",
    tablet: "(min-width: 768px) and (max-width: 1023px)",
    desktop: "(min-width: 1024px)",
  },
  presets: {},
} as const;

export const DEFAULT_ELEMENT_CONFIG = {
  enterClassNames: [] as string[],
  leaveClassNames: [] as string[],
};

export const DEFAULT_SCROLL_CONFIG = {
  enter: "10vh",
  exit: "40vh",
  once: false,
  damping: 0,
  friction: 0.95,
} as const;

export const PHYSICS_CONFIG = {
  maxDeltaTime: 16.67, // Cap at 60fps
  scrollStopDelay: 100, // ms to detect scroll stop
  minProgressDiff: 0.001,
  minVelocity: 0.001,
  attractionForce: 0.015,
  velocityScale: 0.8,
} as const;

export const BREAKPOINT_ORDER = [
  "large",
  "desktop",
  "tablet",
  "mobile",
  "default",
] as const;
