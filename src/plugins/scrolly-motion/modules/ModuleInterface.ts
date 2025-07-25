/**
 * ScrollyMotion Module Interface
 * Base interface that all feature modules must implement
 */

import type { ScrollElement } from "../types";

export interface ScrollyMotionModule {
  name: string;
  init(scrollyMotion: ScrollyMotionCore): void;
  destroy?(): void;
  updateElement?(element: ScrollElement, progress: number): void;
  parseElement?(element: HTMLElement): void;
}

// Forward declaration for the core class
export interface ScrollyMotionCore {
  getElements(): ScrollElement[];
  getActiveElements(): ScrollElement[];
  on(eventName: string, handler: (...args: any[]) => void): void;
  emit(eventName: string, ...args: any[]): void;
}
