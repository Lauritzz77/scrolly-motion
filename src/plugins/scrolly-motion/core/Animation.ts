/**
 * ScrollyMotion Animation
 * Handles animation updates, value calculations, and CSS application
 */

import type { ScrollElement, TimelineStep } from "../types";

export class Animation {
  /**
   * Update regular animation based on scroll progress
   */
  updateAnimation(el: ScrollElement, progress: number): void {
    if (!el._animationConfig) return;

    const { from, to, timeline } = el._animationConfig;

    // If timeline is defined, use timeline-based animation
    if (timeline && timeline.length > 0) {
      const currentValues = this.calculateTimelineValues(timeline, progress);
      this.applyAnimationValues(el, currentValues);
      return;
    }

    // Otherwise, use simple from/to animation
    const currentValues: Record<string, any> = {};

    // Combine all keys from both from and to
    const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

    allKeys.forEach((key) => {
      const fromVal = from[key];
      const toVal = to[key];

      // If we have both from and to values
      if (fromVal !== undefined && toVal !== undefined) {
        if (typeof fromVal === "number" && typeof toVal === "number") {
          currentValues[key] = fromVal + (toVal - fromVal) * progress;
        } else if (typeof fromVal === "string" && typeof toVal === "string") {
          // Handle string interpolation for CSS values like "50vh" to "0vh", "-50vh" to "0vh"
          const fromMatch = fromVal.match(/^(-?[\d.]+)([a-z%]+)$/i);
          const toMatch = toVal.match(/^(-?[\d.]+)([a-z%]+)$/i);

          if (fromMatch && toMatch && fromMatch[2] === toMatch[2]) {
            // Same unit, interpolate the numeric part
            const fromNum = parseFloat(fromMatch[1]);
            const toNum = parseFloat(toMatch[1]);
            const interpolatedNum = fromNum + (toNum - fromNum) * progress;
            currentValues[key] = interpolatedNum + fromMatch[2]; // Add unit back
          } else {
            // Different units or non-numeric strings, use discrete transition
            currentValues[key] = progress < 0.5 ? fromVal : toVal;
          }
        } else {
          // For non-numeric values, use discrete transition at 50% progress
          currentValues[key] = progress < 0.5 ? fromVal : toVal;
        }
      }
      // If we only have from value
      else if (fromVal !== undefined && toVal === undefined) {
        // Assume target is 0 for transforms, 1 for opacity
        const defaultTo = key === "opacity" ? 1 : 0;
        if (typeof fromVal === "number") {
          currentValues[key] = fromVal + (defaultTo - fromVal) * progress;
        } else {
          currentValues[key] = fromVal;
        }
      }
      // If we only have to value
      else if (fromVal === undefined && toVal !== undefined) {
        // Assume starting from 0 for transforms, 0 for opacity
        const defaultFrom = key === "opacity" ? 0 : 0;
        if (typeof toVal === "number") {
          currentValues[key] = defaultFrom + (toVal - defaultFrom) * progress;
        } else {
          currentValues[key] = progress > 0 ? toVal : undefined;
        }
      }
    });

    // Apply the values directly to the element
    this.applyAnimationValues(el, currentValues);
  }

