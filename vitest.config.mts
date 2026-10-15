import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // .claude/worktrees : copies de travail temporaires créées pour des
    // agents en parallèle (voir le tooling Claude Code) — contiennent les
    // mêmes fichiers de test que le repo principal et les feraient compter
    // en double si on ne les excluait pas.
    exclude: [
      "**/node_modules/**",
      "**/.next/**",
      "**/e2e/**",
      "**/playwright/**",
      "**/.claude/worktrees/**",
    ],
    // Fixe le fuseau du runner : sans ça, un test de formatage de date peut
    // passer sur une machine et échouer en CI selon le fuseau système (voir
    // le correctif de parseDateValue dans src/lib/format.ts pour le même
    // problème côté application).
    env: { TZ: "UTC" },
  },
});
