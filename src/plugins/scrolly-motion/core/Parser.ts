/**
 * ScrollyMotion Parser
 * Handles parsing of animations, breakpoints, timelines, and stagger configurations
 */

import type {
  AnimationConfig,
  StaggerConfig,
  MultiBreakpointStaggerConfig,
  TimelineStep,
} from "../types/index.js";
import { AnimationParser } from "./parsers/AnimationParser.js";
import { StaggerParser } from "./parsers/StaggerParser.js";
import type { PluginManager } from "./PluginManager.js";

export class Parser {
  private animationParser: AnimationParser;
  private staggerParser: StaggerParser;

  constructor(
    timelinePresets: Map<string, TimelineStep[]>,
    mediaQueries: Map<string, MediaQueryList>,
    pluginManager: PluginManager
  ) {
    this.animationParser = new AnimationParser(
      timelinePresets,
      mediaQueries,
      pluginManager
    );
    this.staggerParser = new StaggerParser(pluginManager);
  }

  parseAnimation(animationStr: string): AnimationConfig | null {
    try {
      return this.animationParser.parse(animationStr);
    } catch (e) {
      console.error("Failed to parse animation:", e);
      return null;
    }
  }

  parseStaggerAnimation(
    animationStr: string,
    breakpoint: string = "default"
  ): StaggerConfig | null {
    try {
      return this.staggerParser.parse(animationStr);
    } catch (e) {
      console.error("Failed to parse stagger animation:", e);
      return null;
    }
  }

  parseMultiBreakpointStagger(
    animationStr: string
  ): MultiBreakpointStaggerConfig {
    try {
      return this.staggerParser.parseMultiBreakpoint(animationStr);
    } catch (e) {
      console.error("Failed to parse multi-breakpoint stagger animation:", e);
      return {};
    }
  }
}
