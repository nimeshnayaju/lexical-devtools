export { $serializeEditor } from "./serialize-editor";
export type { SerializedEditorState } from "./serialize-editor";

export { isJsonArray, isJsonObject, isJsonScalar } from "./serialize-node";

export type {
  SerializedLexicalNode,
  SerializedRootNode,
  SerializedElementNode,
  SerializedDecoratorNode,
  SerializedLineBreakNode,
  SerializedTextNode,
  Json,
  JsonScalar,
  JsonArray,
  JsonObject,
} from "./serialize-node";

export type {
  SerializedPoint,
  SerializedBaseSelection,
  SerializedRangeSelection,
  SerializedNodeSelection,
  SerializedUnknownSelection,
  SerializedSelection,
} from "./serialize-selection";
