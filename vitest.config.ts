import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    server: {
      deps: {
        // next-intl imports `next/navigation` (extensionless) which Node ESM
        // can't resolve since next@16 ships no exports map — let Vite process it
        // https://next-intl.dev/docs/environments/testing
        inline: ["next-intl"],
      },
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
