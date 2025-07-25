/**
 * Theme Module
 * Handles dynamic theme switching based on scroll position
 */

import type { ScrollElement } from "../types";
import type { ScrollyMotionModule, ScrollyMotionCore } from "./ModuleInterface";

export class ThemeModule implements ScrollyMotionModule {
  name = "themes";
  private scrollyMotion: ScrollyMotionCore | null = null;
  private currentTheme: string | null = null;
  private themeElements = new Set<ScrollElement>();

  init(scrollyMotion: ScrollyMotionCore): void {
    this.scrollyMotion = scrollyMotion;
  }

  destroy(): void {
    this.themeElements.clear();
    this.scrollyMotion = null;
  }

  parseElement(element: HTMLElement): void {
    // Look for theme configuration in data-scroll attribute
    const scrollAttr = element.getAttribute("data-scroll");
    if (!scrollAttr) return;

    const themeMatch = scrollAttr.match(/theme:\s*([^;]+)/);
    if (!themeMatch) return;

    const theme = themeMatch[1].trim();
    const scrollElement = element as ScrollElement;
    scrollElement._theme = theme;

    this.themeElements.add(scrollElement);
  }

  updateElement(element: ScrollElement, progress: number): void {
    if (!element._theme) return;

    // Check if element is in viewport (progress > 0 means it's visible)
    const isVisible = progress > 0 && progress <= 1;

    if (isVisible) {
      this.setTheme(element._theme);
    }
  }

  /**
   * Set the current theme on the body element
   */
  private setTheme(theme: string): void {
    if (this.currentTheme === theme) return;

    const body = document.body;

    // Remove previous theme attribute if it exists
    if (this.currentTheme) {
      body.removeAttribute(`data-theme-${this.currentTheme}`);
    }

    // Set new theme attribute
    body.setAttribute(`data-theme-${theme}`, "");
    this.currentTheme = theme;

    // Emit theme change event
    if (this.scrollyMotion) {
      this.scrollyMotion.emit("themeChange", theme);
    }
  }

  /**
   * Get the current active theme
   */
  getCurrentTheme(): string | null {
    return this.currentTheme;
  }

  /**
   * Manually set a theme
   */
  setManualTheme(theme: string): void {
    this.setTheme(theme);
  }

  /**
   * Clear the current theme
   */
  clearTheme(): void {
    if (this.currentTheme) {
      const body = document.body;
      body.removeAttribute(`data-theme-${this.currentTheme}`);
      this.currentTheme = null;

      if (this.scrollyMotion) {
        this.scrollyMotion.emit("themeChange", null);
      }
    }
  }

  /**
   * Get all elements with theme configuration
   */
  getThemeElements(): ScrollElement[] {
    return Array.from(this.themeElements);
  }

  /**
   * Remove an element from theme tracking
   */
  removeElement(element: ScrollElement): void {
    this.themeElements.delete(element);
  }

  /**
   * Update theme based on currently visible elements
   * This method can be called to recalculate theme based on all visible elements
   */
  updateThemeFromVisibleElements(): void {
    if (!this.scrollyMotion) return;

    const activeElements = this.scrollyMotion.getActiveElements();

    // Find the first theme element that's currently visible
    for (const element of activeElements) {
      if (element._theme) {
        this.setTheme(element._theme);
        return;
      }
    }

    // If no theme elements are visible, clear the theme
    this.clearTheme();
  }
}

// Factory function for creating theme module
export const themes = (): ThemeModule => new ThemeModule();
