/**
 * ScrollyMotion - Advanced Scroll Animation Library
 */

// Import and export main class
import { ScrollyMotion } from "./core/ScrollyMotion.js";
export { ScrollyMotion };

// Export types for TypeScript users
export type {
  ScrollAnimatorConfig,
  AnimationConfig,
  StaggerConfig,
  BreakpointAnimationConfig,
  TimelineStep,
  TimelinePreset,
  ScrollElement,
  DebouncedFunction,
  ScrollMasterMetrics,
} from "./types/index.js";

// Export individual modules for advanced usage
export { Parser } from "./core/Parser.js";
export { Animation } from "./core/Animation.js";
export { Physics } from "./core/Physics.js";

// Export utilities
export {
  debounce,
  parseClasses,
  parseSize,
  initializeMediaQueries,
} from "./utils/helpers.js";

export {
  DEFAULT_CONFIG,
  DEFAULT_ELEMENT_CONFIG,
  PHYSICS_CONFIG,
  BREAKPOINT_ORDER,
} from "./utils/constants.js";

// Create a default instance (null - to be created manually)
export const scrollyMotion = null;

// Make ScrollMaster class available globally for debugging
if (typeof window !== "undefined") {
  (window as any).ScrollyMotion = ScrollyMotion;

  // Check browser compatibility
  const isCompatible =
    "IntersectionObserver" in window &&
    "requestAnimationFrame" in window &&
    "Map" in window &&
    "Set" in window;

  if (isCompatible) {
    console.log("🚀 ScrollyMotion: Library loaded and ready!");
    console.log("✅ ScrollyMotion: Browser compatible");
  } else {
    console.warn("❌ ScrollyMotion: Browser not compatible");
  }
}

// Default export
export default ScrollyMotion;
