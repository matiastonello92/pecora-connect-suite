import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Test-specific Vite configuration
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 8081,
    strictPort: true,
  },
  build: {
    outDir: "dist-test",
    sourcemap: true,
    minify: false, // Keep readable for debugging
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
          forms: ['react-hook-form', '@hookform/resolvers'],
          utils: ['date-fns', 'clsx', 'tailwind-merge']
        }
      }
    }
  },
  define: {
    __TEST_ENVIRONMENT__: true,
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __ENVIRONMENT__: JSON.stringify('test')
  },
  // Test-specific environment variables
  envPrefix: ['VITE_', 'SUPABASE_'],
  mode: 'test'
});