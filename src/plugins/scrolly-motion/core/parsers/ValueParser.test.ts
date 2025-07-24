import { describe, it, expect, vi } from "vitest";
import { ValueParser } from "./ValueParser";
import { PluginManager } from "../PluginManager";

describe("ValueParser", () => {
  const pluginManager = new PluginManager();
  const parser = new ValueParser(pluginManager);

  it("should parse tailwind spacing values", () => {
    expect(parser.parse("translateX", "10")).toBe(40);
    expect(parser.parse("translateY", "-10")).toBe(-40);
  });

  it("should parse tailwind opacity values", () => {
    expect(parser.parse("opacity", "50")).toBe(0.5);
  });

  it("should parse arbitrary pixel values", () => {
    expect(parser.parse("translateX", "[100px]")).toBe("100px");
  });

  it("should parse arbitrary percentage values", () => {
    expect(parser.parse("translateX", "[50%]")).toBe("50%");
  });

  it("should parse arbitrary rotate values", () => {
    expect(parser.parse("rotate", "[45deg]")).toBe("45deg");
  });

  it("should return the original value for unknown properties", () => {
    expect(parser.parse("color", "red")).toBe("red");
  });
});
