/**
 * Modular ScrollyMotion
 * A version of ScrollyMotion that accepts modules as constructor parameters
 */

import type { ScrollAnimatorConfig, ScrollElement } from "../types/index.js";
import type {
  ScrollyMotionModule,
  ScrollyMotionCore,
} from "../modules/ModuleInterface.js";
import { defaultModules } from "../modules/index.js";
import { EventManager } from "./EventManager.js";
import { debounce } from "../utils/helpers.js";
import { warningSystem } from "../utils/warnings.js";

export class ModularScrollyMotion implements ScrollyMotionCore {
  private config: ScrollAnimatorConfig;
  private modules: ScrollyMotionModule[] = [];
  private elements = new Set<ScrollElement>();
  private activeElements = new Set<ScrollElement>();
  private eventManager = new EventManager();
  private intersectionObserver: IntersectionObserver | null = null;
  private isInitialized = false;
  private debouncedUpdate: () => void;

  constructor(
    modules: (() => ScrollyMotionModule)[] = [],
    config: Partial<ScrollAnimatorConfig> = {}
  ) {
    // Use provided modules or default modules
    const moduleFactories = modules.length > 0 ? modules : defaultModules;

    // Initialize modules
    this.modules = moduleFactories.map((factory) => factory());

    // Initialize with merged config
    this.config = {
      selector: "[data-scroll], [data-animation]",
      defaultEnter: "50vh",
      breakpoints: {
        mobile: "(max-width: 767px)",
        tablet: "(min-width: 768px) and (max-width: 1023px)",
        desktop: "(min-width: 1024px)",
      },
      presets: {},
      ...config,
    };

    // Create debounced update function
    this.debouncedUpdate = debounce(() => this.updateElements(), 16);

    // Initialize modules
    this.initializeModules();

    // Auto-initialize
    this.init();
  }

  /**
   * Initialize modules
   */
  private initializeModules(): void {
    this.modules.forEach((module) => {
      try {
        // Register module with warning system
        warningSystem.registerModule(module.name);
        module.init(this);
      } catch (error) {
        console.warn(`Failed to initialize module ${module.name}:`, error);
      }
    });
  }

  /**
   * Initialize the library
   */
  init(): void {
    if (this.isInitialized) return;

    this.discoverElements();
    this.setupIntersectionObserver();
    this.setupEventListeners();

    this.isInitialized = true;
  }

  /**
   * Discover and parse elements
   */
  private discoverElements(): void {
    const selector = this.config.selector || "[data-scroll], [data-animation]";
    const elements = document.querySelectorAll(selector);

    elements.forEach((element) => {
      const scrollElement = element as ScrollElement;

      // Check for missing modules before parsing
      warningSystem.detectMissingModules(scrollElement);

      // Initialize element properties
      this.initializeElement(scrollElement);

      // Parse element with all modules
      this.modules.forEach((module) => {
        try {
          if (module.parseElement) {
            module.parseElement(scrollElement);
          }
        } catch (error) {
          console.warn(`Module ${module.name} failed to parse element:`, error);
        }
      });

      this.elements.add(scrollElement);
    });
  }

  /**
   * Initialize element with default properties
   */
  private initializeElement(element: ScrollElement): void {
    // Set default values
    element._enterAt = 0.5;
    element._distance = 1;
    element._exitAt = 0;
    element._once = false;
    element._enterClassNames = [];
    element._leaveClassNames = [];
    element._theme = null;
    element._wcElements = [];
    element._webComponents = null;
    element._lastProg = null;
    element._animationConfig = null;
    element._animeInstance = null;
    element._targetProgress = 0;
    element._currentProgress = 0;
    element._staggerConfig = null;
    element._multiStaggerConfig = null;
    element._staggerChildren = [];
    element._hasEnteredOnce = false;
    element._hasStartedAnimating = false;
  }

  /**
   * Setup intersection observer
   */
  private setupIntersectionObserver(): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const element = entry.target as ScrollElement;

