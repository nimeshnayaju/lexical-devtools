import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./app";
import { RootStoreProvider } from "./root-store-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootStoreProvider>
      <App />
    </RootStoreProvider>
  </StrictMode>
);
