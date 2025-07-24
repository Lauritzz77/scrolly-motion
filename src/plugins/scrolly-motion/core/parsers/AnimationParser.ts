/**
 * ScrollyMotion Animation Parser
 * Handles parsing of standard animations and breakpoints.
 */

import type {
  AnimationConfig,
  BreakpointAnimationConfig,
  TimelineStep,
} from "../../types/index.js";
import { BREAKPOINT_ORDER } from "../../utils/constants.js";
import { TimelineParser } from "./TimelineParser";
import { ValueParser } from "./ValueParser";

export class AnimationParser {
  private timelinePresets: Map<string, TimelineStep[]>;
  private mediaQueries: Map<string, MediaQueryList>;
  private timelineParser: TimelineParser;
  private valueParser: ValueParser;

  constructor(
    timelinePresets: Map<string, TimelineStep[]>,
    mediaQueries: Map<string, MediaQueryList>
  ) {
    this.timelinePresets = timelinePresets;
    this.mediaQueries = mediaQueries;
    this.valueParser = new ValueParser();
    this.timelineParser = new TimelineParser(this.valueParser);
  }

  parse(animationStr: string): AnimationConfig | null {
    if (!animationStr) return null;

    const breakpointConfigs = this.parseBreakpoints(animationStr);
    const activeConfig = this.getActiveConfig(breakpointConfigs);

    if (!activeConfig) return null;

    const transitionDurationMatch = animationStr.match(
      /transition-duration-(\d+)/
    );
    if (transitionDurationMatch) {
      activeConfig.transitionDuration = parseInt(
        transitionDurationMatch[1],
        10
      );
    }

    const transitionEasingMatch = animationStr.match(
      /transition-easing-([a-zA-Z-]+)/
    );
    if (transitionEasingMatch) {
      activeConfig.transitionEasing = transitionEasingMatch[1];
    }

    return activeConfig;
  }

  private parseBreakpoints(animationStr: string): BreakpointAnimationConfig {
    const breakpointConfigs: BreakpointAnimationConfig = {};
    const parts = animationStr.trim().split(/(?=@)/);

    parts.forEach((part) => {
      const trimmedPart = part.trim();
      if (!trimmedPart) return;

      let breakpoint = "default";
      let configStr = trimmedPart;

      if (trimmedPart.startsWith("@")) {
        const colonIndex = trimmedPart.indexOf(":");
        if (colonIndex > -1) {
          breakpoint = trimmedPart.substring(1, colonIndex);
          configStr = trimmedPart.substring(colonIndex + 1);
        }
      }

      if (!breakpointConfigs[breakpoint]) {
        breakpointConfigs[breakpoint] = { from: {}, to: {}, breakpoint };
      }

      this.processConfig(breakpoint, configStr, breakpointConfigs);
    });

    return breakpointConfigs;
  }

  private processConfig(
    breakpoint: string,
    configStr: string,
    breakpointConfigs: BreakpointAnimationConfig
  ): void {
    if (!breakpointConfigs[breakpoint]) {
      breakpointConfigs[breakpoint] = {
        from: {},
        to: {},
        breakpoint,
      };
    }

    const isTimeline =
      configStr.includes(";") &&
      (configStr.includes("from:") ||
        configStr.includes("via-") ||
        configStr.includes("to:"));

    if (isTimeline) {
      breakpointConfigs[breakpoint].timeline =
        this.timelineParser.parse(configStr);
      return;
    }

    const parts = configStr.includes(";")
      ? configStr.split(";").map((p) => p.trim())
      : [configStr.trim()];

    parts.forEach((part) => {
      if (part) {
        this.parsePart(part, breakpointConfigs[breakpoint]);
      }
    });
  }

  private parsePart(part: string, config: AnimationConfig): void {
    const sections = part.split(/\s+(?=(?:from|to|timeline|preset):)/);

    sections.forEach((section) => {
      const trimmedSection = section.trim();

      if (trimmedSection.startsWith("from:")) {
        const fromStr = trimmedSection.substring(5);
        this.parseProps(fromStr, config.from);
      } else if (trimmedSection.startsWith("to:")) {
        const toStr = trimmedSection.substring(3);
        this.parseProps(toStr, config.to);
      } else if (trimmedSection.startsWith("timeline:")) {
        const timelineStr = trimmedSection.substring(9);
        config.timeline = this.timelineParser.parse(timelineStr);
      } else if (trimmedSection.startsWith("preset:")) {
        const presetName = trimmedSection.substring(7).trim();
        const presetSteps = this.timelinePresets.get(presetName);
        if (presetSteps) {
          config.timeline = presetSteps;
        } else {
          console.warn(`Unknown preset: ${presetName}`);
        }
      }
    });
  }

  private parseProps(propsStr: string, target: Record<string, any>): void {
    const props = propsStr.split("|");
    props.forEach((prop) => {
      if (prop.startsWith("letter-spacing")) {
        const value = prop.substring(15);
        target["letter-spacing"] = this.valueParser.parse(
          "letter-spacing",
          value
        );
        return;
      }
      const dashIndex = prop.indexOf("-");
      if (dashIndex > 0) {
        const key = prop.substring(0, dashIndex);
        let value = prop.substring(dashIndex + 1);
        if (value.startsWith("-")) {
          value = value;
        }
        if (key && value !== undefined) {
          target[key] = this.valueParser.parse(key, value);
        }
      }
    });
  }

  private getActiveConfig(
    breakpointConfigs: BreakpointAnimationConfig
  ): AnimationConfig | null {
    for (const breakpoint of BREAKPOINT_ORDER) {
      if (breakpointConfigs[breakpoint]) {
        const mediaQuery = this.mediaQueries.get(breakpoint);
        if (mediaQuery && mediaQuery.matches) {
          return breakpointConfigs[breakpoint];
        }
      }
    }
    return breakpointConfigs.default || null;
  }
}
