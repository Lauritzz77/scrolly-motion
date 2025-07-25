/**
 * ScrollyMotion Element Manager
 * Manages the lifecycle of scroll elements, including discovery, initialization,
 * configuration parsing, and state management.
 */

import type {
  ScrollAnimatorConfig,
  ScrollElement,
  StaggerConfig,
  MultiBreakpointStaggerConfig,
} from "../types/index.js";
import {
  DEFAULT_SCROLL_CONFIG,
  DEFAULT_ELEMENT_CONFIG,
  BREAKPOINT_ORDER,
} from "../utils/constants.js";
import { parseSize, parseClasses } from "../utils/helpers";
import { generateTransition } from "../utils/get-transition";
import type { Parser } from "./Parser";
import type { Animation } from "./Animation";
import type { ThemeManager } from "./ThemeManager";

export class ElementManager {
  private elements: Map<HTMLElement, ScrollElement>;
  private selector: string;
  private config: ScrollAnimatorConfig;
  private parser: Parser;
  private animation: Animation;
  private themeManager: ThemeManager;
  private mediaQueries: Map<string, MediaQueryList>;
  private intersectionObserver: IntersectionObserver;
  private activeElements: Set<ScrollElement> = new Set();

  constructor(
    config: ScrollAnimatorConfig,
    parser: Parser,
    animation: Animation,
    themeManager: ThemeManager,
    mediaQueries: Map<string, MediaQueryList>
  ) {
    this.elements = new Map();
    this.selector = config.selector || "[data-scroll], [data-animation]";
    this.config = config;
    this.parser = parser;
    this.animation = animation;
    this.themeManager = themeManager;
    this.mediaQueries = mediaQueries;

    this.intersectionObserver = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: "0px",
        threshold: 0,
      }
    );
  }

  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    entries.forEach((entry) => {
      const element = this.elements.get(entry.target as HTMLElement);
      if (element) {
        if (entry.isIntersecting) {
          this.activeElements.add(element);
        } else {
          this.activeElements.delete(element);
        }
      }
    });
  }

  public discoverElements(): void {
    const foundElements = document.querySelectorAll(this.selector);
    foundElements.forEach((el) => {
      if (!this.elements.has(el as HTMLElement)) {
        this.elements.set(el as HTMLElement, el as ScrollElement);
        this.intersectionObserver.observe(el);
      }
    });
  }

  public measureElements(): void {
    const vh = window.innerHeight;
    this.elements.forEach((el) => {
      this._parseElementConfig(el, vh);
      this._setupAnimationConfig(el);
    });
  }

  private _applyInitialVisualState(el: ScrollElement): void {
    // Apply initial visual state for regular animations
    if (el._animationConfig) {
      let initialValues: Record<string, any> = {};

      // If timeline exists, use the first step (at: 0) as initial values
      if (
        el._animationConfig.timeline &&
        el._animationConfig.timeline.length > 0
      ) {
        const firstStep = el._animationConfig.timeline[0];
        if (firstStep.at === 0) {
          initialValues = firstStep.properties;
        }
      }
      // Otherwise use from values if they exist
      else if (
        el._animationConfig.from &&
        Object.keys(el._animationConfig.from).length > 0
      ) {
        initialValues = el._animationConfig.from;
      }

      // Apply the initial values
      if (Object.keys(initialValues).length > 0) {
        this.animation.applyAnimationValues(el, initialValues);
        // Set progress to 0
        el.style.setProperty("--element-progress", "0.000");
      }
    }

    // Apply initial visual state for stagger animations
    if (el._staggerConfig) {
      let initialValues: Record<string, any> = {};

      // If timeline exists, use the first step (at: 0) as initial values
      if (el._staggerConfig.timeline && el._staggerConfig.timeline.length > 0) {
        const firstStep = el._staggerConfig.timeline[0];
        if (firstStep.at === 0) {
          initialValues = firstStep.properties;
        }
      }
      // Otherwise use from values if they exist
      else if (
        el._staggerConfig.from &&
        Object.keys(el._staggerConfig.from).length > 0
      ) {
        initialValues = el._staggerConfig.from;
      }

      // Apply the initial values to stagger children
      if (Object.keys(initialValues).length > 0) {
        let children: HTMLElement[] = [];

        // Handle different selector formats
        if (el._staggerConfig.selector.startsWith(">")) {
          // Direct child selector like ">h1"
          const childSelector = el._staggerConfig.selector.substring(1);
          children = Array.from(el.children).filter((child) =>
            child.matches(childSelector)
          ) as HTMLElement[];
        } else {
          // Regular selector
          children = Array.from(
            el.querySelectorAll(el._staggerConfig.selector)
          ) as HTMLElement[];
        }

        // Apply initial state to all stagger children
        children.forEach((child) => {
          this.animation.applyAnimationValues(child, initialValues);
        });
        // Set progress to 0
        el.style.setProperty("--element-progress", "0.000");
      }
    }
  }

  private _parseElementConfig(el: ScrollElement, vh: number): void {
    const scrollY = window.scrollY || window.pageYOffset;
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
      cfg.enter != null ? cfg.enter : this.config.defaultEnter,
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
    el._enterAt = docTop - (vh - enterOffset);
    el._distance = distance;
    el._exitAt = docTop + height - exitOffset;

    // classes & theme
    el._theme = cfg.theme;
    if (cfg.theme) {
      this.themeManager.registerElement(el, cfg.theme);
    }
    el._once = cfg.once;
    el._enterClassNames = parseClasses(
      cfg.enterClass || cfg.class,
      DEFAULT_ELEMENT_CONFIG.enterClassNames
    );
    el._leaveClassNames = parseClasses(
      cfg.leaveClass,
      DEFAULT_ELEMENT_CONFIG.leaveClassNames
    );
    el._hasEnteredOnce = false;

    // cache web components
    if (!el._wcElements) {
      const wcSelectors = parseClasses(cfg.wc, []);
      el._wcElements = wcSelectors.flatMap((sel: string) =>
        Array.from(el.querySelectorAll(sel))
      );
    }

    // initialize progress tracking
    el._targetProgress = 0;
    el._currentProgress = 0;

    // parse animation config
    const animationStr = el.getAttribute("data-animation");
    if (animationStr) {
      const isStagger = animationStr.includes(":[");
      const isMultiBreakpointStagger = animationStr.includes("]:");

      if (isMultiBreakpointStagger) {
        el._multiStaggerConfig =
          this.parser.parseMultiBreakpointStagger(animationStr);
        el._staggerConfig = this.getActiveStaggerConfig(el._multiStaggerConfig);
        el._animationConfig = null;
      } else if (isStagger) {
        el._staggerConfig = this.parser.parseStaggerAnimation(animationStr);
        el._animationConfig = null;
      } else {
        el._animationConfig = this.parser.parseAnimation(animationStr);
        el._staggerConfig = null;
      }
    } else {
      el._animationConfig = null;
      el._staggerConfig = null;
    }
    el._animeInstance = null;
    el._staggerChildren = [];

    // Apply initial visual state after animation config is parsed
    this._applyInitialVisualState(el);
  }

  private _setupAnimationConfig(el: ScrollElement): void {
    // Setup stagger children and transitions if stagger config exists
    if (el._staggerConfig) {
      const staggerConfig = el._staggerConfig;
      if (!el._staggerChildren || el._staggerChildren.length === 0) {
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

        el._staggerChildren = children;

        // Apply transition styles to all stagger children (visual state already applied in _applyInitialVisualState)
        children.forEach((child) => {
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
    }

    // Setup transition styles for regular animations (visual state already applied in _applyInitialVisualState)
    if (el._animationConfig) {
      const config = el._animationConfig!;

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
  }

  public getElements(): ScrollElement[] {
    return Array.from(this.elements.values());
  }

  public getActiveElements(): ScrollElement[] {
    return Array.from(this.activeElements);
  }

  public destroy(): void {
    this.intersectionObserver.disconnect();
    this.elements.clear();
  }

  private getActiveStaggerConfig(
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
}
