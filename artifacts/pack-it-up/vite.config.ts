import path from 'path';
import { execSync } from 'child_process';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

// Short id of the commit this bundle was built from, so the running app can show
// which build is live (Vercel sets VERCEL_GIT_COMMIT_SHA; fall back to local git).
const buildId = (
  process.env.VERCEL_GIT_COMMIT_SHA
  || (() => { try { return execSync('git rev-parse HEAD').toString().trim(); } catch { return ''; } })()
).slice(0, 7) || 'dev';

const rawPort = process.env.PORT ?? (process.env.VERCEL ? "4173" : undefined);

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? (process.env.VERCEL ? "/" : undefined);

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

export default defineConfig({
  base: basePath,
  define: {
    __BUILD_ID__: JSON.stringify(buildId),
  },
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
    // NOTE: we previously force-inlined every png/mp3 as base64 for the old
    // claude.ai artifact CSP. On Vercel (own origin) that produced a 17 MB JS
    // bundle — the whole art set parsed and held in memory at once, which is
    // what got the iOS home-screen webview killed. Default inline limit keeps
    // images as separate cacheable files the browser loads and evicts lazily.
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
