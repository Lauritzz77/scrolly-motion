/**
 * Warning system for missing modules
 * Detects when HTML attributes suggest a module should be present but isn't loaded
 */

export interface ModuleWarning {
  moduleName: string;
  description: string;
  importExample: string;
  usageExample: string;
}

export class WarningSystem {
  private warnedModules = new Set<string>();
  private loadedModules = new Set<string>();

  /**
   * Register a loaded module
   */
  registerModule(moduleName: string): void {
    this.loadedModules.add(moduleName);
  }

  /**
   * Check if a module is loaded
   */
  isModuleLoaded(moduleName: string): boolean {
    return this.loadedModules.has(moduleName);
  }

  /**
   * Warn about a missing module (only once per module)
   */
  warnMissingModule(moduleName: string, context?: string): void {
    if (
      this.warnedModules.has(moduleName) ||
      this.loadedModules.has(moduleName)
    ) {
      return;
    }

    this.warnedModules.add(moduleName);

    const warning = this.getModuleWarning(moduleName);
    if (warning) {
      const contextMsg = context ? ` Found in: ${context}` : "";
      console.warn(
        `ScrollyMotion: Found ${warning.description} but '${moduleName}' module not loaded.${contextMsg}\n` +
          `   Import: ${warning.importExample}\n` +
          `   Usage: ${warning.usageExample}`
      );
    }
  }

  /**
   * Get warning details for a specific module
   */
  private getModuleWarning(moduleName: string): ModuleWarning | null {
    const warnings: Record<string, ModuleWarning> = {
      timeline: {
        moduleName: "timeline",
        description: "animation syntax",
        importExample:
          "import { ScrollyMotion, timeline } from '@laubloch/scrolly-motion'",
        usageExample: "new ScrollyMotion([timeline()])",
      },
      physics: {
        moduleName: "physics",
        description: "physics properties (damping, friction)",
        importExample:
          "import { ScrollyMotion, physics } from '@laubloch/scrolly-motion'",
        usageExample: "new ScrollyMotion([physics()])",
      },
      stagger: {
        moduleName: "stagger",
        description: "stagger animation syntax",
        importExample:
          "import { ScrollyMotion, stagger } from '@laubloch/scrolly-motion'",
        usageExample: "new ScrollyMotion([stagger()])",
      },
      theme: {
        moduleName: "theme",
        description: "theme switching properties",
        importExample:
          "import { ScrollyMotion, theme } from '@laubloch/scrolly-motion'",
        usageExample: "new ScrollyMotion([theme()])",
      },
      webcomponents: {
        moduleName: "webcomponents",
        description: "web component integration syntax",
        importExample:
          "import { ScrollyMotion, webcomponents } from '@laubloch/scrolly-motion'",
        usageExample: "new ScrollyMotion([webcomponents()])",
      },
    };

    return warnings[moduleName] || null;
  }

  /**
   * Detect missing modules from HTML attributes
   */
  detectMissingModules(element: HTMLElement): void {
    const dataAnimation = element.getAttribute("data-animation");
    const dataScroll = element.getAttribute("data-scroll");

    // Check for timeline module needs
    if (dataAnimation && !this.isModuleLoaded("timeline")) {
      // Check for animation syntax patterns
      if (this.hasAnimationSyntax(dataAnimation)) {
        this.warnMissingModule("timeline", `data-animation="${dataAnimation}"`);
      }
    }

    // Check for stagger module needs
    if (dataAnimation && !this.isModuleLoaded("stagger")) {
      // Check for stagger syntax patterns like [&>li]: or [&>div,span]:
      if (this.hasStaggerSyntax(dataAnimation)) {
        this.warnMissingModule("stagger", `data-animation="${dataAnimation}"`);
      }
    }

    // Check for physics module needs
    if (dataScroll && !this.isModuleLoaded("physics")) {
      // Check for physics properties
      if (this.hasPhysicsSyntax(dataScroll)) {
        this.warnMissingModule("physics", `data-scroll="${dataScroll}"`);
      }
    }

    // Check for theme module needs
    if (dataScroll && !this.isModuleLoaded("theme")) {
      // Check for theme properties
      if (this.hasThemeSyntax(dataScroll)) {
        this.warnMissingModule("theme", `data-scroll="${dataScroll}"`);
      }
    }

    // Check for webcomponents module needs
    if (dataScroll && !this.isModuleLoaded("webcomponents")) {
      // Check for web component properties
      if (this.hasWebComponentSyntax(dataScroll)) {
        this.warnMissingModule("webcomponents", `data-scroll="${dataScroll}"`);
      }
    }
  }

  /**
   * Check if string contains animation syntax
   */
  private hasAnimationSyntax(str: string): boolean {
    // Look for patterns like:
    // - from:opacity-0
    // - to:translateY-50
    // - via-50%:scale-1.1
    // - timeline:from:opacity-0
    // - preset:fadeInUp
    return /(?:^|;|\s)(?:from|to|via-\d+%|timeline|preset):/i.test(str);
  }

  /**
   * Check if string contains stagger syntax
   */
  private hasStaggerSyntax(str: string): boolean {
    // Look for patterns like:
    // - [&>li]:from:opacity-0
    // - [&>div,span]:to:translateY-0
    return /\[&>[^\]]+\]:/i.test(str);
  }

  /**
   * Check if string contains physics syntax
   */
  private hasPhysicsSyntax(str: string): boolean {
    // Look for patterns like:
    // - damping:0.1
    // - friction:0.95
    return /(?:^|;|\s)(?:damping|friction):/i.test(str);
  }

  /**
   * Check if string contains theme syntax
   */
  private hasThemeSyntax(str: string): boolean {
    // Look for patterns like:
    // - theme:dark
    // - theme:light
    return /(?:^|;|\s)theme:/i.test(str);
  }

  /**
   * Check if string contains web component syntax
   */
  private hasWebComponentSyntax(str: string): boolean {
    // Look for patterns like:
    // - wc:my-component
    return /(?:^|;|\s)wc:/i.test(str);
  }

  /**
   * Reset warned modules (useful for testing)
   */
  reset(): void {
    this.warnedModules.clear();
    this.loadedModules.clear();
  }
}

// Global warning system instance
export const warningSystem = new WarningSystem();
