/**
 * ScrollyMotion Event Manager
 * A simple event emitter for handling custom events.
 */

type EventHandler = (...args: any[]) => void;

export class EventManager {
  private events: Map<string, Set<EventHandler>>;

  constructor() {
    this.events = new Map();
  }

  public on(eventName: string, handler: EventHandler): void {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, new Set());
    }
    this.events.get(eventName)!.add(handler);
  }

  public off(eventName: string, handler: EventHandler): void {
    if (this.events.has(eventName)) {
      this.events.get(eventName)!.delete(handler);
    }
  }

  public emit(eventName: string, ...args: any[]): void {
    if (this.events.has(eventName)) {
      this.events.get(eventName)!.forEach((handler) => {
        try {
          handler(...args);
        } catch (e) {
          console.error(
            `ScrollyMotion: Error in event handler for "${eventName}"`,
            e
          );
        }
      });
    }
  }

  public destroy(): void {
    this.events.clear();
  }
}
