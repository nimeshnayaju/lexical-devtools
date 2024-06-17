import { useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useComposer } from "./composer";

export default function DecoratorsPlugin() {
  const editor = useComposer();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return editor.registerDecoratorListener(onStoreChange);
    },
    [editor]
  );

  const getSnapshot = useCallback(() => {
    return editor.getDecorators<JSX.Element>();
  }, [editor]);

  const decorators = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return Object.entries(decorators).map(([key, decorator]) => {
    const element = editor.getElementByKey(key);
    if (element === null) return null;

    return createPortal(decorator, element, key);
  });
}
