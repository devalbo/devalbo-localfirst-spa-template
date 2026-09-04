import { execSync } from "node:child_process";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import pkg from "./package.json" with { type: "json" };

function git(command: string): string {
  try {
    return execSync(command, { encoding: "utf8" }).trim();
  } catch {
    // No git context (tarball, detached worktree). Mark it rather than emitting "".
    return "nogit";
  }
}

export default defineConfig({
  // The router plugin must run before the React plugin.
  plugins: [tanstackRouter({ target: "react", autoCodeSplitting: true }), react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_COMMIT_SHA__: JSON.stringify(git("git rev-parse --short HEAD")),
    __GIT_BRANCH__: JSON.stringify(git("git rev-parse --abbrev-ref HEAD")),
    __BUILD_TIMESTAMP__: JSON.stringify(new Date().toISOString()),
    __BUILD_ENV__: JSON.stringify(process.env["NODE_ENV"] ?? "development"),
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
      exclude: ["src/gen/**", "src/main.tsx", "**/*.config.ts"],
    },
  },
});
