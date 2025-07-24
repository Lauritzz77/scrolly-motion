# @laubloch/scrolly-motion

[![npm version](https://badge.fury.io/js/%40laubloch%2Fscrolly-motion.svg)](https://badge.fury.io/js/%40laubloch%2Fscrolly-motion)

Performant and advanced scroll animation system with breakpoint support, timeline presets, stagger animations, and physics damping.

## **Current Size Estimate**

- **ES Module**: ~37 KB (minified) / ~9 KB (gzipped)
- **UMD Module**: ~27 KB (minified) / ~8 KB (gzipped)

## Installation

```bash
npm install @laubloch/scrolly-motion
```

## Quick Start

```typescript
import { ScrollyMotion } from "@laubloch/scrolly-motion";

// Initialize with default settings
const scrollyMotion = new ScrollyMotion();

// Or with custom configuration
const scrollyMotion = new ScrollyMotion({
  selector: "[data-scroll], [data-animation]",
  defaultEnter: "50vh",
  breakpoints: {
    mobile: "(max-width: 767px)",
    tablet: "(min-width: 768px) and (max-width: 1023px)",
    desktop: "(min-width: 1024px)",
  },
  presets: {
    fadeInUp: [
      { at: 0, properties: { opacity: 0, translateY: 50 } },
      { at: 1, properties: { opacity: 1, translateY: 0 } },
    ],
  },
});
```

## Basic Usage

### Simple Animations

```html
<!-- Fade in from bottom -->
<div data-animation="from:opacity-0|translateY-50 to:opacity-100|translateY-0">
  Content
</div>

<!-- Scale and rotate -->
<div data-animation="from:scale-0|rotate-45; to:scale-1|rotate-0">Content</div>
```

### Breakpoint Animations

```html
<!-- Different animations for different screen sizes -->
<div
  data-animation="
  @desktop:from:opacity-0|translateX-100; to:opacity-100|translateX-0;
  @mobile:from:opacity-0|translateY-20; to:opacity-100|translateY-0; 
"
>
  Mobile: slides up, Desktop: slides from right
</div>
```

### Preset Animations

```html
<!-- Use predefined animation presets -->
<div data-animation="preset:fadeInUp">Uses fadeInUp preset animation</div>
```

### Stagger Animations

```html
<!-- Animate children with stagger delay -->
<div
  data-animation="[&>li]:from:opacity-0|translateY-20; to:opacity-100|translateY-0|stagger-0.1;"
>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
</div>
```

```html
<!-- Animate mix children with stagger delay -->
<div
  data-animation="[&>p,span,div]:from:opacity-0|translateY-20; to:opacity-100|translateY-0|stagger-0.1;"
>
  <p>Item 1</p>
  <span>Item 2</span>
  <div>Item 3</div>
</div>
```

### Physics Damping

```html
<!-- Smooth, physics-based animation -->
<div
  data-scroll="damping:0.1; friction:0.95"
  data-animation="from:opacity-0|translateY-50; to:opacity-100|translateY-0"
>
  Smooth physics animation
</div>
```

## Animation Properties

### Transform Properties

- `translateX`, `translateY`, `translateZ`: Movement (supports px, %, vh, vw, rem, em)
- `scale`, `scaleX`, `scaleY`: Scaling (0-9999)
- `rotate`, `rotateX`, `rotateY`, `rotateZ`: Rotation (degrees)
- `skewX`, `skewY`: Skewing (degrees)
- `perspective`: Perspective (px)

### Filter and Other Properties

- `opacity`: (0-100 range)
- `blur`: (px)
- `grayscale`: (0-100 range)
- `letter-spacing`: (px)

### Value Formats

#### Tailwind-style Values

```html
<!-- Tailwind spacing: number * 4px -->
<div data-animation="from:translateY-12; to:translateY-0;">
  <!-- translateY: 48px to 0px -->
</div>

<!-- Tailwind spacing: number * 4px negative -->
<div data-animation="from:translateY--12; to:translateY-0;">
  <!-- translateY: -48px to 0px -->
</div>

<!-- Tailwind opacity: number * 0.01 -->
<div data-animation="from:opacity-50; to:opacity-100;">
  <!-- opacity: 0.5 to 1.0 -->
</div>
```

#### Arbitrary Values

When adding Arbitrary Values always use same units

```html
<!-- Custom values with units -->
<div
  data-animation="from:translateY-[100px]; via-50%:translateY-[-100px]; to:translateY-[0px];"
>
  Custom pixel values and timeline
</div>

<div data-animation="from:translateY-[50vh]; to:translateY-[0vh];">
  Viewport height values
</div>
```

## Configuration Options

### ScrollyMotion Constructor

```typescript
interface ScrollAnimatorConfig {
  selector?: string; // Element selector
  defaultEnter?: string; // Default enter offset
  breakpoints?: Record<string, string>; // Media queries
  presets?: Record<string, TimelineStep[]>; // Animation presets
}
```

### Element Configuration (data-scroll)

```html
<div
  data-scroll="
  enter: 50vh;        <!-- Enter offset -->
  exit: 0vh;          <!-- Exit offset -->
  distance: 200px;    <!-- Animation distance -->
  once: true;         <!-- Animate only once -->
  damping: 0.1;       <!-- Physics damping (0-1) -->
  friction: 0.95;     <!-- Physics friction (0-1) -->
  enterClass: fade-in;     <!-- Enter class will be removed if once: false-->
  leaveClass: fade-out; <!-- Leave class -->
  theme: dark;        <!-- Body theme attribute -->
"
></div>
```

#### Enter Behavior Explained

The `enter` parameter controls when an element triggers its enter state (applies `enterClass` and removes `leaveClass`):

- `enter: 0vh` - Element enters when its **top** reaches the **bottom** of the viewport
- `exit: 25vh` - Element enters when its **top** is 25vh from the **bottom** of the viewport
- `exit: 50vh` - Element enters when its **top** is 50vh from the **bottom** of the viewport
- `exit: 100vh` - Element enters when its **top** is 100vh reaches the **top** of the viewport

#### Exit Behavior Explained

The `exit` parameter controls when an element triggers its exit state (applies `leaveClass` and removes `enterClass`):

- `exit: 0vh` - Element exits when its **bottom** reaches the **top** of the viewport
- `exit: 25vh` - Element exits when its **bottom** is 25vh from the **top** of the viewport
- `exit: 50vh` - Element exits when its **bottom** is 50vh from the **top** of the viewport
- `exit: 100vh` - Element exits when its **bottom** reaches the **bottom** of the viewport

```html
<!-- Examples of different exit behaviors -->
<div data-scroll="exit: 0vh; enterClass: active; leaveClass: inactive;">
  Exits immediately when bottom leaves top of viewport
</div>

<div data-scroll="exit: 100vh; enterClass: active; leaveClass: inactive;">
  Exits when bottom reaches bottom of viewport (stays active longer)
</div>
```

## Advanced Features

### Custom Timeline Presets

```typescript
const ScrollyMotion = new ScrollyMotion({
  presets: {
    bounceIn: [
      { at: 0, properties: { opacity: 0, scale: 0.3 } },
      { at: 0.5, properties: { opacity: 1, scale: 1.05 } },
      { at: 0.7, properties: { scale: 0.9 } },
      { at: 1, properties: { scale: 1 } },
    ],
    slideInLeft: [
      { at: 0, properties: { opacity: 0, translateX: -100 } },
      { at: 1, properties: { opacity: 1, translateX: 0 } },
    ],
  },
});
```

```html
<!-- Use custom presets -->
<div data-animation="preset:bounceIn">Bounce animation</div>
<div data-animation="preset:slideInLeft">Slide from left</div>
```

### Performance Monitoring

```typescript
// Get performance metrics
const metrics = ScrollyMotion.getMetrics();
console.log("FPS:", metrics.fps);
console.log("Active elements:", metrics.activeElements);
console.log("Memory usage:", metrics.memoryUsage, "MB");
console.log("GPU accelerated:", metrics.gpuAccelerated);
```

## Web Component Usage

ScrollyMotion can animate and interact with custom Web Components. To enable this, simply use your Web Component in the DOM and target it with `data-scroll` or `data-animation` attributes.

```html
<!-- Example: Parent div with data-scroll and wc:my-animated-card -->
<div data-scroll="enter: 50vh; distance: 50vh; wc:my-animated-card;">
  <my-animated-card>Card Content</my-animated-card>
</div>
```

### Progress API for Web Components

If your Web Component exposes a `progress` method, ScrollyMotion will automatically call it with the current scroll progress (0–1):

```js
class MyAnimatedCard extends HTMLElement {
  progress(value) {
    // Use value (0–1) to update animation state
    this.style.setProperty("--scroll-progress", value.toString());
    this.style.opacity = value.toString();
    this.style.transform = `scale(${0.8 + 0.2 * value})`;
    // You can add more custom animation logic here
  }
}
customElements.define("my-animated-card", MyAnimatedCard);
```

This allows you to create custom, scroll-driven animations inside your Web Components, fully integrated with ScrollyMotion ’s animation system.

## Browser Support

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 79

## Event System

ScrollyMotion fires events at key lifecycle moments, allowing you to hook into the animation process.

- `elementEnter`: Fired when an element enters the viewport.
- `elementLeave`: Fired when an element leaves the viewport.

**Usage:**

```typescript
const scrollyMotion = new ScrollyMotion();

scrollyMotion.on("elementEnter", (element) => {
  console.log("Element entered:", element);
});

scrollyMotion.on("elementLeave", (element) => {
  console.log("Element left:", element);
});
```

## Plugin System

ScrollyMotion has a plugin system that allows you to extend the library with custom animation properties and behaviors.

**Example Plugin: Custom Bounce Effect**

This example demonstrates how to create a plugin that adds a custom `bounceY` animation property.

**1. Create the Plugin**

```typescript
const bouncePlugin = {
  name: "bounceEffects",
  parse: (property, value) => {
    if (property === "bounceY") {
      // Convert bounce intensity to actual translateY values
      const intensity = parseFloat(value) || 10;
      return intensity; // This will be used by the animation system
    }
    return undefined;
  },
};
```

**2. Register the Plugin**

```typescript
// Initialize ScrollyMotion
const scrollyMotion = new ScrollyMotion();

// Register the custom plugin
scrollyMotion.registerPlugin(bouncePlugin);
```

**3. Use the Custom Property in HTML**

Now you can use the `bounceY` property in your `data-animation` attributes.

```html
<div data-animation="from:bounceY-20|opacity-0 to:bounceY-0|opacity-100">
  This element will bounce in from 20px above.
</div>
```
