import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PackItUp from "./BedroomSlice.jsx";
import SpritePreview from "./dev/spritePreview.jsx";

const isPreview = new URLSearchParams(window.location.search).get("preview") === "bed";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {isPreview ? <SpritePreview /> : <PackItUp />}
  </StrictMode>
);
