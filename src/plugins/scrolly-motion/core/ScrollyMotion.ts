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
import {
  debounce,
  parseClasses,
  parseSize,
  initializeMediaQueries,
} from "../utils/helpers.js";
import { generateTransition } from "../utils/get-transition.js";
import { Parser } from "./Parser.js";
import { Animation } from "./Animation.js";
import { Physics } from "./Physics.js";
import { ThemeManager } from "./ThemeManager.js";

interface ProgressWebComponent extends HTMLElement {
  progress: (value: number) => void;
  enter?: () => void;
  leave?: () => void;
  _lastProgress?: number;
  _lastInView?: boolean;
}

export class ScrollyMotion {
  selector: string;
  prevScrollY: number;
  ticking: boolean;
  elements: ScrollElement[];
  body: HTMLElement;
  onResize: () => void;
  timelinePresets: Map<string, TimelineStep[]>;
  breakpoints: Record<string, string>;
  mediaQueries: Map<string, MediaQueryList>;
  defaultEnter: string;

  private parser: Parser;
  private animation: Animation;
  private physics: Physics;
  private themeManager: ThemeManager;

  constructor({
    selector = DEFAULT_CONFIG.selector,
    breakpoints = DEFAULT_CONFIG.breakpoints,
    presets = DEFAULT_CONFIG.presets,
    defaultEnter = DEFAULT_CONFIG.defaultEnter,
  }: ScrollAnimatorConfig = {}) {
    this.selector = selector;
    this.prevScrollY = 0;
    this.ticking = false;
    this.elements = [];

    // bind methods
    this.measure = this.measure.bind(this);
    this.updateScroll = this.updateScroll.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.onResize = debounce(() => {
      this.measure();
      this.updateScroll();
    }, 200);

    this.body = document.body;
    this.breakpoints = breakpoints;
    this.mediaQueries = initializeMediaQueries(breakpoints);
    this.timelinePresets = this.initializePresets(presets);
    this.defaultEnter = defaultEnter;

    // Initialize modules
    this.parser = new Parser(this.timelinePresets, this.mediaQueries);
    this.animation = new Animation();
    this.physics = new Physics();
    this.themeManager = new ThemeManager();

    this.init();
  }

  destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("scroll", this.onScroll);
    this.physics.stopPhysics();
    this.elements = [];
  }

  init(): void {
    // Check if DOM is already loaded
    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", () => {
        this.initializeElements();
      });
    } else {
      // DOM is already loaded, initialize immediately
      this.initializeElements();
    }

    window.addEventListener("resize", this.onResize);
    window.addEventListener("scroll", this.onScroll, { passive: true });
  }

  initializeElements(): void {
    this.elements = Array.from(
      document.querySelectorAll(this.selector)
    ) as ScrollElement[];

    if (this.elements.length > 0) {
      this.measure();
      // Force an initial scroll update to set initial states
      this.updateScroll();
      // Also trigger after a small delay to ensure everything is ready
      setTimeout(() => {
        this.updateScroll();
      }, 50);
      this.physics.startDampingLoop(this.elements);
    }
  }

  onScroll(): void {
    this.physics.onScroll(this.elements);

    if (!this.ticking) {
      window.requestAnimationFrame(this.updateScroll);
      this.ticking = true;
    }
  }

  measure(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    const vh = window.innerHeight;

    this.elements = this.elements.map((el) => {
      const rect = el.getBoundingClientRect();
      const docTop = scrollY + rect.top;
      const height = rect.height;

      // parse config
      const hasDataScroll = el.hasAttribute("data-scroll");
      const hasDataAnimation = el.hasAttribute("data-animation");
      const scrollAttr =
        !hasDataScroll && hasDataAnimation
          ? Object.entries(DEFAULT_SCROLL_CONFIG)
              .map(([key, value]) => `${key}:${value}`)
              .join(";")
          : el.getAttribute("data-scroll") || "";

      const cfg = scrollAttr
        .split(/\s*;\s*/)
        .reduce((acc: Record<string, any>, pair: string) => {
          const [key, val] = pair.split(/\s*:\s*/);
          if (!key) return acc;
          let v: any = val;
          if (v === "true" || v === "false") v = v === "true";
          else if (!isNaN(v)) v = parseFloat(v);
          acc[key] = v;
          return acc;
        }, {});

      // use the configured default enter offset if not specified
      const enterOffset = parseSize(
        cfg.enter != null ? cfg.enter : this.defaultEnter,
        vh
      );
      const exitOffset = parseSize(cfg.exit != null ? cfg.exit : 0, vh);
      let distance;

      // when exit is specified but distance is not, calculate natural distance
      if (cfg.exit != null && cfg.distance == null) {
        const enterPoint = docTop - (vh - enterOffset);
        const exitPoint = docTop + height - exitOffset;
        distance = exitPoint - enterPoint;
      } else {
        distance = parseSize(cfg.distance != null ? cfg.distance : height, vh);
      }

      // thresholds
      (el as ScrollElement)._enterAt = docTop - (vh - enterOffset);
      (el as ScrollElement)._distance = distance;
      (el as ScrollElement)._exitAt = docTop + height - exitOffset;

      // classes & theme
      (el as ScrollElement)._theme = cfg.theme;
      if (cfg.theme) {
        this.themeManager.registerElement(el, cfg.theme);
      }
      (el as ScrollElement)._once = cfg.once;
      (el as ScrollElement)._enterClassNames = parseClasses(
        cfg.enterClass || cfg.class,
        DEFAULT_ELEMENT_CONFIG.enterClassNames
      );
      (el as ScrollElement)._leaveClassNames = parseClasses(
        cfg.leaveClass,
        DEFAULT_ELEMENT_CONFIG.leaveClassNames
      );
      (el as ScrollElement)._hasEnteredOnce = false;

      // cache web components
      const wcSelectors = parseClasses(cfg.wc, []);
      (el as ScrollElement)._wcElements = wcSelectors.flatMap((sel: string) =>
        Array.from(el.querySelectorAll(sel))
      );

      // parse damping and friction
      (el as ScrollElement)._damping = cfg.damping;
      (el as ScrollElement)._friction = cfg.friction;
      (el as ScrollElement)._targetProgress = 0;
      (el as ScrollElement)._currentProgress = 0;
      (el as ScrollElement)._velocity = 0;
      (el as ScrollElement)._lastTargetProgress = 0;
      (el as ScrollElement)._isScrolling = false;

      // parse animation config
      const animationStr = el.getAttribute("data-animation");
      if (animationStr) {
        const isStagger = animationStr.includes(":[");
        const isMultiBreakpointStagger = animationStr.includes("]:");

        if (isMultiBreakpointStagger) {
          (el as ScrollElement)._multiStaggerConfig =
            this.parser.parseMultiBreakpointStagger(animationStr);
          (el as ScrollElement)._staggerConfig = this.getActiveStaggerConfig(
            el._multiStaggerConfig
          );
          (el as ScrollElement)._animationConfig = null;
        } else if (isStagger) {
          (el as ScrollElement)._staggerConfig =
            this.parser.parseStaggerAnimation(animationStr);
          (el as ScrollElement)._animationConfig = null;
        } else {
          (el as ScrollElement)._animationConfig =
            this.parser.parseAnimation(animationStr);
          (el as ScrollElement)._staggerConfig = null;
        }
      } else {
        (el as ScrollElement)._animationConfig = null;
        (el as ScrollElement)._staggerConfig = null;
      }
      (el as ScrollElement)._animeInstance = null;
      (el as ScrollElement)._staggerChildren = [];

      // Find stagger children if stagger config exists
      if ((el as ScrollElement)._staggerConfig) {
        const staggerConfig = (el as ScrollElement)._staggerConfig!;
        let children: HTMLElement[] = [];

        // Handle different selector formats
        if (staggerConfig.selector.startsWith(">")) {
          // Direct child selector like ">h1"
          const childSelector = staggerConfig.selector.substring(1);
          children = Array.from(el.children).filter((child) =>
            child.matches(childSelector)
          ) as HTMLElement[];
        } else {
          // Regular selector
          children = Array.from(
            el.querySelectorAll(staggerConfig.selector)
          ) as HTMLElement[];
        }

        (el as ScrollElement)._staggerChildren = children;

        // Apply initial state to all stagger children
        children.forEach((child) => {
          this.animation.applyAnimationValues(child, staggerConfig.from);

          // Apply transition style
          const transition = generateTransition(
            staggerConfig,
            staggerConfig.transitionDuration,
            staggerConfig.transitionEasing
          );
          if (transition) {
            child.style.transition = transition;
          }
        });
      }

      // Apply initial animation state for regular animations
      if ((el as ScrollElement)._animationConfig) {
        const config = (el as ScrollElement)._animationConfig!;
        this.animation.applyAnimationValues(el, config.from);

        // Apply transition style
        const transition = generateTransition(
          config,
          config.transitionDuration,
          config.transitionEasing
        );
        if (transition) {
          el.style.transition = transition;
        }
      }

      (el as ScrollElement)._lastProg = null;
      return el as ScrollElement;
    });
  }

  updateScroll(): void {
    const scrollY = window.scrollY || window.pageYOffset;
    let dir: "up" | "down" = "up";
    if (scrollY >= 300) dir = scrollY > this.prevScrollY ? "down" : "up";
    this.body.setAttribute("data-scroll-direction", dir);
    this.prevScrollY = scrollY;

    this.elements = this.elements.filter((el) => {
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
      if (progressDiff < 0.001 && _damping > 0) return true;

      el._lastProg = actualProgress;
      el.style.setProperty("--element-progress", actualProgress.toFixed(3));

      const hasEntered = actualProgress > 0;
      const hasExited = scrollY > _exitAt;
      const inView = hasEntered && !hasExited;

      if (el._theme) {
        this.themeManager.updateElementViewStatus(el, inView);
      }

      if (inView) {
        el._hasEnteredOnce = true;
        el._enterClassNames.forEach((c) => el.classList.add(c));
        el._leaveClassNames.forEach((c) => el.classList.remove(c));
      } else {
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

      // drop if once & fully displayed
      return !(_once && el._hasEnteredOnce);
    });

    this.ticking = false;
  }

  getActiveStaggerConfig(
    multiConfig: MultiBreakpointStaggerConfig | null
  ): StaggerConfig | null {
    if (!multiConfig) return null;

    for (const breakpoint of BREAKPOINT_ORDER) {
      if (multiConfig[breakpoint]) {
        const mediaQuery = this.mediaQueries.get(breakpoint);
        if (mediaQuery && mediaQuery.matches) {
          return multiConfig[breakpoint];
        }
      }
    }

    return multiConfig.default || null;
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

    // Count active elements (elements with damping or animations)
    const activeElements = this.elements.filter(
      (el) => el._damping > 0 || el._animationConfig || el._staggerConfig
    ).length;

    // Estimate memory usage (rough calculation)
    const memoryUsage = this.elements.length * 0.5 + activeElements * 1.2;

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
