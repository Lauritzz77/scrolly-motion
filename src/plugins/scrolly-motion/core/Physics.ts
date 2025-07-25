/**
 * ScrollyMotion Physics
 * Handles damping, physics calculations, and smooth scroll animations
 */

import type { ScrollElement } from "../types/index";
import { PHYSICS_CONFIG } from "../utils/constants";
import { Animation } from "./Animation";

export class Physics {
  private animation: Animation;
  private dampingAnimationId: number | null = null;
  private scrollStopTimer: number | null = null;
  private isScrolling: boolean = false;
  private lastScrollTime: number = 0;

  constructor() {
    this.animation = new Animation();
  }

  /**
   * Start the physics damping loop
   */
  startDampingLoop(elements: ScrollElement[]): void {
    if (this.dampingAnimationId !== null) {
      return; // Loop is already running
    }

    let lastTime = performance.now();

    const physicsLoop = (currentTime: number) => {
      const deltaTime = Math.min(
        currentTime - lastTime,
        PHYSICS_CONFIG.maxDeltaTime
      );
      lastTime = currentTime;

      let hasActiveElements = false;

      elements.forEach((el) => {
        if (el._damping > 0) {
          const targetProgress = el._targetProgress;
          const currentProgress = el._currentProgress;

          // Calculate velocity based on target progress change
          const targetDelta = targetProgress - el._lastTargetProgress;
          el._lastTargetProgress = targetProgress;

          // Use global scroll state instead of per-element target changes
          if (this.isScrolling) {
            // We're actively scrolling - update velocity and apply damping
            if (Math.abs(targetDelta) > 0.001) {
              el._velocity = targetDelta * PHYSICS_CONFIG.velocityScale;
            }

            // Apply damping while scrolling
            const dampingFactor = 1 - el._damping;
            el._currentProgress =
              currentProgress * dampingFactor + targetProgress * el._damping;
          } else {
            // We've stopped scrolling - apply physics momentum

            // Apply velocity to current progress (scaled by deltaTime for frame-rate independence)
            el._currentProgress +=
              el._velocity * (deltaTime / PHYSICS_CONFIG.maxDeltaTime);

            // Apply friction to velocity (frame-rate independent)
            const frictionFactor = Math.pow(
              el._friction,
              deltaTime / PHYSICS_CONFIG.maxDeltaTime
            );
            el._velocity *= frictionFactor;

            // Also apply some attraction back to target (scaled by deltaTime)
            const attractionForce =
              (targetProgress - el._currentProgress) *
              PHYSICS_CONFIG.attractionForce *
              (deltaTime / PHYSICS_CONFIG.maxDeltaTime);
            el._velocity += attractionForce;
          }

          // Check if we need to continue animating
          const progressDiff = Math.abs(targetProgress - currentProgress);
          const velocityMagnitude = Math.abs(el._velocity);

          if (
            progressDiff > PHYSICS_CONFIG.minProgressDiff ||
            velocityMagnitude > PHYSICS_CONFIG.minVelocity
          ) {
            hasActiveElements = true;

            // Clamp progress to valid range
            el._currentProgress = Math.max(0, Math.min(1, el._currentProgress));

            // Update the animation with the new progress
            if (el._animationConfig) {
              this.animation.updateAnimation(el, el._currentProgress);
            }

            // Update stagger animations with the new progress
            if (el._staggerConfig && el._staggerChildren.length > 0) {
              this.animation.updateStaggerAnimation(el, el._currentProgress);
            }

            // Update CSS custom property
            el.style.setProperty(
              "--element-progress",
              el._currentProgress.toFixed(3)
            );
          } else {
            // Stop the physics for this element
            el._velocity = 0;
            el._currentProgress = targetProgress;
          }
        }
      });

      // Continue the loop if we have active elements
      if (hasActiveElements) {
        this.dampingAnimationId = requestAnimationFrame(physicsLoop);
      } else {
        this.dampingAnimationId = null;
      }
    };

    // Start the loop
    if (this.dampingAnimationId === null) {
      this.dampingAnimationId = requestAnimationFrame(physicsLoop);
    }
  }

  /**
   * Handle scroll events and manage scroll state
   */
  onScroll(elements: ScrollElement[]): void {
    // Track scroll state
    this.isScrolling = true;
    this.lastScrollTime = performance.now();

    // Clear any existing scroll stop timer
    if (this.scrollStopTimer) {
      clearTimeout(this.scrollStopTimer);
    }

    // Set a timer to detect when scrolling stops
    this.scrollStopTimer = window.setTimeout(() => {
      this.isScrolling = false;
      // Ensure the physics loop continues after scroll stops
      const hasDampingElements = elements.some((el) => el._damping > 0);
      if (this.dampingAnimationId === null && hasDampingElements) {
        this.startDampingLoop(elements);
      }
    }, PHYSICS_CONFIG.scrollStopDelay);
  }

  /**
   * Get scroll state
   */
  getScrollState(): { isScrolling: boolean; lastScrollTime: number } {
    return {
      isScrolling: this.isScrolling,
      lastScrollTime: this.lastScrollTime,
    };
  }

  /**
   * Stop all physics animations
   */
  stopPhysics(): void {
    if (this.dampingAnimationId) {
      cancelAnimationFrame(this.dampingAnimationId);
      this.dampingAnimationId = null;
    }

    if (this.scrollStopTimer) {
      clearTimeout(this.scrollStopTimer);
      this.scrollStopTimer = null;
    }

    this.isScrolling = false;
  }

  /**
   * Get animation instance for external use
   */
  getAnimation(): Animation {
    return this.animation;
  }
}
