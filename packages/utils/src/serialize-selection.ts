import {
  $isNodeSelection,
  $isRangeSelection,
  BaseSelection,
  NodeSelection,
  RangeSelection,
} from "lexical";

export default function $serializeSelection(
  selection: RangeSelection
): SerializedRangeSelection;

export default function $serializeSelection(
  selection: NodeSelection
): SerializedNodeSelection;

export default function $serializeSelection(
  selection: BaseSelection | null
): SerializedSelection | null;

export default function $serializeSelection(
  selection: BaseSelection | null
): SerializedSelection | null {
  if (selection === null) return null;

  const nodes = selection.getNodes().map((node) => node.getKey());

  if ($isRangeSelection(selection)) {
    return {
      type: "range",
      anchor: {
        key: selection.anchor.key,
        offset: selection.anchor.offset,
        type: selection.anchor.type,
      },
      focus: {
        key: selection.focus.key,
        offset: selection.focus.offset,
        type: selection.focus.type,
      },
      format: selection.format,
      nodes,
    };
  }

  if ($isNodeSelection(selection)) {
    return {
      type: "node",
      nodes,
    };
  }

  return {
    type: "unknown",
    nodes,
  };
}

export interface SerializedPoint {
  key: string;
  offset: number;
  type: "text" | "element";
}

export interface SerializedBaseSelection {
  nodes: string[];
}

export interface SerializedRangeSelection extends SerializedBaseSelection {
  type: "range";
  anchor: SerializedPoint;
  focus: SerializedPoint;
  format: number;
}

export interface SerializedNodeSelection extends SerializedBaseSelection {
  type: "node";
}

export interface SerializedUnknownSelection extends SerializedBaseSelection {
  type: "unknown";
}

export type SerializedSelection =
  | SerializedRangeSelection
  | SerializedNodeSelection
  | SerializedUnknownSelection;
