/* Art cache warmer — kills pop-in after the un-inlining of the bundle.
 *
 * Images ship as separate hashed files now (see vite.config note); on a cold
 * cache each PNG used to appear a beat after layout. This warms the browser
 * cache in two waves:
 *   wave 1 (during the splash gate): task-card art + screen chrome — the
 *          pieces whose pop-in is most visible.
 *   wave 2 (idle): the sliced screen art (menu/health/board) + calendar.
 * Storage item sprites (normalized/, 150+ files) stay fully lazy — they're
 * behind container taps and never all visible at once.
 *
 * import.meta.glob with query '?url' only adds URL strings to the bundle.
 */

const CARDS = import.meta.glob("./assets/items/task_card_assets/**/*.png", {
  eager: true, query: "?url", import: "default",
});
const CHROME = import.meta.glob(
  ["./assets/ui_screen_chrome/*.png", "./assets/ui_chrome/*.png"],
  { eager: true, query: "?url", import: "default" },
);
const SLICES = import.meta.glob(
  [
    "./assets/items/packitup_cropped_assets/ui_mockups/*_slices/*.png",
    "./assets/calendar/*.png",
  ],
  { eager: true, query: "?url", import: "default" },
);

function warm(urls) {
  for (const url of urls) {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
  }
}

let warmed = false;

/** Call once at boot (the splash gate). Safe to call again — no-ops. */
export function warmArtCache() {
  if (warmed || typeof window === "undefined") return;
  warmed = true;
  warm(Object.values(CARDS));
  warm(Object.values(CHROME));
  const later = () => warm(Object.values(SLICES));
  if ("requestIdleCallback" in window) window.requestIdleCallback(later, { timeout: 4000 });
  else setTimeout(later, 1500);
}
