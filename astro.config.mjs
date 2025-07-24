// @ts-check
import { defineConfig, envField, fontProviders } from "astro/config";
import { loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { storyblok } from "@storyblok/astro";
import mkcert from "vite-plugin-mkcert";
import netlify from "@astrojs/netlify";
// https://astro.build/config

const env = loadEnv("", process.cwd(), "");
const isEditor = env.BUILD_MODE === "editor";

// Netlify does not work with https version 6.5 storyblok preview only work with https 
// TODO: find a better solution for this
const isDev = process.env.NODE_ENV === "development";

export default defineConfig({
  adapter: isDev ? undefined : netlify(),
  output: "server",
  prefetch: true,
  devToolbar: {
    enabled: false,
  },
  integrations: [
    storyblok({
      accessToken: env.STORYBLOK_TOKEN,
      livePreview: isEditor,
      bridge: isEditor,
    }),
  ],
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
  env: {
    schema: {
      BUILD_MODE: envField.enum({
        values: ["editor", "production"],
        context: "client",
        access: "public",
      }),
      SITE_URL: envField.string({ context: "server", access: "public" }),
      STORYBLOK_TOKEN: envField.string({ context: "server", access: "secret" }),
      STORYBLOK_CONTENT_VERSION: envField.enum({
        values: ["draft", "published"],
        context: "server",
        access: "public",
      }),
      STORYBLOK_STARTS_WITH_FOLDER: envField.string({ context: "server", access: "public" }),
      STORYBLOK_STARTS_WITH_FOLDER_CONTENT: envField.string({ context: "server", access: "public" }),
      BUNNY_TOKEN: envField.string({ context: "server", access: "secret", optional: true }),
    },
  },
  vite: {
    plugins: [tailwindcss(), isDev && mkcert()],
  },
});
