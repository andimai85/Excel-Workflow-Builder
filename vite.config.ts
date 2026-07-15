// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

const offlineShellRevision = String(Date.now());

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      devOptions: { enabled: false },
      includeAssets: ["favicon.ico", "pwa-512.png"],
      manifest: {
        name: "Workflow-Generator",
        short_name: "Workflows",
        description:
          "Offline Workflow-Generator: Excel-Workflows mit RACI, Phasen und Meilensteinen visualisieren.",
        theme_color: "#1e40af",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        scope: "/",
        lang: "de",
        icons: [
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        additionalManifestEntries: [{ url: "/", revision: offlineShellRevision }],
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\.(?:js|css|woff2?)$/.test(url.pathname),
            handler: "CacheFirst",
            options: { cacheName: "assets" },
          },
        ],
      },
    }),
  ],
});
