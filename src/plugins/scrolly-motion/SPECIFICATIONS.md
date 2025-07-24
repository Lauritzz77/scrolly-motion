# ScrollyMotion Technical Specification

## 1. System Overview

### 1.1. Architecture

ScrollyMotion is a high-performance scroll animation library with a modular architecture designed for extensibility and maintainability. The core components are:

- **`ScrollyMotion`**: The main class that orchestrates all functionality.
- **`ElementManager`**: Manages the lifecycle of scroll elements, including discovery, initialization, and state management.
- **`EventManager`**: A simple event emitter for handling custom events.
- **`PluginManager`**: Manages custom animation properties and behaviors.
- **`Parser`**: Responsible for parsing `data-animation` and `data-scroll` attributes.
- **`Animation`**: Handles the calculation and application of animation values.
- **`Physics`**: Implements physics-based animations with damping and friction.
- **`ThemeManager`**: Manages theme changes based on the currently visible elements.

### 1.2. Core Concepts

- **Declarative Animations**: Animations are defined directly in the HTML using `data-animation` and `data-scroll` attributes.
- **Timeline System**: Complex animations can be defined using a timeline with multiple steps, each with its own set of properties.
- **Breakpoint-Specific Animations**: Different animations can be applied at different screen sizes using a responsive breakpoint system.
- **Stagger Animations**: Child elements can be animated with a delay, creating a staggered effect.
- **Physics-Based Damping**: Animations can be smoothed using a physics-based damping system, providing a more natural feel.
- **GPU Acceleration**: The library leverages hardware-accelerated CSS properties for smooth, performant animations.

### 1.3. Design Principles

- **Performance**: The library is designed to be highly performant, using techniques such as `requestAnimationFrame`, debouncing, and passive event listeners.
- **Modularity**: The codebase is divided into small, focused modules with clear responsibilities, making it easy to understand, maintain, and extend.
- **Flexibility**: The library provides a wide range of configuration options and animation properties, allowing for a high degree of customization.
- **Developer Experience**: The library is designed to be easy to use, with a simple, declarative API and comprehensive documentation.

## 2. API Specifications

### 2.1. `ScrollyMotion` Class

The main class for initializing and controlling the animation system.

**Constructor:**

```typescript
new ScrollyMotion(config: ScrollAnimatorConfig = {}): ScrollyMotion
```

**Configuration (`ScrollAnimatorConfig`):**

| Property       | Type                             | Description                                        | Default                                                                                                                  |
| :------------- | :------------------------------- | :------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `selector`     | `string`                         | The CSS selector for elements to animate.          | `"[data-scroll], [data-animation]"`                                                                                      |
| `breakpoints`  | `Record<string, string>`         | A map of breakpoint names to media queries.        | `{ mobile: "(max-width: 767px)", tablet: "(min-width: 768px) and (max-width: 1023px)", desktop: "(min-width: 1024px)" }` |
| `presets`      | `Record<string, TimelineStep[]>` | A map of animation preset names to timeline steps. | `{}`                                                                                                                     |
| `defaultEnter` | `string`                         | The default enter offset for animations.           | `"50vh"`                                                                                                                 |

**Methods:**

- **`init(): void`**: Initializes the library, discovers elements, and sets up event listeners.
- **`destroy(): void`**: Cleans up all event listeners, timers, and references to prevent memory leaks.
- **`getMetrics(): ScrollyMotionMetrics`**: Returns performance metrics, including FPS, active elements, and memory usage.
- **`on(eventName: string, handler: (...args: any[]) => void): void`**: Subscribes to an event.
- **`registerPlugin(plugin: ScrollyMotionPlugin): void`**: Registers a new plugin.

### 2.2. `data-scroll` Attribute

Configures the scroll behavior of an element.

| Property     | Type      | Description                                                                    |
| :----------- | :-------- | :----------------------------------------------------------------------------- |
| `enter`      | `string`  | The scroll position at which the animation starts (e.g., `"50vh"`, `"100px"`). |
| `exit`       | `string`  | The scroll position at which the animation ends.                               |
| `distance`   | `string`  | The distance over which the animation occurs.                                  |
| `once`       | `boolean` | If `true`, the animation only runs once.                                       |
| `damping`    | `number`  | The amount of damping to apply to the animation (0-1).                         |
| `friction`   | `number`  | The amount of friction to apply to the animation (0-1).                        |
| `enterClass` | `string`  | The class(es) to add when the element enters the viewport.                     |
| `leaveClass` | `string`  | The class(es) to add when the element leaves the viewport.                     |
| `theme`      | `string`  | The theme to apply to the `body` element when this element is in view.         |
| `wc`         | `string`  | A CSS selector for Web Components to which the progress should be passed.      |

### 2.3. `data-animation` Attribute

Defines the animation properties for an element.

**Syntax:**

```
[breakpoint]:[from|to|timeline|preset]:[properties]
```

**Examples:**

