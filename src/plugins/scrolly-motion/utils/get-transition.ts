import type { AnimationConfig, StaggerConfig } from "../types";

const TRANSFORM_PROPERTIES = new Set([
  "translateX",
  "translateY",
  "translateZ",
  "scale",
  "scaleX",
  "scaleY",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skewX",
  "skewY",
  "perspective",
]);

const FILTER_PROPERTIES = new Set(["blur", "grayscale"]);

function getAnimatedProperties(
  config: AnimationConfig | StaggerConfig
): Set<string> {
  const properties = new Set<string>();

  if (config.timeline) {
    config.timeline.forEach((step) => {
      Object.keys(step.properties).forEach((prop) => properties.add(prop));
    });
  } else {
    if ("from" in config) {
      Object.keys(config.from).forEach((prop) => properties.add(prop));
    }
    if ("to" in config) {
      Object.keys(config.to).forEach((prop) => properties.add(prop));
    }
  }

  return properties;
}

export function generateTransition(
  config: AnimationConfig | StaggerConfig,
  duration: number = 200,
  easing: string = "linear"
): string {
  const animatedProperties = getAnimatedProperties(config);
  const transitions = new Set<string>();

  let hasTransform = false;
  let hasFilter = false;

  animatedProperties.forEach((prop) => {
    if (TRANSFORM_PROPERTIES.has(prop)) {
      hasTransform = true;
    } else if (FILTER_PROPERTIES.has(prop)) {
      hasFilter = true;
    } else {
      transitions.add(
        `${prop
          .replace(/([A-Z])/g, "-$1")
          .toLowerCase()} ${duration}ms ${easing}`
      );
    }
  });

  if (hasTransform) {
    transitions.add(`transform ${duration}ms ${easing}`);
  }
  if (hasFilter) {
    transitions.add(`filter ${duration}ms ${easing}`);
  }

  return Array.from(transitions).join(", ");
}
