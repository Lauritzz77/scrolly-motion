# ScrollyMotion Plugin Development Guide for LLMs

This document provides a structured guide for Large Language Models (LLMs) to understand and create plugins for the ScrollyMotion library.

## 1. Plugin Development Schema (JSON-LD)

This schema defines the structure of a ScrollyMotion plugin in a machine-readable format.

```json
{
  "@context": "https://scrollymotion.dev/plugin-schema",
  "@type": "PluginInterface",
  "description": "The interface for a ScrollyMotion plugin.",
  "required": ["name", "parse"],
  "properties": {
    "name": {
      "type": "string",
      "description": "A unique name for the plugin."
    },
    "parse": {
      "type": "function",
      "description": "A function that parses a custom animation property.",
      "signature": "(property: string, value: string) => any",
      "parameters": [
        {
          "name": "property",
          "type": "string",
          "description": "The name of the CSS property to parse."
        },
        {
          "name": "value",
          "type": "string",
          "description": "The value of the CSS property to parse."
        }
      ],
      "returns": {
        "type": "any",
        "description": "The parsed value, or undefined if the plugin does not handle the property."
      }
    }
  }
}
```

## 2. Decision Tree for Plugin Development

Use this decision tree to determine how to create a plugin.

1.  **What is the goal of the plugin?**
    - **A. Add a new custom animation property?** -> Go to section 3.
    - **B. Modify the behavior of an existing property?** -> Go to section 4.
    - **C. Add a new timeline-based animation?** -> Go to section 5.

## 3. Creating a New Custom Animation Property

### 3.1. Identify the Property Name

Choose a descriptive name for your custom property (e.g., `bounceY`, `fadeInColor`).

### 3.2. Define the Parsing Logic

The `parse` function should:

1.  Check if the `property` matches the custom property name.
2.  If it matches, parse the `value` and return the transformed value.
3.  If it does not match, return `undefined`.

### 3.3. Code Generation Template

```typescript
const myCustomPlugin = {
  name: "myCustomPlugin",
  parse: (property, value) => {
    if (property === "myCustomProperty") {
      // Add your parsing logic here
      const parsedValue = parseFloat(value) * 2;
      return parsedValue;
    }
    return undefined;
  },
};
```

## 4. Modifying Existing Property Behavior

To modify an existing property, create a plugin that intercepts the property before the default parser.

### 4.1. Code Generation Template

```typescript
const propertyOverridePlugin = {
  name: "propertyOverridePlugin",
  parse: (property, value) => {
    if (property === "opacity") {
      // Override opacity to always be at least 0.1
      const parsedValue = parseFloat(value);
      return Math.max(0.1, parsedValue);
    }
    return undefined;
  },
};
```

## 5. Input/Output Specifications

### 5.1. Input to `parse(property, value)`

- `property`: A string representing the CSS property (e.g., `'translateX'`, `'opacity'`).
- `value`: A string representing the value (e.g., `'10'`, `'[50%]'`, `'[100px]'`).

### 5.2. Expected Output from `parse`

- **For transform properties (`translateX`, `rotate`, etc.)**: A number or a string with units (e.g., `40`, `'100px'`, `'45deg'`).
- **For filter properties (`blur`, `grayscale`)**: A number.
- **For other properties (`opacity`)**: A number between 0 and 1.
- **If the plugin does not handle the property**: `undefined`.

## 6. Real-World Plugin Library

### 6.1. Color Fade Plugin

This plugin allows fading between two colors.

```typescript
const colorFadePlugin = {
  name: "colorFadePlugin",
  parse: (property, value) => {
    if (property === "color") {
      // This is a simplified example. A real implementation would
      // need to handle color interpolation.
      return value;
    }
    return undefined;
  },
};
```

### 6.2. SVG Stroke Animation Plugin

This plugin animates the `stroke-dashoffset` of an SVG path.

```typescript
const svgStrokePlugin = {
  name: "svgStrokePlugin",
  parse: (property, value) => {
    if (property === "strokeDashoffset") {
      return parseFloat(value);
    }
    return undefined;
  },
};
```

## 7. Validation and Testing

- **Testing**: Use `vitest` to create unit tests for your plugin's `parse` function.
- **Edge Cases**: Test with invalid values, missing units, and unexpected formats.
- **Debugging**: Use `console.log` inside your `parse` function to inspect the `property` and `value`.
