import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PackItUp, { LayoutEditor } from "./BedroomSlice.jsx";
import SpritePreview from "./dev/spritePreview.jsx";

const isPreview = new URLSearchParams(window.location.search).get("preview") === "bed";
const isEditor = new URLSearchParams(window.location.search).get("edit") === "1";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isEditor ? <LayoutEditor /> : isPreview ? <SpritePreview /> : <PackItUp />}
  </StrictMode>
);