          if (entry.isIntersecting) {
            this.activeElements.add(element);
          } else {
            this.activeElements.delete(element);
          }
        });

        this.debouncedUpdate();
      },
      {
        rootMargin: "50px",
        threshold: [0, 0.1, 0.5, 1],
      }
    );

    // Observe all elements
    this.elements.forEach((element) => {
      if (this.intersectionObserver) {
        this.intersectionObserver.observe(element);
      }
    });
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    window.addEventListener("scroll", this.debouncedUpdate, { passive: true });
    window.addEventListener("resize", this.debouncedUpdate, { passive: true });
  }

  /**
   * Update all active elements
   */
  private updateElements(): void {
    this.activeElements.forEach((element) => {
      const progress = this.calculateProgress(element);

      // Update element with all modules
      this.modules.forEach((module) => {
        try {
          if (module.updateElement) {
            module.updateElement(element, progress);
          }
        } catch (error) {
          console.warn(
            `Module ${module.name} failed to update element:`,
            error
          );
        }
      });
    });
  }

  /**
   * Calculate scroll progress for an element
   */
  private calculateProgress(element: ScrollElement): number {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Simple progress calculation (can be enhanced)
    const elementTop = rect.top;
    const elementHeight = rect.height;

    // Element is fully above viewport
    if (elementTop + elementHeight < 0) return 0;

    // Element is fully below viewport
    if (elementTop > windowHeight) return 0;

    // Calculate progress based on element position
    const progress = Math.max(
      0,
      Math.min(1, (windowHeight - elementTop) / (windowHeight + elementHeight))
    );

    return progress;
  }

  /**
   * Destroy the instance
   */
  destroy(): void {
    // Destroy modules
    this.modules.forEach((module) => {
      try {
        if (module.destroy) {
          module.destroy();
        }
      } catch (error) {
        console.warn(`Failed to destroy module ${module.name}:`, error);
      }
    });

    // Clean up observers and listeners
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }

    window.removeEventListener("scroll", this.debouncedUpdate);
    window.removeEventListener("resize", this.debouncedUpdate);

    // Clear collections
    this.elements.clear();
    this.activeElements.clear();
    this.modules = [];

    this.isInitialized = false;
  }

  /**
   * Event system methods (implementing ScrollyMotionCore interface)
   */
  on(eventName: string, handler: (...args: any[]) => void): void {
    this.eventManager.on(eventName, handler);
  }

  off(eventName: string, handler: (...args: any[]) => void): void {
    this.eventManager.off(eventName, handler);
  }

  emit(eventName: string, ...args: any[]): void {
    this.eventManager.emit(eventName, ...args);
  }

  /**
   * Get active elements
   */
  getActiveElements(): ScrollElement[] {
    return Array.from(this.activeElements);
  }

  /**
   * Get all elements
   */
  getAllElements(): ScrollElement[] {
    return Array.from(this.elements);
  }

  /**
   * Get elements (alias for getAllElements to match interface)
   */
  getElements(): ScrollElement[] {
    return this.getAllElements();
  }

  /**
   * Add a module dynamically
   */
  addModule(moduleFactory: () => ScrollyMotionModule): void {
    const module = moduleFactory();

    // Register module with warning system
    warningSystem.registerModule(module.name);

    module.init(this);
    this.modules.push(module);

    // Re-parse all elements with the new module
    this.elements.forEach((element) => {
      try {
        if (module.parseElement) {
          module.parseElement(element);
        }
      } catch (error) {
        console.warn(`Module ${module.name} failed to parse element:`, error);
      }
    });
  }

  /**
   * Remove a module
   */
  removeModule(moduleName: string): void {
    const moduleIndex = this.modules.findIndex((m) => m.name === moduleName);
    if (moduleIndex === -1) return;

    const module = this.modules[moduleIndex];
    try {
      if (module.destroy) {
        module.destroy();
      }
    } catch (error) {
      console.warn(`Failed to destroy module ${module.name}:`, error);
    }

    this.modules.splice(moduleIndex, 1);
  }

  /**
   * Get loaded modules
   */
  getModules(): ScrollyMotionModule[] {
    return [...this.modules];
  }
}