  /**
   * Calculate timeline values for a given progress
   */
  calculateTimelineValues(
    timeline: TimelineStep[],
    progress: number
  ): Record<string, any> {
    const currentValues: Record<string, any> = {};

    // Find the current timeline segment
    let currentStep: TimelineStep | null = null;
    let nextStep: TimelineStep | null = null;

    for (let i = 0; i < timeline.length; i++) {
      const step = timeline[i];

      if (progress >= step.at) {
        currentStep = step;
        nextStep = timeline[i + 1] || null;
      } else {
        break;
      }
    }

    // If we haven't reached the first step, use the first step's properties
    if (!currentStep) {
      currentStep = timeline[0];
      nextStep = timeline[1] || null;
    }

    // If we have a next step, interpolate between current and next
    if (nextStep && progress > currentStep.at) {
      const segmentProgress =
        (progress - currentStep.at) / (nextStep.at - currentStep.at);

      // Get all properties from both steps
      const allProps = new Set([
        ...Object.keys(currentStep.properties),
        ...Object.keys(nextStep.properties),
      ]);

      allProps.forEach((prop) => {
        const currentVal = currentStep!.properties[prop];
        const nextVal = nextStep!.properties[prop];

        if (currentVal !== undefined && nextVal !== undefined) {
          if (typeof currentVal === "number" && typeof nextVal === "number") {
            currentValues[prop] =
              currentVal + (nextVal - currentVal) * segmentProgress;
          } else if (
            typeof currentVal === "string" &&
            typeof nextVal === "string"
          ) {
            // Handle string interpolation for CSS values like "50vh" to "0vh", "6rem" to "3rem"
            const fromMatch = currentVal.match(/^(-?[\d.]+)([a-z%]+)$/i);
            const toMatch = nextVal.match(/^(-?[\d.]+)([a-z%]+)$/i);

            if (fromMatch && toMatch && fromMatch[2] === toMatch[2]) {
              // Same unit, interpolate the numeric part
              const fromNum = parseFloat(fromMatch[1]);
              const toNum = parseFloat(toMatch[1]);
              const interpolatedNum =
                fromNum + (toNum - fromNum) * segmentProgress;
              currentValues[prop] = interpolatedNum + fromMatch[2]; // Add unit back
            } else {
              // Different units or non-numeric strings, use discrete transition
              currentValues[prop] =
                segmentProgress < 0.5 ? currentVal : nextVal;
            }
          } else {
            currentValues[prop] = segmentProgress < 0.5 ? currentVal : nextVal;
          }
        } else if (currentVal !== undefined) {
          currentValues[prop] = currentVal;
        } else if (nextVal !== undefined) {
          currentValues[prop] = segmentProgress > 0 ? nextVal : undefined;
        }
      });
    } else {
      // Use current step's properties directly
      Object.assign(currentValues, currentStep.properties);
    }

    return currentValues;
  }

  /**
   * Update stagger animation for multiple children
   */
  updateStaggerAnimation(el: ScrollElement, progress: number): void {
    if (!el._staggerConfig || el._staggerChildren.length === 0) return;

    const { from, to, staggerDelay, timeline } = el._staggerConfig;
    const totalChildren = el._staggerChildren.length;
    const totalStaggerTime = (totalChildren - 1) * staggerDelay;

    el._staggerChildren.forEach((child, index) => {
      // Calculate individual progress for this child
      let childProgress = 0;

      if (progress > 0) {
        // Forward animation (entering)
        const childStartTime = (index * staggerDelay) / (1 + totalStaggerTime);
        const childEndTime = childStartTime + 1 / (1 + totalStaggerTime);

        if (progress >= childStartTime) {
          const localProgress = Math.min(
            1,
            (progress - childStartTime) / (childEndTime - childStartTime)
          );
          childProgress = localProgress;
        }
      } else if (progress < 0 && !el._once) {
        // Reverse animation (exiting) - last child exits first
        const reverseIndex = totalChildren - 1 - index;
        const childStartTime =
          (reverseIndex * staggerDelay) / (1 + totalStaggerTime);
        const childEndTime = childStartTime + 1 / (1 + totalStaggerTime);

        const reverseProgress = Math.abs(progress);
        if (reverseProgress >= childStartTime) {
          const localProgress = Math.min(
            1,
            (reverseProgress - childStartTime) / (childEndTime - childStartTime)
          );
          childProgress = 1 - localProgress; // Reverse the progress
        } else {
          childProgress = 1; // Stay in "to" state until it's time to animate out
        }
      }

      // Calculate current values for this child
      let currentValues: Record<string, any> = {};

      // If timeline is defined, use timeline-based animation
      if (timeline && timeline.length > 0) {
        currentValues = this.calculateTimelineValues(timeline, childProgress);
      } else {
        // Otherwise, use simple from/to animation
        const allKeys = new Set([...Object.keys(from), ...Object.keys(to)]);

        allKeys.forEach((key) => {
          const fromVal = from[key];
          const toVal = to[key];

          if (fromVal !== undefined && toVal !== undefined) {
            if (typeof fromVal === "number" && typeof toVal === "number") {
              currentValues[key] = fromVal + (toVal - fromVal) * childProgress;
            } else {
              currentValues[key] = childProgress < 0.5 ? fromVal : toVal;
            }
          } else if (fromVal !== undefined) {
            const defaultTo = key === "opacity" ? 1 : 0;
            if (typeof fromVal === "number") {
              currentValues[key] =
                fromVal + (defaultTo - fromVal) * childProgress;
            } else {
              currentValues[key] = fromVal;
            }
          } else if (toVal !== undefined) {
            const defaultFrom = key === "opacity" ? 0 : 0;
            if (typeof toVal === "number") {
              currentValues[key] =
                defaultFrom + (toVal - defaultFrom) * childProgress;
            } else {
              currentValues[key] = childProgress > 0 ? toVal : undefined;
            }
          }
        });
      }

      // Apply the values to this child
      this.applyAnimationValues(child, currentValues);
    });
  }

