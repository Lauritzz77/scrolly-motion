/**
 * ScrollyMotion Modules
 * Export all available modules and their factory functions
 */

// Module interfaces
export type { ScrollyMotionModule, ScrollyMotionCore } from "./ModuleInterface";

// Individual modules
export { TimelineModule, timeline } from "./TimelineModule";
export { StaggerModule, stagger } from "./StaggerModule";
export { ThemeModule, themes } from "./ThemeModule";
export { WebComponentsModule, webcomponents } from "./WebComponentsModule";

// Import factory functions for internal use
import { timeline } from "./TimelineModule";
import { stagger } from "./StaggerModule";
import { themes } from "./ThemeModule";
import { webcomponents } from "./WebComponentsModule";

// Module registry for easy access
export const moduleRegistry = {
  timeline: timeline,
  stagger: stagger,
  themes: themes,
  webcomponents: webcomponents,
};

// Default modules that are always included
export const defaultModules = [timeline];

// All available modules
export const allModules = [timeline, stagger, themes, webcomponents];
