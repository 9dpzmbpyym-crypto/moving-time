import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// @ts-ignore - JSX source files from original project
import PackItUp, { LayoutEditor } from "./BedroomSlice.jsx";
// @ts-ignore
import SpritePreview from "./dev/spritePreview.jsx";
// @ts-ignore
import CardLayoutEditor from "./dev/cardLayoutEditor.jsx";
// @ts-ignore
import UiLayoutEditor from "./dev/uiLayoutEditor.jsx";

const params = new URLSearchParams(window.location.search);
const isPreview = params.get("preview") === "bed";
const isEditor = params.get("edit") === "1";
const isCardLayout = params.get("cards") === "1";
const isUiLayout = params.get("ui") === "1";
const uiPreview = params.get("uiPreview");
const requestedGlowMode = params.get("glow");
const glowMode =
  requestedGlowMode === "outline" || requestedGlowMode === "face"
    ? requestedGlowMode
    : "split";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isUiLayout ? (
      <UiLayoutEditor />
    ) : isCardLayout ? (
      <CardLayoutEditor />
    ) : isEditor ? (
      <LayoutEditor />
    ) : isPreview ? (
      <SpritePreview />
    ) : (
      <PackItUp glowMode={glowMode} initialScreen={uiPreview || "apartment"} />
    )}
  </StrictMode>
);