  /**
   * Apply animation values to an element
   */
  applyAnimationValues(el: HTMLElement, values: Record<string, any>): void {
    // Handle transform properties
    const transforms: string[] = [];
    const filters: string[] = [];
    let hasTransforms = false;
    let hasFilters = false;

    Object.keys(values).forEach((key) => {
      const value = values[key];

      if (value === undefined || value === null) return;

      if (key === "opacity") {
        el.style.opacity = value.toString();
      } else if (key === "translateX") {
        // Handle both numeric values and arbitrary values with units
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value // Already has unit (e.g., "123px", "50%", "10rem")
            : `${value}px`; // Add px for numeric values (from Tailwind spacing)
        transforms.push(`translateX(${transformValue})`);
        hasTransforms = true;
      } else if (key === "translateY") {
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}px`; // Add px for numeric values (from Tailwind spacing)
        transforms.push(`translateY(${transformValue})`);
        hasTransforms = true;
      } else if (key === "translateZ") {
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}px`; // Add px for numeric values (from Tailwind spacing)
        transforms.push(`translateZ(${transformValue})`);
        hasTransforms = true;
      } else if (key === "scale") {
        transforms.push(`scale(${value})`);
        hasTransforms = true;
      } else if (key === "scaleX") {
        transforms.push(`scaleX(${value})`);
        hasTransforms = true;
      } else if (key === "scaleY") {
        transforms.push(`scaleY(${value})`);
        hasTransforms = true;
      } else if (key === "rotate") {
        // Handle both numeric values and arbitrary values with units
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value // Already has unit (e.g., "45deg", "0.5turn")
            : `${value}deg`; // Add deg for numeric values
        transforms.push(`rotate(${transformValue})`);
        hasTransforms = true;
      } else if (key === "rotateX") {
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}deg`;
        transforms.push(`rotateX(${transformValue})`);
        hasTransforms = true;
      } else if (key === "rotateY") {
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}deg`;
        transforms.push(`rotateY(${transformValue})`);
        hasTransforms = true;
      } else if (key === "rotateZ") {
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}deg`;
        transforms.push(`rotateZ(${transformValue})`);
        hasTransforms = true;
      } else if (key === "skewX") {
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}deg`;
        transforms.push(`skewX(${transformValue})`);
        hasTransforms = true;
      } else if (key === "skewY") {
        const transformValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}deg`;
        transforms.push(`skewY(${transformValue})`);
        hasTransforms = true;
      } else if (key === "blur") {
        const filterValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}px`;
        filters.push(`blur(${filterValue})`);
        hasFilters = true;
      } else if (key === "grayscale") {
        filters.push(`grayscale(${value})`);
        hasFilters = true;
      } else if (key === "perspective") {
        const perspectiveValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}px`;
        el.style.perspective = perspectiveValue;
      } else if (key === "letter-spacing") {
        const spacingValue =
          typeof value === "string" && value.match(/[a-z%]/i)
            ? value
            : `${value}px`;
        el.style.letterSpacing = spacingValue;
      } else {
        // Handle other CSS properties
        try {
          (el.style as any)[key] = value;
        } catch (e) {
          console.error(`Failed to apply style ${key}: ${value}`, e);
        }
      }
    });

    // Apply transform if we have any transform properties
    if (hasTransforms) {
      const transformString = transforms.join(" ");
      el.style.transform = transformString;
    }

    // Apply filter if we have any filter properties
    if (hasFilters) {
      const filterString = filters.join(" ");
      el.style.filter = filterString;
    }
  }
}
