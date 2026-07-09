import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// When serving through a public HTTPS tunnel (localtunnel / cloudflare), set
// TUNNEL=1 so the Vite client connects HMR over wss://host:443.
const behindTunnel = process.env.TUNNEL === "1";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    strictPort: true,
    // Cloud / tunnel hosts change; don't block by Host header.
    allowedHosts: true,
    ...(behindTunnel
      ? {
          hmr: {
            clientPort: 443,
            protocol: "wss",
          },
        }
      : {}),
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    strictPort: true,
    allowedHosts: true,
  },
  build: {
    // Force audio assets to be inlined as base64 data: URIs instead of emitted
    // as separate files. The hosted artifact's CSP blocks fetch() of the audio
    // URL, so the bytes must live inside the JS bundle; the sell-sound play path
    // decodes them via atob → decodeAudioData. (Vite 5.4 ignores the `?inline`
    // query, hence this function form.) Everything else keeps default handling.
    assetsInlineLimit: (filePath) => (/\.(mp3|wav|ogg|m4a)$/.test(filePath) ? true : undefined),
  },
});
