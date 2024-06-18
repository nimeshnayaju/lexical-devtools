import { startTransition, useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  right: number;
}

export default function App() {
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    function handlePointerOver(event: PointerEvent) {
      startTransition(() => setRect(null));
    }

    window.addEventListener("pointerover", handlePointerOver);
    return () => {
      window.removeEventListener("pointerover", handlePointerOver);
    };
  }, []);

  useEffect(() => {
    function handleCreateHighlight(rect: Rect) {
      startTransition(() => setRect(rect));
    }

    function handleRemoveHighlight() {
      startTransition(() => setRect(null));
    }

    function handleDevtoolsPanelUnloaded() {
      handleRemoveHighlight();
    }

    function handleMessage(message: any) {
      if (message.type === "CREATE_HIGHLIGHT") {
        if (message.payload === undefined) return;
        if (message.payload.rect === undefined) return;

        handleCreateHighlight(message.payload.rect);
      } else if (message.type === "REMOVE_HIGHLIGHT") {
        handleRemoveHighlight();
      } else if (message.type === "DEVTOOLS_PANEL_UNLOADED") {
        handleDevtoolsPanelUnloaded();
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  if (rect === null) return null;

  return createPortal(
    <span
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        transform: `translate(${rect.x + window.scrollX}px, ${rect.y + window.scrollY}px)`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        pointerEvents: "none",
        backgroundColor: "rgba(166, 195, 228, 0.6)",
      }}
    />,
    document.body
  );
}
