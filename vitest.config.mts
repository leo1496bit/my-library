import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/e2e/**", "**/playwright/**"],
    // Fixe le fuseau du runner : sans ça, un test de formatage de date peut
    // passer sur une machine et échouer en CI selon le fuseau système (voir
    // le correctif de parseDateValue dans src/lib/format.ts pour le même
    // problème côté application).
    env: { TZ: "UTC" },
  },
});
