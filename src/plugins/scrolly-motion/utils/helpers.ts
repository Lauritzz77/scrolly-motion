/**
 * ScrollyMotion Helper Functions
 * Utility functions used throughout the library
 */

import type { DebouncedFunction } from "../types/index.js";

/**
 * Debounce function to limit function calls
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  wait: number
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout>;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Parse class names from string or array format
 */
export function parseClasses(
  strVal: string | undefined,
  defaultList: string[]
): string[] {
  if (!strVal) return defaultList;
  // Remove leading/trailing quotes and then split by one or more spaces
  const cleanedStr = strVal.trim().replace(/^['"]|['"]$/g, "");
  return cleanedStr.split(/\s+/).filter(Boolean);
}

/**
 * Parse size values (pixels, percentages, viewport units)
 */
export function parseSize(
  raw: string | number | undefined,
  vh: number
): number {
  // raw can be number, percentage, or vh (including negative values)
  if (typeof raw === "number") return raw > 0 && raw < 1 ? raw * vh : raw;
  if (typeof raw === "string") {
    // Updated regex to handle negative values: -50vh, -100px, etc.
    const m = raw.match(/^(-?[\d.]+)(vh|px|%)$/);
    if (m) {
      const val = parseFloat(m[1]); // This will handle negative values correctly
      const unit = m[2];
      if (unit === "%" || unit === "vh") return vh * (val / 100);
      if (unit === "px") return val;
    }
  }
  return 0;
}

/**
 * Initialize media queries for breakpoints
 */
export function initializeMediaQueries(
  breakpoints: Record<string, string>
): Map<string, MediaQueryList> {
  const mediaQueries = new Map<string, MediaQueryList>();

  Object.entries(breakpoints).forEach(([name, query]) => {
    const mediaQuery = window.matchMedia(query);
    mediaQueries.set(name, mediaQuery);
  });

  return mediaQueries;
}
