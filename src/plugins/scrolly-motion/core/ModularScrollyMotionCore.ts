/**
 * Modular ScrollyMotion Core Class
 * Implements the API specified in TODO.md:
 * new ScrollyMotion() - minimal core only
 * new ScrollyMotion(timeline, physics) - with specific features
 * new ScrollyMotion(timeline, physics, config) - with configuration
 */

import type {
  ScrollAnimatorConfig,
  ScrollyMotionMetrics,
  TimelineStep,
} from "../types";
import { DEFAULT_CONFIG } from "../utils/constants";
import { debounce, initializeMediaQueries } from "../utils/helpers";
import { validateConfig } from "../utils/validation";
import { Parser } from "./Parser";
import { Animation } from "./Animation";
import { ThemeManager } from "./ThemeManager";
import { ElementManager } from "./ElementManager";
import { EventManager } from "./EventManager";
import { PluginManager } from "./PluginManager";
import type { ScrollyMotionPlugin } from "./PluginManager";
import type { ScrollyMotionModule } from "../modules/ModuleInterface";

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
  private modules: ScrollyMotionModule[];

  private parser: Parser;
  private animation: Animation;
  private themeManager: ThemeManager;
  private elementManager: ElementManager;
  private eventManager: EventManager;
  private pluginManager: PluginManager;

  constructor(...args: any[]) {
    // Parse arguments according to TODO.md API
    const { modules, config } = this.parseConstructorArgs(args);

    this.modules = modules;
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

    // Initialize core modules
    const timelinePresets = this.initializePresets(sanitizedConfig.presets);
    this.parser = new Parser(
      timelinePresets,
      this.mediaQueries,
      this.pluginManager
    );
    this.animation = new Animation();
    this.themeManager = new ThemeManager();
    this.elementManager = new ElementManager(
      sanitizedConfig,
      this.parser,
      this.animation,
      this.themeManager,
      this.mediaQueries
    );

    // Initialize feature modules
    this.initializeModules();

    this.init();
  }

  private parseConstructorArgs(args: any[]): {
    modules: ScrollyMotionModule[];
    config: ScrollAnimatorConfig;
  } {
    const modules: ScrollyMotionModule[] = [];
    let config: ScrollAnimatorConfig = {};

    // Parse arguments based on TODO.md patterns:
    // new ScrollyMotion() - no args, minimal core
    // new ScrollyMotion(timeline, physics) - modules only
    // new ScrollyMotion(timeline, physics, config) - modules + config
    // new ScrollyMotion(config) - config only (backward compatibility)

    if (args.length === 0) {
      // Minimal core only
      return { modules, config };
    }

    // Check if last argument is a config object
    const lastArg = args[args.length - 1];
    const isLastArgConfig =
      lastArg &&
      typeof lastArg === "object" &&
      !lastArg.name && // modules have a name property
      !Array.isArray(lastArg) &&
      typeof lastArg !== "function"; // modules are functions

    if (isLastArgConfig) {
      config = lastArg;
      // All other args are modules (factory functions)
      for (let i = 0; i < args.length - 1; i++) {
        const arg = args[i];
        if (typeof arg === "function") {
          // It's a factory function, call it to get the module instance
          const moduleInstance = arg();
          if (moduleInstance && moduleInstance.name) {
            modules.push(moduleInstance);
          }
        } else if (arg && typeof arg === "object" && arg.name) {
          // It's already a module instance
          modules.push(arg);
        }
      }
    } else {
      // All args are modules, or single config for backward compatibility
      if (
        args.length === 1 &&
        typeof args[0] === "object" &&
        !args[0].name &&
        typeof args[0] !== "function"
      ) {
        // Single argument that's not a module = config (backward compatibility)
        config = args[0];
      } else {
        // All arguments are modules (factory functions or instances)
        for (const arg of args) {
          if (typeof arg === "function") {
            // It's a factory function, call it to get the module instance
            const moduleInstance = arg();
            if (moduleInstance && moduleInstance.name) {
              modules.push(moduleInstance);
            }
          } else if (arg && typeof arg === "object" && arg.name) {
            // It's already a module instance
            modules.push(arg);
          }
        }
      }
    }

    console.log(
      "🔧 ScrollyMotion: Parsed modules:",
      modules.map((m) => m.name)
    );
    return { modules, config };
  }

  private initializeModules(): void {
    // Initialize each module
    this.modules.forEach((module) => {
      if (module.init) {
        module.init(this);
      }
    });
  }

  private hasModule(moduleName: string): boolean {
    return this.modules.some((module) => module.name === moduleName);
  }

  destroy(): void {
    // Destroy modules first
    this.modules.forEach((module) => {
      if (module.destroy) {
        module.destroy();
      }
    });

    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("scroll", this.onScroll);
    this.elementManager.destroy();
    this.eventManager.destroy();
    this.pluginManager.destroy();
  }

  init(): void {
    const initElements = () => {
      this.elementManager.discoverElements();
      const elements = this.elementManager.getElements();

      if (elements.length > 0) {
        this.elementManager.measureElements();

        // Initialize all elements with progress = 0 to ensure they start in their initial state
        elements.forEach((el) => {
          el._currentProgress = 0;
          el._targetProgress = 0;
          el._hasStartedAnimating = false;
          el.style.setProperty("--element-progress", "0.000");
        });

        this.updateScroll();
        setTimeout(() => {
          this.updateScroll();
        }, 50);
      }
    };

    if (document.readyState === "loading") {
      window.addEventListener("DOMContentLoaded", initElements);
    } else {
      initElements();
    }

    window.addEventListener("resize", this.onResize);
    window.addEventListener("scroll", this.onScroll, { passive: true });
  }

  onScroll(): void {
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
      const { _enterAt, _distance, _exitAt, _once } = el;
      const targetProgress = Math.min(
        1,
        Math.max(0, (scrollY - _enterAt) / _distance)
      );

      el._targetProgress = targetProgress;
      el._currentProgress = targetProgress;

      el.style.setProperty("--element-progress", targetProgress.toFixed(3));

      const hasEntered = targetProgress > 0;
      const hasExited = scrollY > _exitAt;
      const inView = hasEntered && !hasExited;

      // Only handle themes if themes module is loaded
      if (el._theme && this.hasModule("themes")) {
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
        if (_once && el._hasEnteredOnce) {
          // If once and has entered, do nothing.
        } else {
          el._enterClassNames.forEach((c) => el.classList.remove(c));
          el._leaveClassNames.forEach((c) => el.classList.add(c));
        }
      }

      // Only handle web components if webcomponents module is loaded
      if (this.hasModule("webcomponents")) {
        el._wcElements.forEach((wcEl) => {
          const comp = wcEl as ProgressWebComponent;
          if (typeof comp.progress === "function") {
            if (comp._lastProgress !== targetProgress) {
              comp.progress(targetProgress);
              comp._lastProgress = targetProgress;
            }
          }
          if (typeof comp.enter === "function") {
            const nowInView = inView;
            if (comp._lastInView !== nowInView) {
              if (nowInView && typeof comp.enter === "function") comp.enter();
              if (!nowInView && typeof comp.leave === "function") comp.leave();
              comp._lastInView = nowInView;
            }
          }
        });
      }

      // Run modules with the target progress
      this.modules.forEach((module) => {
        if (module.updateElement) {
          module.updateElement(el, targetProgress);
        }
      });
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

    Object.entries(customPresets).forEach(([name, steps]) => {
      presets.set(name, steps);
    });

    return presets;
  }

  getMetrics(): ScrollyMotionMetrics {
    const elements = this.elementManager.getElements();
    const activeElements = elements.filter(
      (el) => el._animationConfig || el._staggerConfig
    ).length;

    const memoryUsage = elements.length * 0.5 + activeElements * 1.2;
    const gpuAccelerated = "transform" in document.createElement("div").style;

    return {
      fps: 60,
      activeElements,
      memoryUsage,
      gpuAccelerated,
    };
  }

  // Public API for getting loaded modules
  public getModules(): ScrollyMotionModule[] {
    return [...this.modules];
  }

  // Public API for checking if a module is loaded
  public hasModuleLoaded(moduleName: string): boolean {
    return this.hasModule(moduleName);
  }

  // ScrollyMotionCore interface methods required by modules
  public getElements() {
    return this.elementManager.getElements();
  }

  public getActiveElements() {
    return this.elementManager.getActiveElements();
  }

  public emit(eventName: string, ...args: any[]): void {
    this.eventManager.emit(eventName, ...args);
  }
}
