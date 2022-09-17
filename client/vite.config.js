import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
    build: {
        lib: {
            name: "GlobalAuth",
            fileName: "globalauth",
            entry: resolve(__dirname, "lib", "client.js"),
        },
        rollupOptions: {
            external: [],
            output: { globals: {} },
        },
    },
});