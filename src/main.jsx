import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import PackItUp from "./BedroomSlice.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <PackItUp />
  </StrictMode>
);
