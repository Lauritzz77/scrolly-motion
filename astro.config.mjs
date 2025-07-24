// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: 'https://lauritzz77.github.io',
  base: '/scrolly-motion',
  output: "static",
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
