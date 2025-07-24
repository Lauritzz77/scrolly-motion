/**
 * ScrollyMotion Validation
 * Provides functions for validating configuration objects.
 */

import type { ScrollAnimatorConfig } from "../types/index.js";

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedConfig: ScrollAnimatorConfig;
}

export function validateConfig(config: ScrollAnimatorConfig): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const sanitizedConfig: ScrollAnimatorConfig = { ...config };

  // Validate selector
  if (config.selector && typeof config.selector !== "string") {
    errors.push("`selector` must be a string.");
  }

  // Validate defaultEnter
  if (config.defaultEnter && typeof config.defaultEnter !== "string") {
    errors.push("`defaultEnter` must be a string.");
  }

  // Validate breakpoints
  if (config.breakpoints) {
    if (typeof config.breakpoints !== "object" || config.breakpoints === null) {
      errors.push("`breakpoints` must be an object.");
    } else {
      for (const key in config.breakpoints) {
        if (typeof config.breakpoints[key] !== "string") {
          warnings.push(
            `Breakpoint \`${key}\` has an invalid value. It must be a string.`
          );
        }
      }
    }
  }

  // Validate presets
  if (config.presets) {
    if (typeof config.presets !== "object" || config.presets === null) {
      errors.push("`presets` must be an object.");
    } else {
      for (const key in config.presets) {
        if (!Array.isArray(config.presets[key])) {
          warnings.push(
            `Preset \`${key}\` has an invalid value. It must be an array of TimelineStep objects.`
          );
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitizedConfig,
  };
}
