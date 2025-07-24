// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import netlify from "@astrojs/netlify";

export default defineConfig({
  adapter: netlify(),
  output: "server",
  prefetch: true,
  devToolbar: {
    enabled: false,
  },
  experimental: {
    fonts: [{
      provider: fontProviders.google(),
      name: "Inter",
      cssVariable: "--font-inter",
      weights: [200, 400, 600, 700, 900],
      subsets: ["latin"],
      unicodeRange: ["U+26"],
      display: "swap",
    }]
  },

  vite: {
    plugins: [tailwindcss()],
  },
});
