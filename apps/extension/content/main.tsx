import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";

const container = document.createElement("div");
document.body.appendChild(container);
const root = createRoot(container);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);
