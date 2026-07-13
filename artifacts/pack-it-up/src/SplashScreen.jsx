import { useEffect, useState } from "react";
import splashUrl from "./assets/splash.png";
import { primeAudio } from "./gameAudio.js";

/**
 * Cold-boot splash. Shows the Pack It Up art on black; the whole screen is the
 * tap target. The tap dismisses it AND primes audio (the iOS Web Audio unlock
 * needs a user gesture). Fades into the game. Mounted once per page load, so it
 * never reappears on in-session navigation.
 */
export default function SplashScreen({ onDone }) {
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    // "ready" once mounted + a beat (hydration/assets). Static bundle ≈ instant.
    const t = setTimeout(() => setReady(true), 500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    if (!ready || leaving) return;
    try { primeAudio(); } catch {}
    if (reduce) { onDone(); return; }
    setLeaving(true);
    setTimeout(onDone, 300);
  };

  return (
    <div
      onClick={dismiss}
      role="button"
      aria-label={ready ? "Tap anywhere to start" : "Loading"}
      style={{
        position: "fixed", inset: 0, zIndex: 9999, background: "#090700",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        cursor: ready ? "pointer" : "default",
        opacity: leaving ? 0 : 1,
        transition: reduce ? "none" : "opacity 300ms ease",
        userSelect: "none", WebkitTapHighlightColor: "transparent", touchAction: "manipulation",
      }}
    >
      <img
        src={splashUrl}
        alt="Pack It Up"
        draggable={false}
        style={{ width: "min(82vw, 44vh)", maxWidth: 440, imageRendering: "pixelated", objectFit: "contain" }}
      />
      {/* The art already reads "packing…"; the actionable hint fades in when ready. */}
      <div
        style={{
          marginTop: 20, minHeight: 18,
          fontFamily: "monospace", letterSpacing: 1,
          color: "#E7D9B9", fontSize: 14,
          opacity: ready ? 0.92 : 0,
          transition: "opacity 260ms ease",
        }}
      >
        tap anywhere to start
      </div>
    </div>
  );
}
