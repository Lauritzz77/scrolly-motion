/**
 * ScrollyMotion Plugin Manager
 * Manages custom animation properties and behaviors.
 */

export interface ScrollyMotionPlugin {
  name: string;
  parse: (property: string, value: string) => any;
}

export class PluginManager {
  private plugins: Map<string, ScrollyMotionPlugin>;

  constructor() {
    this.plugins = new Map();
  }

  public register(plugin: ScrollyMotionPlugin): void {
    if (this.plugins.has(plugin.name)) {
      console.warn(
        `ScrollyMotion: Plugin "${plugin.name}" is already registered.`
      );
      return;
    }
    this.plugins.set(plugin.name, plugin);
  }

  public getPlugin(name: string): ScrollyMotionPlugin | undefined {
    return this.plugins.get(name);
  }

  public parse(property: string, value: string): any {
    for (const plugin of this.plugins.values()) {
      const result = plugin.parse(property, value);
      if (result !== undefined) {
        return result;
      }
    }
    return undefined;
  }

  public destroy(): void {
    this.plugins.clear();
  }
}
