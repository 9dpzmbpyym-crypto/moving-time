import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Force audio + the cat sprite sheet to be inlined as base64 data: URIs
    // instead of emitted as separate files. The hosted artifact's CSP blocks
    // loading external URLs, so the bytes must live inside the bundle: the sell
    // sound decodes via atob → decodeAudioData, and Stretchy's sheet is used as
    // a data: background-image. (Vite 5.4 ignores the `?inline` query, hence
    // this function form.) Everything else keeps default handling.
    assetsInlineLimit: (filePath) => (/\.(mp3|wav|ogg|m4a|png)$/.test(filePath) ? true : undefined),
  },
});
