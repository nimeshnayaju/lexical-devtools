import { $canShowPlaceholder } from "@lexical/text";
import { mergeRegister } from "@lexical/utils";
import { ReactNode, useCallback, useSyncExternalStore } from "react";
import { useComposer } from "./composer";

export default function Placeholder({ children }: { children: ReactNode }) {
  const editor = useComposer();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return mergeRegister(
        editor.registerUpdateListener(onStoreChange),
        editor.registerEditableListener(onStoreChange)
      );
    },
    [editor]
  );

  const getSnapshot = useCallback(() => {
    return editor
      .getEditorState()
      .read(() => $canShowPlaceholder(editor.isComposing()));
  }, [editor]);

  const canShowPlaceholder = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot
  );

  if (!canShowPlaceholder) return null;

  return children;
}
