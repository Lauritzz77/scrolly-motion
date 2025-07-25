/**
 * ScrollyMotion - Advanced Scroll Animation Library
 */

// Import and export main classes
import { ScrollyMotion } from "./core/ModularScrollyMotionCore.js";
import { ModularScrollyMotion } from "./core/ModularScrollyMotion.js";
export { ScrollyMotion, ModularScrollyMotion };

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
} from "./types/index.js";

// Export modules for modular usage
export {
  timeline,
  stagger,
  themes,
  webcomponents,
  moduleRegistry,
  defaultModules,
  allModules,
} from "./modules/index.js";

// Export module types
export type {
  ScrollyMotionModule,
  ScrollyMotionCore,
} from "./modules/index.js";

// Export individual core classes for advanced usage
export { Parser } from "./core/Parser.js";
export { Animation } from "./core/Animation.js";

// Export utilities
export {
  debounce,
  parseClasses,
  parseSize,
  initializeMediaQueries,
} from "./utils/helpers.js";

export { DEFAULT_CONFIG } from "./utils/constants.js";

// Export warning system
export { warningSystem, WarningSystem } from "./utils/warnings.js";
export type { ModuleWarning } from "./utils/warnings.js";

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
