/**
 * ScrollyMotion Value Parser
 * Handles parsing of individual animation values.
 */

export class ValueParser {
  parse(property: string, value: string): any {
    if (value.startsWith("[") && value.endsWith("]")) {
      return this.parseArbitraryValue(property, value.slice(1, -1));
    }
    return this.parseTailwindValue(property, value);
  }

  private parseArbitraryValue(property: string, arbitraryValue: string): any {
    if (
      property.includes("translate") ||
      property.includes("scale") ||
      property.includes("rotate") ||
      property.includes("blur") ||
      property.includes("grayscale") ||
      property.includes("skew") ||
      property.includes("perspective")
    ) {
      if (/^-?[\d.]+[a-z%]+$/i.test(arbitraryValue)) {
        return arbitraryValue;
      } else if (/^-?[\d.]+$/.test(arbitraryValue)) {
        const numValue = parseFloat(arbitraryValue);
        if (property.includes("rotate")) return `${numValue}deg`;
        if (property.includes("scale")) return numValue;
        return `${numValue}px`;
      }
    }
    if (property === "opacity") {
      return parseFloat(arbitraryValue);
    }
    return arbitraryValue;
  }

  private parseTailwindValue(property: string, value: string): any {
    if (property.includes("translate")) return this.parseTailwindSpacing(value);
    if (property === "opacity") return this.parseTailwindOpacity(value);
    if (property.includes("scale")) return this.parseTailwindScale(value);
    if (property.includes("rotate")) return this.parseTailwindRotate(value);
    if (property.includes("blur")) return this.parseTailwindBlur(value);
    if (property.includes("grayscale"))
      return this.parseTailwindGrayscale(value);
    if (property.includes("skew")) return this.parseTailwindSkew(value);
    if (property.includes("perspective"))
      return this.parseTailwindPerspective(value);

    const numValue = parseFloat(value);
    return isNaN(numValue) ? value : numValue;
  }

  private parseTailwindSpacing(value: string): number {
    const numValue = parseFloat(value);
    return !isNaN(numValue) ? numValue * 4 : 0;
  }

  private parseTailwindOpacity(value: string): number {
    const numValue = parseFloat(value);
    return !isNaN(numValue) ? numValue * 0.01 : 0;
  }

  private parseTailwindScale(value: string): number {
    const numValue = parseFloat(value);
    return !isNaN(numValue) ? numValue * 0.01 : 1;
  }

  private parseTailwindRotate(value: string): number {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  }

  private parseTailwindBlur(value: string): number {
    const numValue = parseFloat(value);
    return !isNaN(numValue) ? numValue * 4 : 0;
  }

  private parseTailwindGrayscale(value: string): number {
    const numValue = parseFloat(value);
    return !isNaN(numValue) ? numValue * 0.01 : 0;
  }

  private parseTailwindSkew(value: string): number {
    const numValue = parseFloat(value);
    return isNaN(numValue) ? 0 : numValue;
  }

  private parseTailwindPerspective(value: string): number {
    const numValue = parseFloat(value);
    return !isNaN(numValue) ? numValue : 0;
  }
}
