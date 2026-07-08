import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Force audio assets to be inlined as base64 data: URIs instead of emitted
    // as separate files. The hosted artifact's CSP blocks fetch() of the audio
    // URL, so the bytes must live inside the JS bundle; the sell-sound play path
    // decodes them via atob → decodeAudioData. (Vite 5.4 ignores the `?inline`
    // query, hence this function form.) Everything else keeps default handling.
    assetsInlineLimit: (filePath) => (/\.(mp3|wav|ogg|m4a)$/.test(filePath) ? true : undefined),
  },
});
