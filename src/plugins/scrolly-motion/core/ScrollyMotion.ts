/**
 * ScrollyMotion Core Class
 * Main class that orchestrates all scroll animation functionality
 */

import type {
  ScrollAnimatorConfig,
  ScrollElement,
  ScrollyMotionMetrics,
  TimelineStep,
  MultiBreakpointStaggerConfig,
  StaggerConfig,
} from "../types/index.js";
import {
  DEFAULT_CONFIG,
  DEFAULT_ELEMENT_CONFIG,
  DEFAULT_SCROLL_CONFIG,
  BREAKPOINT_ORDER,
} from "../utils/constants.js";
import { debounce, initializeMediaQueries } from "../utils/helpers.js";
import { validateConfig } from "../utils/validation.js";
import { Parser } from "./Parser.js";
import { Animation } from "./Animation.js";
import { Physics } from "./Physics.js";
import { ThemeManager } from "./ThemeManager.js";
import { ElementManager } from "./ElementManager.js";
import { EventManager } from "./EventManager.js";
import { PluginManager } from "./PluginManager.js";
import type { ScrollyMotionPlugin } from "./PluginManager.js";

interface ProgressWebComponent extends HTMLElement {
  progress: (value: number) => void;
  enter?: () => void;
  leave?: () => void;
  _lastProgress?: number;
  _lastInView?: boolean;
}

export class ScrollyMotion {
  private prevScrollY: number;
  private ticking: boolean;
  private body: HTMLElement;
  private onResize: () => void;
  private mediaQueries: Map<string, MediaQueryList>;

  private parser: Parser;
  private animation: Animation;
  private physics: Physics;
  private themeManager: ThemeManager;
  private elementManager: ElementManager;
  private eventManager: EventManager;
  private pluginManager: PluginManager;

  constructor(config: ScrollAnimatorConfig = {}) {
    this.eventManager = new EventManager();
    this.pluginManager = new PluginManager();
    const { isValid, errors, warnings, sanitizedConfig } =
      validateConfig(config);

    if (warnings.length > 0) {
      warnings.forEach((warning) => console.warn(`ScrollyMotion: ${warning}`));
    }

    if (!isValid) {
      errors.forEach((error) => console.error(`ScrollyMotion: ${error}`));
      throw new Error("ScrollyMotion: Invalid configuration.");
    }

    this.prevScrollY = 0;
    this.ticking = false;

    // bind methods
    this.updateScroll = this.updateScroll.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onResize = debounce(() => {
      this.elementManager.measureElements();
      this.updateScroll();
    }, 200);

    this.body = document.body;
    this.mediaQueries = initializeMediaQueries(
      sanitizedConfig.breakpoints || DEFAULT_CONFIG.breakpoints
    );

    // Initialize modules
    const timelinePresets = this.initializePresets(sanitizedConfig.presets);
    this.parser = new Parser(
      timelinePresets,
      this.mediaQueries,
      this.pluginManager
    );
    this.animation = new Animation();
    this.physics = new Physics();
    this.themeManager = new ThemeManager();
    this.elementManager = new ElementManager(
      sanitizedConfig,
      this.parser,
      this.animation,
      this.themeManager,
      this.mediaQueries
    );

    this.init();
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("scroll", this.onScroll);
    this.physics.stopPhysics();
    this.elementManager.destroy();
    this.eventManager.destroy();
    this.pluginManager.destroy();
  }

  init(): void {
    const initElements = () => {
      this.elementManager.discoverElements();
      if (this.elementManager.getElements().length > 0) {
        this.elementManager.measureElements();
        // Force an initial scroll update to set initial states
        this.updateScroll();
        // Also trigger after a small delay to ensure everything is ready
        setTimeout(() => {
          this.updateScroll();
        }, 50);
        this.physics.startDampingLoop(this.elementManager.getElements());
      }
    };

    // Check if DOM is already loaded
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", initElements);
    } else {
      // DOM is already loaded, initialize immediately
      initElements();
    }

