import { defineConfig } from "@solidjs/start/config";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  vite: {
    plugins: [
      tailwindcss(),
      visualizer({
        emitFile: true,
        filename: "stats.html", // File created in your project root
        gzipSize: true,        // Shows compressed sizes
        brotliSize: true,      // Shows advanced compressed sizes
      })
    ],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string | string[]) {
            if (id.includes("node_modules/google-protobuf")) {
              return "vendor-protobuf";
            }
            if (id.includes("node_modules/grpc-web")) {
              return "vendor-grpc";
            }
            if (id.includes("node_modules/bbthings_grpc")) {
              return "vendor-bbthings";
            }
            if (id.includes("node_modules/echarts")) {
              return "vendor-echarts";
            }
          }
        }
      }
    },
  },
  ssr: false, // Disables server-side rendering completely
  server: {
    preset: "static" // Forces a static, client-side only build output
  }
});
