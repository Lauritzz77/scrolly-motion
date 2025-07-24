# ScrollyMotion

**Smooth scroll animations, made simple**

ScrollyMotion is a powerful, lightweight JavaScript library for creating stunning scroll-triggered animations with minimal effort. Built with TypeScript and optimized for performance, it offers an intuitive syntax that makes complex animations accessible to developers of all skill levels.

## ✨ Features

- 🎯 **Breakpoint Animations** - Different animations for different screen sizes
- ⏱️ **Timeline Presets** - Reusable animation sequences with complex timing
- 🎭 **Stagger Effects** - Animate multiple elements with cascading delays
- 🚀 **GPU Accelerated** - Hardware-accelerated transforms for smooth performance
- 📱 **Responsive** - Built-in breakpoint system for mobile-first design
- 🎨 **Physics Damping** - Natural, physics-based animation feel
- 🔧 **TypeScript Support** - Full type definitions included
- 🌐 **Framework Agnostic** - Works with any JavaScript framework or vanilla HTML

## 🚀 Quick Start

### Installation

```bash
npm install scrolly-motion
```

### Basic Usage

```javascript
import { ScrollyMotion } from "scrolly-motion";

// Initialize ScrollyMotion
new ScrollyMotion();
```

```html
<!-- Add animations to your HTML -->
<div data-animation="from:opacity-0|translateY-50; to:opacity-100|translateY-0">
  Hello ScrollyMotion!
</div>
```

## 📖 Documentation

Visit our comprehensive documentation site for detailed guides, API reference, and examples:

- **[Getting Started Guide](docs/getting-started.md)** - Installation and basic setup
- **[Animation Syntax](docs/animation-syntax.md)** - Learn the animation syntax
- **[Breakpoint System](docs/breakpoints.md)** - Responsive animations
- **[API Reference](docs/api-reference.md)** - Complete method documentation
- **[Examples](docs/examples.md)** - Real-world use cases and demos

## 🎨 Animation Examples

### Basic Animations

```html
<!-- Fade in from bottom -->
<div data-animation="from:opacity-0|translateY-50; to:opacity-100|translateY-0">
  Content
</div>

<!-- Scale and rotate -->
<div data-animation="from:scale-0|rotate-45; to:scale-1|rotate-0">Content</div>
```

### Breakpoint-Specific Animations

```html
<!-- Different animations per screen size -->
<div
  data-animation="
  @mobile:from:opacity-0|translateY-20; to:opacity-100|translateY-0;
  @desktop:from:opacity-0|translateX-100; to:opacity-100|translateX-0;
"
>
  Mobile: slides up, Desktop: slides from right
</div>
```

### Stagger Animations

```html
<!-- Animate children with delays -->
<div
  data-animation="[&>li]:from:opacity-0|translateY-20; to:opacity-100|translateY-0|stagger-0.1"
>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
  </ul>
</div>
```

### Timeline Animations

```html
<!-- Complex multi-step animation -->
<div
  data-animation="
  from:translateY-50|opacity-0|scale-0;
  via-50%:translateY-10|opacity-50|scale-120;
  to:translateY-0|opacity-100|scale-100;
"
>
  Complex timeline animation
</div>
```

## ⚙️ Configuration

```javascript
new ScrollyMotion({
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

## 🎯 Animation Properties

### Transform Properties

- `translateX`, `translateY`, `translateZ` - Movement (supports px, %, vh, vw, rem, em)
- `scale`, `scaleX`, `scaleY` - Scaling (0-9999)
- `rotate`, `rotateX`, `rotateY`, `rotateZ` - Rotation (degrees)

### Other Properties

- `opacity` - Transparency (0-100 range)

### Value Formats

#### Tailwind-style Values

```html
<div data-animation="from:translateY-12; to:translateY-0;">
  <!-- translateY: 48px to 0px (12 * 4px) -->
</div>
```

#### Arbitrary Values

```html
<div data-animation="from:translateY-[100px]; to:translateY-[0px];">
  Custom pixel values
</div>
```

## 🔧 Element Configuration

```html
<div
  data-scroll="
  enter: 50vh;        <!-- Enter offset -->
  exit: 0vh;          <!-- Exit offset -->
  distance: 200px;    <!-- Animation distance -->
  once: true;         <!-- Animate only once -->
  damping: 0.1;       <!-- Physics damping (0-1) -->
  friction: 0.95;     <!-- Physics friction (0-1) -->
  enterClass: fade-in;     <!-- Enter class -->
  leaveClass: fade-out;    <!-- Leave class -->
  theme: dark;        <!-- Body theme attribute -->
"
></div>
```

## 🌐 Browser Support

- Chrome 51+
- Firefox 55+
- Safari 12.1+
- Edge 79+

## 📦 Bundle Size

- **Minified**: ~15KB
- **Gzipped**: ~5KB

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by modern scroll animation libraries
- Built with performance and developer experience in mind
- Thanks to all contributors and the open source community

---

**Made with ❤️ by the ScrollyMotion team**

[Documentation](https://scrollymotion.dev) • [Examples](https://scrollymotion.dev/examples) • [GitHub](https://github.com/scrollymotion/scrollymotion)
