# ScrollyMotion Refactoring Plan

This document outlines the plan to refactor the ScrollyMotion plugin for improved performance, maintainability, and robustness.

## Phase 1: Core Refactoring (High Priority)

**Objective**: Address critical architectural issues, fix memory leaks, and improve code structure.

- [x] **Create ElementManager Class**

  - **Priority**: Critical
  - **Time Estimate**: 3-4 hours
  - **Description**: Create a dedicated class to manage the lifecycle of scroll elements, including discovery, initialization, configuration parsing, and state management. This will significantly simplify the main `ScrollyMotion` class.
  - **Files to create**: `src/plugins/scrolly-motion/core/ElementManager.ts`
  - **Success Criteria**: `ScrollyMotion.ts` is simplified, and all element-related logic is encapsulated in `ElementManager`.

- [x] **Fix Memory Leaks in `destroy()` Method**

  - **Priority**: Critical
  - **Time Estimate**: 1-2 hours
  - **Description**: Implement a comprehensive `destroy` method that properly cleans up all event listeners (including `MediaQueryList` listeners), timers, element references, and observer instances to prevent memory leaks.
  - **Files to modify**: `src/plugins/scrolly-motion/core/ScrollyMotion.ts`, `src/plugins/scrolly-motion/core/ElementManager.ts`
  - **Success Criteria**: No event listeners or object references remain after calling `destroy()`.

- [x] **Implement Input Validation**

  - **Priority**: High
  - **Time Estimate**: 2-3 hours
  - **Description**: Create a validation utility to check all incoming configurations (`ScrollAnimatorConfig`, `data-scroll`, `data-animation`). Provide clear error messages for developers.
  - **Files to create**: `src/plugins/scrolly-motion/utils/validation.ts`
  - **Success Criteria**: Invalid configurations are handled gracefully with descriptive console warnings/errors.

- [x] **Optimize Update Loop with Dirty Checking**
  - **Priority**: High
  - **Time Estimate**: 2-3 hours
  - **Description**: Refactor the `updateScroll` loop to only process elements that are currently in view or have changed state. Implement a dirty-checking mechanism to avoid unnecessary calculations and DOM updates.
  - **Files to modify**: `src/plugins/scrolly-motion/core/ScrollyMotion.ts`
  - **Success Criteria**: CPU usage during scroll is significantly reduced.

## Phase 2: Performance Optimization (High Priority)

**Objective**: Implement advanced performance patterns to ensure smooth animations even with a large number of elements.

- [x] **Integrate Intersection Observer**

  - **Priority**: High
  - **Time Estimate**: 2-3 hours
  - **Description**: Use `IntersectionObserver` for efficient viewport detection. This will replace the manual scroll position calculations and improve performance.
  - **Files to modify**: `src/plugins/scrolly-motion/core/ElementManager.ts`
  - **Success Criteria**: Scroll-based calculations are replaced by `IntersectionObserver` callbacks.

- [x] **Optimize Physics Loop**

  - **Priority**: High
  - **Time Estimate**: 2-3 hours
  - **Description**: Ensure the physics loop in `Physics.ts` only runs when there are elements that require physics-based animations. The loop should sleep when idle.
  - **Files to modify**: `src/plugins/scrolly-motion/core/Physics.ts`
  - **Success Criteria**: The `requestAnimationFrame` loop for physics is not active when no elements are animating.

- [x] **Cache DOM Queries**
  - **Priority**: Medium
  - **Time Estimate**: 1-2 hours
  - **Description**: Cache the results of DOM queries (`querySelectorAll`) to avoid redundant lookups, especially for stagger children.
  - **Files to modify**: `src/plugins/scrolly-motion/core/ElementManager.ts`
  - **Success Criteria**: `querySelectorAll` is called only once per element initialization.

## Phase 3: Code Quality & Maintainability (Medium Priority)

**Objective**: Improve the overall code quality, making it easier to understand, maintain, and extend.

- [x] **Break Down Large Methods**

  - **Priority**: Medium
  - **Time Estimate**: 2-3 hours
  - **Description**: Refactor large methods like `measure()` and `updateScroll()` into smaller, single-responsibility functions.
  - **Files to modify**: `src/plugins/scrolly-motion/core/ScrollyMotion.ts`
  - **Success Criteria**: No method exceeds 50 lines of code.

- [x] **Add Comprehensive Error Handling**

  - **Priority**: Medium
  - **Time Estimate**: 2-3 hours
  - **Description**: Implement robust error handling throughout the library, with graceful fallbacks and clear, actionable error messages.
  - **Files to modify**: All core files.
  - **Success Criteria**: The library does not crash on invalid input and provides useful debug information.

- [x] **Add Unit Tests**
  - **Priority**: High
  - **Time Estimate**: 4-6 hours
  - **Description**: Introduce a testing framework (like Vitest or Jest) and write unit tests for core components, especially the parsers and utility functions.
  - **Files to create**: `*.test.ts` files for core modules.
  - **Success Criteria**: Core logic is covered by unit tests, ensuring stability during future refactoring.

## Phase 4: API & Feature Enhancement (Medium Priority)

**Objective**: Improve the public API and add features that enhance developer experience.

- [x] **Create a Plugin System**

  - **Priority**: Low
  - **Time Estimate**: 3-5 hours
  - **Description**: Design a simple plugin system that allows developers to add custom animation properties or behaviors without modifying the core library.
  - **Files to create**: `src/plugins/scrolly-motion/core/PluginManager.ts`
  - **Success Criteria**: A developer can register a new animation property with a custom interpolation function.

- [x] **Implement an Event System**
  - **Priority**: Medium
  - **Time Estimate**: 2-3 hours
  - **Description**: Create an event emitter that fires events for key lifecycle moments (e.g., `elementEnter`, `elementLeave`, `animationComplete`).
  - **Files to create**: `src/plugins/scrolly-motion/core/EventManager.ts`
  - **Success Criteria**: Developers can subscribe to ScrollyMotion events.
