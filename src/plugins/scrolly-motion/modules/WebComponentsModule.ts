/**
 * Web Components Module
 * Handles integration with custom Web Components
 */

import type { ScrollElement } from "../types";
import type { ScrollyMotionModule, ScrollyMotionCore } from "./ModuleInterface";

interface WebComponentElement extends HTMLElement {
  progress?(value: number): void;
  enter?(): void;
  leave?(): void;
}

export class WebComponentsModule implements ScrollyMotionModule {
  name = "webcomponents";
  private webComponentElements = new Map<
    ScrollElement,
    WebComponentElement[]
  >();

  init(scrollyMotion: ScrollyMotionCore): void {
    // Module initialized
  }

  destroy(): void {
    this.webComponentElements.clear();
  }

  parseElement(element: HTMLElement): void {
    // Look for web component configuration in data-scroll attribute
    const scrollAttr = element.getAttribute("data-scroll");
    if (!scrollAttr) return;

    const wcMatch = scrollAttr.match(/wc:\s*([^;]+)/);
    if (!wcMatch) return;

    const selector = wcMatch[1].trim();
    const webComponents = Array.from(
      element.querySelectorAll(selector)
    ) as WebComponentElement[];

    if (webComponents.length === 0) return;

    // Store web components for this element
    const scrollElement = element as ScrollElement;
    scrollElement._webComponents = selector;
    this.webComponentElements.set(scrollElement, webComponents);
  }

  updateElement(element: ScrollElement, progress: number): void {
    const webComponents = this.webComponentElements.get(element);
    if (!webComponents || webComponents.length === 0) return;

    // Update progress for all web components
    webComponents.forEach((component: WebComponentElement) => {
      if (typeof component.progress === "function") {
        try {
          component.progress(progress);
        } catch (error) {
          console.warn(
            "Error calling progress method on web component:",
            error
          );
        }
      }
    });
  }

  /**
   * Handle element enter event
   */
  onElementEnter(element: ScrollElement): void {
    const webComponents = this.webComponentElements.get(element);
    if (!webComponents || webComponents.length === 0) return;

    webComponents.forEach((component: WebComponentElement) => {
      if (typeof component.enter === "function") {
        try {
          component.enter();
        } catch (error) {
          console.warn("Error calling enter method on web component:", error);
        }
      }
    });
  }

  /**
   * Handle element leave event
   */
  onElementLeave(element: ScrollElement): void {
    const webComponents = this.webComponentElements.get(element);
    if (!webComponents || webComponents.length === 0) return;

    webComponents.forEach((component: WebComponentElement) => {
      if (typeof component.leave === "function") {
        try {
          component.leave();
        } catch (error) {
          console.warn("Error calling leave method on web component:", error);
        }
      }
    });
  }

  /**
   * Update web components for an element (useful for dynamic content)
   */
  updateWebComponents(element: ScrollElement): void {
    if (!element._webComponents) return;

    const selector = element._webComponents;
    const newComponents = Array.from(
      element.querySelectorAll(selector)
    ) as WebComponentElement[];

    this.webComponentElements.set(element, newComponents);
  }

  /**
   * Get web components for an element
   */
  getWebComponents(element: ScrollElement): WebComponentElement[] {
    return this.webComponentElements.get(element) || [];
  }

  /**
   * Remove an element from web component tracking
   */
  removeElement(element: ScrollElement): void {
    this.webComponentElements.delete(element);
  }

  /**
   * Check if a web component supports a specific method
   */
  supportsMethod(component: WebComponentElement, method: string): boolean {
    return typeof (component as any)[method] === "function";
  }

  /**
   * Call a method on all web components for an element
   */
  callMethodOnComponents(
    element: ScrollElement,
    method: string,
    ...args: any[]
  ): void {
    const webComponents = this.webComponentElements.get(element);
    if (!webComponents || webComponents.length === 0) return;

    webComponents.forEach((component: WebComponentElement) => {
      if (this.supportsMethod(component, method)) {
        try {
          (component as any)[method](...args);
        } catch (error) {
          console.warn(
            `Error calling ${method} method on web component:`,
            error
          );
        }
      }
    });
  }

  /**
   * Get all elements with web component configuration
   */
  getWebComponentElements(): ScrollElement[] {
    return Array.from(this.webComponentElements.keys());
  }
}

// Factory function for creating web components module
export const webcomponents = (): WebComponentsModule =>
  new WebComponentsModule();
