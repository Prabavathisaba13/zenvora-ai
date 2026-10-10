import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { getBackendPort } from "../backend/src/config.js";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5174,
    strictPort: true,
    proxy: {
      "/api": {
        target: `http://localhost:${getBackendPort()}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("highlight.js") || id.includes("rehype-highlight")) return "syntax-highlighting";
          if (id.includes("react-markdown") || id.includes("remark-") || id.includes("rehype-")) return "markdown";
          if (id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
          return undefined;
        },
      },
    },
  },
});
