import Color from "colorjs.io/dist/color.js";

// 5) Shade keys
export const LEVELS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

export type TailwindScale = Record<(typeof LEVELS)[number], string>;

// Helper function to find the closest key in a map by value
function findClosestKey(
  needle: number,
  haystack: Record<string | number, number>
) {
  return Object.keys(haystack).reduce((a, b) => {
    return Math.abs(haystack[b] - needle) < Math.abs(haystack[a] - needle)
      ? b
      : a;
  });
}

/**
 * Build a Tailwind-like 50→950 ramp for any CSS color.
 */
export function generateTailwindScale(
  base: string,
  options: {
    hueShift?: number;
    chromaFactor?: number;
  } = {}
): TailwindScale {
  const { hueShift = 0.8, chromaFactor = 1.0 } = options;

  // 1. Convert base color to OKLCh
  const baseColor = new Color(base);
  if (!baseColor.oklch) {
    // Return a default scale or throw an error if the color is invalid
    const defaultColor = "#888888";
    return LEVELS.reduce((acc, level) => {
      acc[level] = defaultColor;
      return acc;
    }, {} as TailwindScale);
  }
  const [l_base, c_base, h_base] = baseColor.oklch;

  // 2. Define Tailwind's lightness and chroma targets
  const lightnessMap = {
    50: 0.98,
    100: 0.94,
    200: 0.87,
    300: 0.79,
    400: 0.7,
    500: 0.62,
    600: 0.53,
    700: 0.45,
    800: 0.36,
    900: 0.27,
    950: 0.2,
  };

  const chromaMap = {
    50: 0.01,
    100: 0.025,
    200: 0.05,
    300: 0.08,
    400: 0.12,
    500: 0.15,
    600: 0.14,
    700: 0.12,
    800: 0.1,
    900: 0.08,
    950: 0.06,
  };

  // 3. Find the closest lightness level for the base color
  const baseLevelKey = findClosestKey(
    l_base,
    lightnessMap
  ) as unknown as keyof typeof lightnessMap;
  const baseLevelIndex = Object.keys(lightnessMap).indexOf(
    String(baseLevelKey)
  );

  const scale = {} as Partial<TailwindScale>;

  LEVELS.forEach((level, i) => {
    // 4. Calculate lightness based on the base color's position
    const l = lightnessMap[level];

    // 5. Calculate chroma with hue-specific adjustments
    let c =
      c_base * chromaFactor * (chromaMap[level] / chromaMap[baseLevelKey]);

    // 6. Apply hue shifting for darker shades
    let h = h_base;
    if (i > baseLevelIndex) {
      h += (i - baseLevelIndex) * hueShift;
    }

    // 7. Create new color and convert to sRGB hex
    const newColor = new Color("oklch", [l, c, h]);
    scale[level] = newColor.to("srgb").toString({ format: "hex" });
  });

  return scale as TailwindScale;
}
