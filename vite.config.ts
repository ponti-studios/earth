import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import devtoolsJson from "vite-plugin-devtools-json";
import { defineConfig } from "vite";

export default defineConfig({
  envDir: false,
  plugins: [devtoolsJson(), tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    cssMinify: "esbuild",
    chunkSizeWarningLimit: 2000,
  },
  server: {
    port: Number(process.env.PORT) || 3006,
    strictPort: true,
    fs: {
      strict: false,
    },
  },
});
