import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Note: No tailwindcss import here for v3
export default defineConfig({
  plugins: [react()],
});
