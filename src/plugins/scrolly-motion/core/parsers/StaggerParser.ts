/**
 * ScrollyMotion Stagger Parser
 * Handles parsing of stagger animations.
 */

import type {
  StaggerConfig,
  MultiBreakpointStaggerConfig,
} from "../../types/index.js";
import { TimelineParser } from "./TimelineParser";
import { ValueParser } from "./ValueParser";

export class StaggerParser {
  private timelineParser: TimelineParser;
  private valueParser: ValueParser;

  constructor() {
    this.valueParser = new ValueParser();
    this.timelineParser = new TimelineParser(this.valueParser);
  }

  parse(animationStr: string): StaggerConfig | null {
    if (!animationStr) return null;

    const transitionDurationMatch = animationStr.match(
      /transition-duration-(\d+)/
    );
    const transitionEasingMatch = animationStr.match(
      /transition-easing-([a-zA-Z-]+)/
    );

    const selectorMatch = animationStr.match(/^\[([^\]]+)\]:/);
    if (!selectorMatch) return null;

    let selector = selectorMatch[1];
    if (selector.startsWith("&")) {
      selector = selector.substring(1);
    }

    const configStr = animationStr.substring(selectorMatch[0].length);

    const config: StaggerConfig = {
      selector,
      from: {},
      to: {},
      staggerDelay: 0.1,
      breakpoint: "default",
      transitionDuration: transitionDurationMatch
        ? parseInt(transitionDurationMatch[1], 10)
        : undefined,
      transitionEasing: transitionEasingMatch
        ? transitionEasingMatch[1]
        : undefined,
    };

    const isTimeline =
      (configStr.includes(";") &&
        (configStr.includes("from:") ||
          configStr.includes("via-") ||
          configStr.includes("to:"))) ||
      configStr.includes("via-");

    if (isTimeline) {
      this.processSection("timeline", configStr, config);
    } else if (configStr.startsWith("timeline:")) {
      const timelineStr = configStr.substring(9);
      this.processSection("timeline", timelineStr, config);
    } else {
      const parts = configStr.split(":");
      let currentSection = "";
      let currentValue = "";

      parts.forEach((part) => {
        if (part === "from" || part === "to") {
          if (currentSection && currentValue) {
            this.processSection(currentSection, currentValue, config);
          }
          currentSection = part;
          currentValue = "";
        } else {
          if (currentValue) currentValue += ":";
          currentValue += part;
        }
      });

      if (currentSection && currentValue) {
        this.processSection(currentSection, currentValue, config);
      }
    }

    return config;
  }

  parseMultiBreakpoint(animationStr: string): MultiBreakpointStaggerConfig {
    const multiConfig: MultiBreakpointStaggerConfig = {};
    const breakpointRegex = /(@[^:]+:)/g;
    const parts = animationStr.split(breakpointRegex).filter(Boolean);

    let currentBreakpoint = "default";

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part.startsWith("@") && part.endsWith(":")) {
        currentBreakpoint = part.slice(1, -1);
        const configStr = parts[i + 1]?.trim();
        if (configStr) {
          const staggerConfig = this.parse(configStr);
          if (staggerConfig) {
            multiConfig[currentBreakpoint] = staggerConfig;
          }
          i++;
        }
      } else {
        const staggerConfig = this.parse(part);
        if (staggerConfig) {
          multiConfig["default"] = staggerConfig;
        }
      }
    }

    return multiConfig;
  }

  private processSection(
    section: string,
    value: string,
    config: StaggerConfig
  ): void {
    if (section === "from" || section === "to") {
      const props = value.split("|");
      props.forEach((prop) => {
        if (prop.startsWith("stagger-")) {
          config.staggerDelay = parseFloat(prop.substring(8)) || 0.1;
        } else {
          const dashIndex = prop.indexOf("-");
          if (dashIndex > 0) {
            const key = prop.substring(0, dashIndex);
            const val = prop.substring(dashIndex + 1);
            if (key && val !== undefined) {
              const target = section === "from" ? config.from : config.to;
              target[key] = this.valueParser.parse(key, val);
            }
          }
        }
      });
    } else if (section === "timeline") {
      let timelineStr = value;
      let staggerDelay = 0.1;

      let stepStrings: string[];
      if (value.includes(";")) {
        stepStrings = value.split(";");
      } else {
        stepStrings = value.split(/\s+(?=(?:from:|via-|to:))/);
      }

      const cleanedSteps: string[] = [];
      stepStrings.forEach((stepStr) => {
        const trimmed = stepStr.trim();
        if (trimmed.includes("|stagger-")) {
          const parts = trimmed.split("|");
          const staggerPart = parts.find((part) => part.startsWith("stagger-"));
          if (staggerPart) {
            staggerDelay = parseFloat(staggerPart.substring(8)) || 0.1;
          }
          const cleanedParts = parts.filter(
            (part) => !part.startsWith("stagger-")
          );
          cleanedSteps.push(cleanedParts.join("|"));
        } else {
          cleanedSteps.push(trimmed);
        }
      });

      config.staggerDelay = staggerDelay;
      timelineStr = cleanedSteps.join("; ");
      config.timeline = this.timelineParser.parse(timelineStr);
    }
  }
}
