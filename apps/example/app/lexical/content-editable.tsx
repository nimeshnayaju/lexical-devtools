import {
  HTMLAttributes,
  useRef,
  useEffect,
  useCallback,
  useSyncExternalStore,
} from "react";
import { useComposer } from "./composer";

interface ContentEditableProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "contentEditable"> {}

export default function ContentEditable(props: ContentEditableProps) {
  const editor = useComposer();
  const containerRef = useRef<HTMLDivElement>(null);
  const isEditable = useIsEditable();

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;

    if (container.ownerDocument === null) return;

    if (container.ownerDocument.defaultView === null) return;

    editor.setRootElement(container);
    return () => {
      editor.setRootElement(null);
    };
  }, [editor]);

  return <div ref={containerRef} {...props} contentEditable={isEditable} />;
}

function useIsEditable(): boolean {
  const editor = useComposer();

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      return editor.registerEditableListener(onStoreChange);
    },
    [editor]
  );

  const getSnapshot = useCallback(() => {
    return editor.isEditable();
  }, [editor]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
