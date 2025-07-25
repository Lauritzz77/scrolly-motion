# @laubloch/scrolly-motion

[![npm version](https://badge.fury.io/js/%40laubloch%2Fscrolly-motion.svg)](https://badge.fury.io/js/%40laubloch%2Fscrolly-motion)

Performant and advanced scroll animation system with **modular architecture**, breakpoint support, timeline presets, and stagger animations.

**[🚀 Try it out! Live Demo 🚀](https://lauritzz77.github.io/scrolly-motion/)**

## **Modular Architecture - Load Only What You Need**

ScrollyMotion now features a **modular system** that allows you to import only the features you need, significantly reducing bundle size:

- **Minimal Core**: ~15 KB (just progress tracking and basic animations)
- **With Timeline**: ~25 KB (adds complex timeline animations)
- **Full Featured**: ~37 KB (all modules included)

## Installation

```bash
npm install @laubloch/scrolly-motion
```

## Modular Usage Examples

### 🎯 **Minimal Setup** (Smallest Bundle)

Perfect for simple scroll progress tracking and basic up/down detection:

```typescript
import { ScrollyMotion } from "@laubloch/scrolly-motion";

// Only provides --element-progress CSS variable and basic scroll detection
const scrolly = new ScrollyMotion();
```

**What you get:**

- ✅ `--element-progress` CSS variable (0-1)
- ✅ Basic scroll enter/exit detection
- ✅ Element classes (enterClass/leaveClass)
- ❌ No timeline animations
- ❌ No stagger effects

### 🎬 **With Timeline Support**

Add complex timeline animations with keyframes:

```typescript
import { ScrollyMotion, timeline } from "@laubloch/scrolly-motion";

// Adds timeline animation parsing and execution
const scrolly = new ScrollyMotion(timeline);
```

**What you get:**

- ✅ Everything from minimal core
- ✅ Timeline animations (`from:`, `to:`, `via-50%:`)
- ✅ Animation presets
- ✅ Complex keyframe animations
- ❌ No stagger effects

### 🎭 **With Stagger Effects**

Add staggered animations for child elements:

```typescript
import { ScrollyMotion, timeline, stagger } from "@laubloch/scrolly-motion";

// Adds stagger animation support
const scrolly = new ScrollyMotion(timeline, stagger);
```

**What you get:**

- ✅ Everything from timeline
- ✅ Stagger animations (`[&>li]:` syntax)
- ✅ Child element animations with delays

### 🎨 **With Theme Support**

Add dynamic theme switching based on scroll position:

```typescript
import { ScrollyMotion, timeline, theme } from "@laubloch/scrolly-motion";

// Adds theme switching capabilities
const scrolly = new ScrollyMotion(timeline, theme);
```

**What you get:**

- ✅ Everything from timeline
- ✅ Dynamic theme switching
- ✅ Body attribute management
- ❌ No stagger

### 🧩 **With Web Components**

Add support for custom web component integration:

```typescript
import {
  ScrollyMotion,
  timeline,
  webComponents,
} from "@laubloch/scrolly-motion";

// Adds web component progress API
const scrolly = new ScrollyMotion(timeline, webComponents);
```

**What you get:**

- ✅ Everything from timeline
- ✅ Web component `progress()` method calls
- ✅ Custom element integration
- ❌ No stagger

### 🚀 **Full Featured Setup**

Include all modules for maximum functionality:

```typescript
import {
  ScrollyMotion,
  timeline,
  stagger,
  themes,
  webcomponents,
} from "@laubloch/scrolly-motion";

// Full-featured ScrollyMotion with all capabilities
const scrolly = new ScrollyMotion(timeline, stagger, themes, webcomponents);
```

**What you get:**

- ✅ All features enabled
- ✅ Maximum flexibility
- ✅ Complete animation system

## Legacy Configuration Support

The traditional configuration object is still fully supported:

```typescript
import { ScrollyMotion, timeline } from "@laubloch/scrolly-motion";

const scrolly = new ScrollyMotion(timeline, {
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

## Basic Usage Examples

### Simple Progress Tracking (Minimal Core)

```html
<!-- Works with minimal core -->
<div data-scroll="enter: 50vh;">
  <div
    class="progress-bar"
    style="transform: scaleX(var(--element-progress))"
  ></div>
</div>
```

### Timeline Animations (Requires Timeline Module)

```html
<!-- Requires timeline module -->
<div data-animation="from:opacity-0|translateY-50 to:opacity-100|translateY-0">
  Fade in from bottom
</div>

<!-- Complex timeline -->
<div data-animation="timeline:from:scale-0; via-50%:scale-1.2; to:scale-1">
  Bounce scale effect
</div>
```

### Stagger Animations (Requires Stagger Module)

```html
<!-- Requires stagger module -->
<div
  data-animation="[&>li]:from:opacity-0|translateY-20; to:opacity-100|translateY-0|stagger-0.1;"
>
  <ul>
    <li>Item 1 (animates first)</li>
    <li>Item 2 (animates 0.1s later)</li>
    <li>Item 3 (animates 0.2s later)</li>
  </ul>
</div>
```

### Theme Switching (Requires Theme Module)

```html
<!-- Requires theme module -->
<div data-scroll="theme: dark;">
  When this element is in view, body gets data-theme="dark"
</div>
```

### Web Component Integration (Requires WebComponents Module)

```html
<!-- Requires webComponents module -->
<div data-scroll="wc:my-progress-card;">
  <my-progress-card></my-progress-card>
</div>
```

```javascript
// Your web component
class MyProgressCard extends HTMLElement {
  progress(value) {
    // Called automatically with scroll progress (0-1)
    this.style.setProperty("--progress", value);
  }
}
```

## Breakpoint Animations

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

<!-- Tailwind opacity: number * 0.01 -->
<div data-animation="from:opacity-50; to:opacity-100;">
  <!-- opacity: 0.5 to 1.0 -->
</div>
```

#### Arbitrary Values

```html
<!-- Custom values with units -->
<div data-animation="from:translateY-[100px]; to:translateY-[0px];">
  Custom pixel values
</div>

<div data-animation="from:translateY-[50vh]; to:translateY-[0vh];">
  Viewport height values
</div>
```

## Configuration Options

### Element Configuration (data-scroll)

```html
<div
  data-scroll="
  enter: 50vh;        <!-- Enter offset -->
  exit: 0vh;          <!-- Exit offset -->
  distance: 200px;    <!-- Animation distance -->
  once: true;         <!-- Animate only once -->
  enterClass: fade-in;     <!-- Enter class -->
  leaveClass: fade-out;    <!-- Leave class -->
  theme: dark;        <!-- Body theme (requires theme module) -->
  wc: my-component;   <!-- Web component selector (requires webComponents module) -->
"
></div>
```

## Advanced Features

### Custom Timeline Presets

```typescript
import { ScrollyMotion, timeline } from "@laubloch/scrolly-motion";

const scrolly = new ScrollyMotion(timeline, {
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
const metrics = scrolly.getMetrics();
console.log("FPS:", metrics.fps);
console.log("Active elements:", metrics.activeElements);
console.log("Memory usage:", metrics.memoryUsage, "MB");
```

## Event System

```typescript
scrolly.on("elementEnter", (element) => {
  console.log("Element entered:", element);
});

scrolly.on("elementLeave", (element) => {
  console.log("Element left:", element);
});
```

## Plugin System

ScrollyMotion has a plugin system for custom animation properties:

```typescript
const bouncePlugin = {
  name: "bounceEffects",
  parse: (property, value) => {
    if (property === "bounceY") {
      const intensity = parseFloat(value) || 10;
      return intensity;
    }
    return undefined;
  },
};

// Register the plugin
scrolly.registerPlugin(bouncePlugin);
```

```html
<!-- Use custom property -->
<div data-animation="from:bounceY-20|opacity-0 to:bounceY-0|opacity-100">
  Custom bounce animation
</div>
```

## Bundle Size Comparison

| Setup           | Size (minified) | Size (gzipped) | Features                                  |
| --------------- | --------------- | -------------- | ----------------------------------------- |
| Minimal Core    | ~15 KB          | ~5 KB          | Progress tracking, basic scroll detection |
| + Timeline      | ~25 KB          | ~7 KB          | + Complex animations, presets             |
| + Stagger       | ~28 KB          | ~8 KB          | + Child element animations                |
| + Theme         | ~30 KB          | ~8.5 KB        | + Dynamic theme switching                 |
| + WebComponents | ~32 KB          | ~9 KB          | + Web component integration               |
| Full Featured   | ~35 KB          | ~9.5 KB        | All features                              |

## Browser Support

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 79+
