import { $getRoot, $getSelection, LexicalEditor } from "lexical";
import $serializeNode, { SerializedRootNode } from "./serialize-node";
import $serializeSelection, {
  SerializedSelection,
} from "./serialize-selection";

export interface SerializedEditorState {
  id: string;
  namespace: string;
  root: SerializedRootNode;
  selection: SerializedSelection | null;
  version: 0.1;
}

export function $serializeEditor(editor: LexicalEditor): SerializedEditorState {
  const root = $serializeNode($getRoot());
  const selection = $serializeSelection($getSelection());

  return {
    id: editor.getKey(),
    namespace: editor._config.namespace,
    root,
    selection,
    version: 0.1,
  };
}
