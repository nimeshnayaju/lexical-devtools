import { useEffect } from "react";
import { useComposer } from "./composer";
import { HistoryState, registerHistory } from "@lexical/history";

/**
 * Creates an empty history state.
 * @returns - The empty history state, as an object.
 */
function createEmptyHistoryState(): HistoryState {
  return {
    current: null,
    redoStack: [],
    undoStack: [],
  };
}

export default function HistoryPlugin(props: {
  state?: HistoryState;
  delay?: number;
}) {
  const editor = useComposer();

  useEffect(() => {
    const state = props.state ?? createEmptyHistoryState();
    const delay = props.delay ?? 1000;

    return registerHistory(editor, state, delay);
  }, [editor, props.state, props.delay]);

  return null;
}
