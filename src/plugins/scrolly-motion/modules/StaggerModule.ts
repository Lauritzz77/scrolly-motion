/**
 * Stagger Module
 * Handles delayed animations for child elements
 */

import type { ScrollElement, StaggerConfig } from "../types";
import type { ScrollyMotionModule, ScrollyMotionCore } from "./ModuleInterface";

export class StaggerModule implements ScrollyMotionModule {
  name = "stagger";

  init(scrollyMotion: ScrollyMotionCore): void {
    // Module initialized
  }

  destroy(): void {
    // Module destroyed
  }

  parseElement(element: HTMLElement): void {
    // Look for stagger animations in data-animation attribute
    const animationAttr = element.getAttribute("data-animation");
    if (!animationAttr) return;

    // Parse stagger syntax: [&>li]:from:opacity-0|translateY-20; to:opacity-100|translateY-0|stagger-0.1;
    const staggerMatch = animationAttr.match(/\[([^\]]+)\]:/);
    if (!staggerMatch) return;

    const selector = staggerMatch[1];
    const children = Array.from(
      element.querySelectorAll(selector)
    ) as HTMLElement[];

    if (children.length === 0) return;

    // Parse the animation configuration
    const staggerConfig = this.parseStaggerAnimation(animationAttr, selector);
    if (!staggerConfig) return;

    // Store stagger configuration on the element
    const scrollElement = element as ScrollElement;
    scrollElement._staggerConfig = staggerConfig;
    scrollElement._staggerChildren = children;
  }

  updateElement(element: ScrollElement, progress: number): void {
    // Stagger animations are handled by the Timeline module
    // This module is primarily for parsing and setup
  }

  /**
   * Parse stagger animation configuration from data-animation attribute
   */
  private parseStaggerAnimation(
    animationAttr: string,
    selector: string
  ): StaggerConfig | null {
    try {
      // Remove the selector part to get the animation definition
      const animationDef = animationAttr.replace(`[${selector}]:`, "");

      // Parse from/to/timeline parts
      const parts = animationDef.split(/\s*;\s*/);
      const config: Partial<StaggerConfig> = {
        selector,
        from: {},
        to: {},
        staggerDelay: 0.1, // default
      };

      for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart) continue;

        if (trimmedPart.startsWith("from:")) {
          config.from = this.parseAnimationProperties(trimmedPart.substring(5));
        } else if (trimmedPart.startsWith("to:")) {
          const toProps = this.parseAnimationProperties(
            trimmedPart.substring(3)
          );
          config.to = toProps.properties;
          config.staggerDelay = toProps.staggerDelay || config.staggerDelay;
        } else if (trimmedPart.startsWith("timeline:")) {
          // Handle timeline-based stagger animations
          config.timeline = this.parseTimelineProperties(
            trimmedPart.substring(9)
          );
        }
      }

      return config as StaggerConfig;
    } catch (error) {
      console.warn("Failed to parse stagger animation:", error);
      return null;
    }
  }

  /**
   * Parse animation properties from a property string
   */
  private parseAnimationProperties(propString: string): {
    properties: Record<string, any>;
    staggerDelay?: number;
  } {
    const properties: Record<string, any> = {};
    let staggerDelay: number | undefined;

    // Split by | to get individual properties
    const props = propString.split("|");

    for (const prop of props) {
      const trimmedProp = prop.trim();
      if (!trimmedProp) continue;

      // Handle stagger delay
      if (trimmedProp.startsWith("stagger-")) {
        staggerDelay = parseFloat(trimmedProp.substring(8));
        continue;
      }

      // Parse property-value pairs
      const match = trimmedProp.match(/^([a-zA-Z-]+)-(.+)$/);
      if (!match) continue;

      const [, property, value] = match;
      properties[property] = this.parseValue(value);
    }

    return { properties, staggerDelay };
  }

  /**
   * Parse timeline properties (simplified version)
   */
  private parseTimelineProperties(timelineString: string): any[] {
    // This is a simplified parser - in a full implementation,
    // you'd want to reuse the timeline parsing logic from the main parser
    const steps = timelineString.split(";");
    const timeline: any[] = [];

    for (const step of steps) {
      const trimmedStep = step.trim();
      if (!trimmedStep) continue;

      // Parse step format: "from:props", "via-50%:props", "to:props"
      let at = 0;
      let propsString = "";

      if (trimmedStep.startsWith("from:")) {
        at = 0;
        propsString = trimmedStep.substring(5);
      } else if (trimmedStep.startsWith("to:")) {
        at = 1;
        propsString = trimmedStep.substring(3);
      } else if (trimmedStep.includes("via-")) {
        const viaMatch = trimmedStep.match(/via-(\d+)%:(.+)/);
        if (viaMatch) {
          at = parseInt(viaMatch[1]) / 100;
          propsString = viaMatch[2];
        }
      }

      if (propsString) {
        const { properties } = this.parseAnimationProperties(propsString);
        timeline.push({ at, properties });
      }
    }

    return timeline;
  }

  /**
   * Parse a single value (number, string with units, etc.)
   */
  private parseValue(value: string): any {
    // Handle arbitrary values in brackets [100px], [50vh], etc.
    const arbitraryMatch = value.match(/^\[(.+)\]$/);
    if (arbitraryMatch) {
      const innerValue = arbitraryMatch[1];
      // Try to parse as number first
      const numValue = parseFloat(innerValue);
      if (!isNaN(numValue) && innerValue === numValue.toString()) {
        return numValue;
      }
      return innerValue; // Return as string (e.g., "100px", "50vh")
    }

    // Handle negative values
    if (value.startsWith("-")) {
      const positiveValue = value.substring(1);
      const parsed = this.parseValue(positiveValue);
      return typeof parsed === "number" ? -parsed : `-${parsed}`;
    }

    // Try to parse as number (Tailwind-style values)
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      return numValue;
    }

    // Return as string for other cases
    return value;
  }

  /**
   * Get stagger children for an element
   */
  getStaggerChildren(element: HTMLElement, selector: string): HTMLElement[] {
    return Array.from(element.querySelectorAll(selector)) as HTMLElement[];
  }

  /**
   * Update stagger children for an element (useful for dynamic content)
   */
  updateStaggerChildren(element: ScrollElement): void {
    if (!element._staggerConfig) return;

    const selector = element._staggerConfig.selector;
    const newChildren = this.getStaggerChildren(element, selector);
    element._staggerChildren = newChildren;
  }
}

// Factory function for creating stagger module
export const stagger = (): StaggerModule => new StaggerModule();
