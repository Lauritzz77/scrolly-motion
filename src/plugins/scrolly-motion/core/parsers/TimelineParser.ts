/**
 * ScrollyMotion Timeline Parser
 * Handles parsing of timeline animations.
 */

import type { TimelineStep } from "../../types/index.js";
import { ValueParser } from "./ValueParser";

export class TimelineParser {
  private valueParser: ValueParser;

  constructor(valueParser: ValueParser) {
    this.valueParser = valueParser;
  }

  parse(timelineStr: string): TimelineStep[] {
    const steps: TimelineStep[] = [];
    const stepStrings = timelineStr.split(";");

    stepStrings.forEach((stepStr) => {
      const trimmed = stepStr.trim();
      const colonIndex = trimmed.indexOf(":");

      if (colonIndex === -1) return;

      const progressStr = trimmed.substring(0, colonIndex);
      const propsStr = trimmed.substring(colonIndex + 1);

      let at: number;
      if (progressStr === "from") {
        at = 0;
      } else if (progressStr === "to") {
        at = 1;
      } else if (progressStr.startsWith("via-") && progressStr.endsWith("%")) {
        const percentStr = progressStr.substring(4, progressStr.length - 1);
        const percent = parseFloat(percentStr);
        if (isNaN(percent)) return;
        at = percent / 100;
      } else {
        at = parseFloat(progressStr);
        if (isNaN(at)) return;
      }

      const properties: Record<string, any> = {};
      const props = propsStr.split("|");

      props.forEach((prop) => {
        if (prop.startsWith("letter-spacing")) {
          const value = prop.substring(15);
          properties["letter-spacing"] = this.valueParser.parse(
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
            properties[key] = this.valueParser.parse(key, value);
          }
        }
      });

      steps.push({ at, properties });
    });

    return steps.sort((a, b) => a.at - b.at);
  }
}