    window.addEventListener("resize", this.onResize);
    window.addEventListener("scroll", this.onScroll, { passive: true });
  }

  onScroll(): void {
    this.physics.onScroll(this.elementManager.getActiveElements());

    if (!this.ticking) {
      window.requestAnimationFrame(this.updateScroll);
      this.ticking = true;
    }
  }

  updateScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    let dir: "up" | "down" = "up";
    if (scrollY >= 300) dir = scrollY > this.prevScrollY ? "down" : "up";
    this.body.setAttribute("data-scroll-direction", dir);
    this.prevScrollY = scrollY;

    this.elementManager.getActiveElements().forEach((el) => {
      const { _enterAt, _distance, _exitAt, _once, _damping } = el;
      const targetProgress = Math.min(
        1,
        Math.max(0, (scrollY - _enterAt) / _distance)
      );

      // Update target progress
      el._targetProgress = targetProgress;

      // If no damping, use direct progress
      let actualProgress = targetProgress;

      if (_damping > 0) {
        // Apply damping - smooth interpolation towards target
        const dampingFactor = 1 - _damping;
        el._currentProgress =
          el._currentProgress * dampingFactor + targetProgress * _damping;
        actualProgress = el._currentProgress;
      } else {
        // No damping - use target progress directly
        el._currentProgress = targetProgress;
      }

      // Only update if progress has changed significantly (avoid unnecessary updates)
      const progressDiff = Math.abs(actualProgress - (el._lastProg || 0));
      if (progressDiff < 0.001 && _damping > 0) return;

      el._lastProg = actualProgress;
      el.style.setProperty("--element-progress", actualProgress.toFixed(3));

      const hasEntered = actualProgress > 0;
      const hasExited = scrollY > _exitAt;
      const inView = hasEntered && !hasExited;

      if (el._theme) {
        this.themeManager.updateElementViewStatus(el, inView);
      }

      if (inView) {
        if (!el._hasEnteredOnce) {
          this.eventManager.emit("elementEnter", el);
        }
        el._hasEnteredOnce = true;
        el._enterClassNames.forEach((c) => el.classList.add(c));
        el._leaveClassNames.forEach((c) => el.classList.remove(c));
      } else {
        if (el._hasEnteredOnce) {
          this.eventManager.emit("elementLeave", el);
        }
        // Not in view
        if (_once && el._hasEnteredOnce) {
          // If once and has entered, do nothing.
        } else {
          el._enterClassNames.forEach((c) => el.classList.remove(c));
          el._leaveClassNames.forEach((c) => el.classList.add(c));
        }
      }

      // Handle animations with the actual (potentially damped) progress
      if (el._animationConfig) {
        this.animation.updateAnimation(el, actualProgress);
      }

      // Handle stagger animations
      if (el._staggerConfig && el._staggerChildren.length > 0) {
        this.animation.updateStaggerAnimation(el, actualProgress);
      }

      // update web components only if progress value changes
      el._wcElements.forEach((wcEl) => {
        const comp = wcEl as ProgressWebComponent;
        if (typeof comp.progress === "function") {
          if (comp._lastProgress !== actualProgress) {
            comp.progress(actualProgress);
            comp._lastProgress = actualProgress;
          }
        }
        // Handle enter/leave triggers
        if (typeof comp.enter === "function") {
          const nowInView = inView;
          if (comp._lastInView !== nowInView) {
            if (nowInView && typeof comp.enter === "function") comp.enter();
            if (!nowInView && typeof comp.leave === "function") comp.leave();
            comp._lastInView = nowInView;
          }
        }
      });

      // We don't filter the elements array anymore, just update properties
    });

    this.ticking = false;
  }

  public on(eventName: string, handler: (...args: any[]) => void): void {
    this.eventManager.on(eventName, handler);
  }

  public registerPlugin(plugin: ScrollyMotionPlugin): void {
    this.pluginManager.register(plugin);
  }

  initializePresets(
    customPresets: Record<string, TimelineStep[]> = {}
  ): Map<string, TimelineStep[]> {
    const presets = new Map<string, TimelineStep[]>();

    // Only add user-defined custom presets
    Object.entries(customPresets).forEach(([name, steps]) => {
      presets.set(name, steps);
    });

    return presets;
  }

  getMetrics(): ScrollyMotionMetrics {
    // Calculate FPS based on animation frame timing
    const { lastScrollTime } = this.physics.getScrollState();
    const now = performance.now();
    const fps =
      lastScrollTime > 0 ? Math.round(1000 / (now - lastScrollTime)) : 60;

    const elements = this.elementManager.getElements();
    // Count active elements (elements with damping or animations)
    const activeElements = elements.filter(
      (el) => el._damping > 0 || el._animationConfig || el._staggerConfig
    ).length;

    // Estimate memory usage (rough calculation)
    const memoryUsage = elements.length * 0.5 + activeElements * 1.2;

    // Check if GPU acceleration is available
    const gpuAccelerated = "transform" in document.createElement("div").style;

    return {
      fps: Math.min(fps, 60), // Cap at 60fps
      activeElements,
      memoryUsage,
      gpuAccelerated,
    };
  }
}