- **Simple Animation:** `from:opacity-0|translateY-50 to:opacity-100|translateY-0`
- **Breakpoint Animation:** `@desktop:from:translateX-100 @mobile:from:translateY-20`
- **Timeline Animation:** `timeline:from:opacity-0; via-50%:opacity-0.5; to:opacity-1`
- **Preset Animation:** `preset:fadeInUp`
- **Stagger Animation:** `[&>li]:from:opacity-0|translateY-20 to:opacity-100|translateY-0|stagger-0.1`

## 3. Animation System

### 3.1. Animation Parsing

The `Parser` class is responsible for parsing the `data-animation` attribute. It supports:

- **Simple from/to animations**: `from:prop-value to:prop-value`
- **Timeline animations**: `timeline:from:props; via-50%:props; to:props`
- **Preset animations**: `preset:presetName`
- **Breakpoint-specific animations**: `@breakpoint:animation`
- **Stagger animations**: `[selector]:animation`

### 3.2. Timeline System

The timeline system allows for complex, multi-step animations. Each step is defined by an `at` property (the progress point, 0-1) and a set of `properties`.

```typescript
interface TimelineStep {
  at: number;
  properties: Record<string, any>;
}
```

### 3.3. Value Interpolation

The `Animation` class interpolates values between keyframes based on the scroll progress. It supports:

- **Numeric values**: `0` to `100`
- **String values with units**: `"0px"` to `"100px"`, `"0vh"` to `"50vh"`
- **Colors**: (Future support)

## 4. Physics Engine

The `Physics` class implements a physics-based animation system with damping and friction.

- **Damping**: Smooths out animations by applying a damping force.
- **Friction**: Slows down animations over time.
- **Frame-Rate Independence**: The physics calculations are frame-rate independent, ensuring consistent animations across different devices.
- **Performance**: The physics loop only runs when there are active animations, and it is optimized for performance.

## 5. Breakpoint System

The breakpoint system allows for different animations to be applied at different screen sizes.

- **Configuration**: Breakpoints are defined in the `ScrollyMotion` constructor.
- **Media Queries**: The library uses `window.matchMedia` to detect the current breakpoint.
- **Specificity**: Breakpoints are applied in order of specificity (e.g., `desktop` overrides `tablet`).

## 6. Web Component Integration

ScrollyMotion can animate and interact with custom Web Components.

- **Progress API**: If a Web Component has a `progress(value: number)` method, ScrollyMotion will call it with the current scroll progress (0-1).
- **Lifecycle Methods**: Web Components can also have `enter()` and `leave()` methods that are called when the component enters or leaves the viewport.

## 7. Performance Specifications

- **FPS**: The library aims to maintain a consistent 60 FPS.
- **Memory Usage**: The library is designed to have a low memory footprint.
- **GPU Acceleration**: The library uses hardware-accelerated CSS properties (`transform`, `opacity`) for smooth animations.
- **Optimization**: The library uses `requestAnimationFrame`, debouncing, and passive event listeners to optimize performance.

## 8. Configuration Schema

The following is the complete configuration schema for the library.

```typescript
interface ScrollAnimatorConfig {
  selector?: string;
  breakpoints?: Record<string, string>;
  presets?: Record<string, TimelineStep[]>;
  defaultEnter?: string;
}

interface AnimationConfig {
  from: Record<string, any>;
  to: Record<string, any>;
  timeline?: TimelineStep[];
  breakpoint?: string;
  transitionDuration?: number;
  transitionEasing?: string;
}

interface StaggerConfig {
  selector: string;
  from: Record<string, any>;
  to: Record<string, any>;
  staggerDelay: number;
  timeline?: TimelineStep[];
  breakpoint?: string;
  transitionDuration?: number;
  transitionEasing?: string;
}
```

## 9. Error Handling

- **Invalid Configuration**: The library will log warnings to the console if invalid configuration options are provided.
- **Parsing Errors**: The `Parser` will gracefully handle parsing errors and log warnings to the console.
- **Runtime Errors**: The library includes `try-catch` blocks around critical operations to prevent runtime errors from breaking the application.

## 10. Event System

The `EventManager` class provides a simple event emitter for handling custom events.

- **`on(eventName: string, handler: EventHandler)`**: Subscribes to an event.
- **`off(eventName: string, handler: EventHandler)`**: Unsubscribes from an event.
- **`emit(eventName: string, ...args: any[])`**: Emits an event.

## 11. Plugin System

The `PluginManager` class allows developers to extend the library with custom animation properties and behaviors.

### `ScrollyMotionPlugin` Interface

```typescript
export interface ScrollyMotionPlugin {
  name: string;
  parse: (property: string, value: string) => any;
}
```

### Methods

- **`register(plugin: ScrollyMotionPlugin): void`**: Registers a new plugin.
- **`getPlugin(name: string): ScrollyMotionPlugin | undefined`**: Retrieves a registered plugin.

## 12. Browser Support

- **Chrome**: 51+
- **Firefox**: 55+
- **Safari**: 12.1+
- **Edge**: 79+
